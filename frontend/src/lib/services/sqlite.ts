/**
 * SQLiteAdapter — implements DataService for native platforms (Capacitor).
 *
 * Uses @capacitor-community/sqlite for database operations.
 * Image storage: @capacitor/filesystem on Android/iOS, Electron IPC bridge on desktop.
 */
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { isElectron } from '$lib/utils/platform.js';
import {
	CapacitorSQLite,
	SQLiteConnection,
	type SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import type {
	User,
	CreateUserData,
	UpdateUserData,
	TradingAccount,
	CreateAccountData,
	UpdateAccountData,
	TradePosition,
	CreateTradeData,
	UpdateTradeData,
	TradeImage,
	TradeFilters,
	Ticker,
	AssetClass,
} from '$lib/types/index.js';
import type { DataService, PaginatedResult } from './types.js';

const DB_NAME = 'talaan_journal';
const IMAGE_DIR = 'trade_images';

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL,
  password_hash TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  security_q TEXT,
  security_a TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trading_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  starting_capital REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trade_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  ticker_symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price REAL NOT NULL,
  stop_loss REAL NOT NULL,
  take_profit REAL NOT NULL,
  position_size REAL,
  exit_price REAL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  rr_ratio REAL,
  pnl_amount REAL,
  pnl_percent REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (account_id) REFERENCES trading_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trade_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (trade_id) REFERENCES trade_positions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tickers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  asset_class TEXT NOT NULL CHECK (asset_class IN ('stock', 'forex', 'crypto')),
  exchange TEXT,
  base_currency TEXT,
  quote_currency TEXT
);
`;

interface TickerRow {
	id: number;
	symbol: string;
	name: string;
	asset_class: string;
	exchange: string | null;
	base_currency: string | null;
	quote_currency: string | null;
}

interface TickersJson {
	stocks: { symbol: string; name: string; exchange: string }[];
	forex: { symbol: string; name: string; baseCurrency: string; quoteCurrency: string }[];
	crypto: { symbol: string; name: string; baseCurrency: string; quoteCurrency: string }[];
}

export class SQLiteAdapter implements DataService {
	private initialized = false;
	private db!: SQLiteDBConnection;
	private sqlite: SQLiteConnection;
	private _isElectron = false;

	constructor() {
		this.sqlite = new SQLiteConnection(CapacitorSQLite);
	}

	async initialize(): Promise<void> {
		if (this.initialized) return;

		this._isElectron = isElectron();

		const ret = await this.sqlite.checkConnectionsConsistency();
		const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;

		if (ret.result && isConn) {
			this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
		} else {
			this.db = await this.sqlite.createConnection(
				DB_NAME,
				false,
				'no-encryption',
				1,
				false,
			);
		}

		await this.db.open();

		// Enable foreign keys
		await this.db.execute('PRAGMA foreign_keys = ON;');

		// Create tables
		await this.db.execute(CREATE_TABLES_SQL);

		// Seed tickers on first run
		await this.seedTickers();

		// Ensure image directory exists
		try {
			if (this._isElectron) {
				await window.electronFS!.mkdir(IMAGE_DIR);
			} else {
				await Filesystem.mkdir({
					path: IMAGE_DIR,
					directory: Directory.Data,
					recursive: true,
				});
			}
		} catch {
			// Directory already exists
		}

		this.initialized = true;
	}

	private async seedTickers(): Promise<void> {
		const countResult = await this.db.query('SELECT COUNT(*) as count FROM tickers;');
		const count = countResult.values?.[0]?.count ?? 0;
		if (count > 0) return;

		const response = await fetch('/data/tickers.json');
		const data: TickersJson = await response.json();

		const statements: string[] = [];
		const allTickers: { symbol: string; name: string; assetClass: AssetClass; exchange: string | null; baseCurrency: string | null; quoteCurrency: string | null }[] = [];

		for (const stock of data.stocks) {
			allTickers.push({ symbol: stock.symbol, name: stock.name, assetClass: 'stock', exchange: stock.exchange, baseCurrency: null, quoteCurrency: null });
		}
		for (const forex of data.forex) {
			allTickers.push({ symbol: forex.symbol, name: forex.name, assetClass: 'forex', exchange: null, baseCurrency: forex.baseCurrency, quoteCurrency: forex.quoteCurrency });
		}
		for (const crypto of data.crypto) {
			allTickers.push({ symbol: crypto.symbol, name: crypto.name, assetClass: 'crypto', exchange: null, baseCurrency: crypto.baseCurrency, quoteCurrency: crypto.quoteCurrency });
		}

		for (const t of allTickers) {
			const escapedName = t.name.replace(/'/g, "''");
			statements.push(
				`INSERT OR IGNORE INTO tickers (symbol, name, asset_class, exchange, base_currency, quote_currency) VALUES ('${t.symbol}', '${escapedName}', '${t.assetClass}', ${t.exchange ? `'${t.exchange}'` : 'NULL'}, ${t.baseCurrency ? `'${t.baseCurrency}'` : 'NULL'}, ${t.quoteCurrency ? `'${t.quoteCurrency}'` : 'NULL'});`,
			);
		}

		if (statements.length > 0) {
			await this.db.execute(statements.join('\n'));
		}
	}

	// --- Row mapping helpers ---

	private mapRowToUser(row: Record<string, unknown>): User {
		return {
			id: String(row.id),
			displayName: row.display_name as string,
			passwordHash: (row.password_hash as string) ?? null,
			timezone: row.timezone as string,
			securityQ: (row.security_q as string) ?? null,
			securityA: (row.security_a as string) ?? null,
			createdAt: row.created_at as string,
			updatedAt: row.updated_at as string,
		};
	}

	private mapRowToAccount(row: Record<string, unknown>): TradingAccount {
		return {
			id: String(row.id),
			user: String(row.user_id),
			name: row.name as string,
			description: (row.description as string) ?? null,
			currency: row.currency as string,
			startingCapital: row.starting_capital as number,
			createdAt: row.created_at as string,
			updatedAt: row.updated_at as string,
		};
	}

	private mapRowToTrade(row: Record<string, unknown>): TradePosition {
		return {
			id: String(row.id),
			account: String(row.account_id),
			date: row.date as string,
			tickerSymbol: row.ticker_symbol as string,
			direction: row.direction as 'long' | 'short',
			entryPrice: row.entry_price as number,
			stopLoss: row.stop_loss as number,
			takeProfit: row.take_profit as number,
			positionSize: (row.position_size as number) ?? null,
			exitPrice: (row.exit_price as number) ?? null,
			status: row.status as 'open' | 'closed',
			rrRatio: (row.rr_ratio as number) ?? null,
			pnlAmount: (row.pnl_amount as number) ?? null,
			pnlPercent: (row.pnl_percent as number) ?? null,
			notes: (row.notes as string) ?? null,
			createdAt: row.created_at as string,
			updatedAt: row.updated_at as string,
		};
	}

	private mapRowToImage(row: Record<string, unknown>): TradeImage {
		const filePath = row.file_path as string;
		return {
			id: String(row.id),
			trade: String(row.trade_id),
			fileName: row.file_name as string,
			mimeType: row.mime_type as string,
			filePath,
			sortOrder: row.sort_order as number,
			url: this._isElectron ? `file://${filePath}` : Capacitor.convertFileSrc(filePath),
			createdAt: row.created_at as string,
		};
	}

	private mapRowToTicker(row: Record<string, unknown>): Ticker {
		return {
			symbol: row.symbol as string,
			name: row.name as string,
			assetClass: row.asset_class as AssetClass,
			exchange: (row.exchange as string) ?? null,
			baseCurrency: (row.base_currency as string) ?? null,
			quoteCurrency: (row.quote_currency as string) ?? null,
		};
	}

	// --- User ---

	async getUser(): Promise<User | null> {
		await this.initialize();
		const result = await this.db.query('SELECT * FROM users LIMIT 1;');
		if (!result.values || result.values.length === 0) return null;
		return this.mapRowToUser(result.values[0]);
	}

	async createUser(data: CreateUserData): Promise<User> {
		await this.initialize();
		const now = new Date().toISOString();
		const result = await this.db.run(
			`INSERT INTO users (display_name, password_hash, timezone, security_q, security_a, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?);`,
			[
				data.displayName,
				data.password ?? null,
				data.timezone,
				data.securityQ ?? null,
				data.securityA ?? null,
				now,
				now,
			],
		);
		const id = result.changes?.lastId;
		const user = await this.db.query('SELECT * FROM users WHERE id = ?;', [id]);
		return this.mapRowToUser(user.values![0]);
	}

	async updateUser(id: string, data: UpdateUserData): Promise<User> {
		await this.initialize();
		const sets: string[] = [];
		const values: unknown[] = [];

		if (data.displayName !== undefined) {
			sets.push('display_name = ?');
			values.push(data.displayName);
		}
		if (data.passwordHash !== undefined) {
			sets.push('password_hash = ?');
			values.push(data.passwordHash);
		}
		if (data.timezone !== undefined) {
			sets.push('timezone = ?');
			values.push(data.timezone);
		}
		if (data.securityQ !== undefined) {
			sets.push('security_q = ?');
			values.push(data.securityQ);
		}
		if (data.securityA !== undefined) {
			sets.push('security_a = ?');
			values.push(data.securityA);
		}

		if (sets.length > 0) {
			sets.push("updated_at = ?");
			values.push(new Date().toISOString());
			values.push(Number(id));
			await this.db.run(
				`UPDATE users SET ${sets.join(', ')} WHERE id = ?;`,
				values,
			);
		}

		const result = await this.db.query('SELECT * FROM users WHERE id = ?;', [Number(id)]);
		return this.mapRowToUser(result.values![0]);
	}

	// --- Trading Accounts ---

	async getAccounts(): Promise<TradingAccount[]> {
		await this.initialize();
		const result = await this.db.query(
			'SELECT * FROM trading_accounts ORDER BY created_at;',
		);
		return (result.values ?? []).map((row) => this.mapRowToAccount(row));
	}

	async createAccount(data: CreateAccountData): Promise<TradingAccount> {
		await this.initialize();
		const now = new Date().toISOString();
		const result = await this.db.run(
			`INSERT INTO trading_accounts (user_id, name, description, currency, starting_capital, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?);`,
			[
				Number(data.user),
				data.name,
				data.description ?? null,
				data.currency ?? 'USD',
				data.startingCapital,
				now,
				now,
			],
		);
		const id = result.changes?.lastId;
		const account = await this.db.query(
			'SELECT * FROM trading_accounts WHERE id = ?;',
			[id],
		);
		return this.mapRowToAccount(account.values![0]);
	}

	async updateAccount(
		id: string,
		data: UpdateAccountData,
	): Promise<TradingAccount> {
		await this.initialize();
		const sets: string[] = [];
		const values: unknown[] = [];

		if (data.name !== undefined) {
			sets.push('name = ?');
			values.push(data.name);
		}
		if (data.description !== undefined) {
			sets.push('description = ?');
			values.push(data.description);
		}
		if (data.currency !== undefined) {
			sets.push('currency = ?');
			values.push(data.currency);
		}
		if (data.startingCapital !== undefined) {
			sets.push('starting_capital = ?');
			values.push(data.startingCapital);
		}

		if (sets.length > 0) {
			sets.push("updated_at = ?");
			values.push(new Date().toISOString());
			values.push(Number(id));
			await this.db.run(
				`UPDATE trading_accounts SET ${sets.join(', ')} WHERE id = ?;`,
				values,
			);
		}

		const result = await this.db.query(
			'SELECT * FROM trading_accounts WHERE id = ?;',
			[Number(id)],
		);
		return this.mapRowToAccount(result.values![0]);
	}

	async deleteAccount(id: string): Promise<void> {
		await this.initialize();
		// Delete image files for all trades in this account
		const trades = await this.db.query(
			'SELECT id FROM trade_positions WHERE account_id = ?;',
			[Number(id)],
		);
		for (const trade of trades.values ?? []) {
			const images = await this.db.query(
				'SELECT file_path FROM trade_images WHERE trade_id = ?;',
				[trade.id],
			);
			for (const img of images.values ?? []) {
				try {
					if (this._isElectron) {
						await window.electronFS!.deleteFile(img.file_path as string);
					} else {
						await Filesystem.deleteFile({ path: img.file_path as string });
					}
				} catch {
					// File may already be deleted
				}
			}
		}
		await this.db.run('DELETE FROM trading_accounts WHERE id = ?;', [
			Number(id),
		]);
	}

	// --- Trade Positions ---

	async getTrades(
		filters?: TradeFilters,
	): Promise<PaginatedResult<TradePosition>> {
		await this.initialize();
		const wheres: string[] = [];
		const params: unknown[] = [];

		if (filters?.accountId) {
			wheres.push('account_id = ?');
			params.push(Number(filters.accountId));
		}
		if (filters?.status) {
			wheres.push('status = ?');
			params.push(filters.status);
		}
		if (filters?.dateStart) {
			wheres.push('date >= ?');
			params.push(filters.dateStart);
		}
		if (filters?.dateEnd) {
			wheres.push('date <= ?');
			params.push(filters.dateEnd);
		}

		const whereClause =
			wheres.length > 0 ? `WHERE ${wheres.join(' AND ')}` : '';

		// Count total docs
		const countResult = await this.db.query(
			`SELECT COUNT(*) as count FROM trade_positions ${whereClause};`,
			params,
		);
		const totalDocs = (countResult.values?.[0]?.count as number) ?? 0;

		const limit = filters?.limit ?? 50;
		const page = filters?.page ?? 1;
		const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
		const offset = (page - 1) * limit;

		const result = await this.db.query(
			`SELECT * FROM trade_positions ${whereClause} ORDER BY date DESC LIMIT ? OFFSET ?;`,
			[...params, limit, offset],
		);

		return {
			docs: (result.values ?? []).map((row) => this.mapRowToTrade(row)),
			totalDocs,
			totalPages,
			page,
			limit,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
		};
	}

	async getTrade(id: string): Promise<TradePosition | null> {
		await this.initialize();
		const result = await this.db.query(
			'SELECT * FROM trade_positions WHERE id = ?;',
			[Number(id)],
		);
		if (!result.values || result.values.length === 0) return null;
		return this.mapRowToTrade(result.values[0]);
	}

	async getTradesByDateRange(
		start: string,
		end: string,
		accountId?: string,
	): Promise<TradePosition[]> {
		await this.initialize();
		const params: unknown[] = [start, end];
		let accountClause = '';
		if (accountId) {
			accountClause = ' AND account_id = ?';
			params.push(Number(accountId));
		}

		const result = await this.db.query(
			`SELECT * FROM trade_positions WHERE date >= ? AND date <= ? AND status = 'closed'${accountClause} LIMIT 10000;`,
			params,
		);
		return (result.values ?? []).map((row) => this.mapRowToTrade(row));
	}

	async createTrade(data: CreateTradeData): Promise<TradePosition> {
		await this.initialize();
		const now = new Date().toISOString();
		const result = await this.db.run(
			`INSERT INTO trade_positions (account_id, date, ticker_symbol, direction, entry_price, stop_loss, take_profit, position_size, exit_price, status, rr_ratio, pnl_amount, pnl_percent, notes, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
			[
				Number(data.account),
				data.date,
				data.tickerSymbol,
				data.direction,
				data.entryPrice,
				data.stopLoss,
				data.takeProfit,
				data.positionSize ?? null,
				data.exitPrice ?? null,
				data.status ?? 'open',
				data.rrRatio ?? null,
				data.pnlAmount ?? null,
				data.pnlPercent ?? null,
				data.notes ?? null,
				now,
				now,
			],
		);
		const id = result.changes?.lastId;
		const trade = await this.db.query(
			'SELECT * FROM trade_positions WHERE id = ?;',
			[id],
		);
		return this.mapRowToTrade(trade.values![0]);
	}

	async updateTrade(
		id: string,
		data: UpdateTradeData,
	): Promise<TradePosition> {
		await this.initialize();
		// Strip account field (read-only after creation)
		const { account: _account, ...updateData } = data as UpdateTradeData & {
			account?: unknown;
		};

		const fieldMap: Record<string, string> = {
			date: 'date',
			tickerSymbol: 'ticker_symbol',
			direction: 'direction',
			entryPrice: 'entry_price',
			stopLoss: 'stop_loss',
			takeProfit: 'take_profit',
			positionSize: 'position_size',
			exitPrice: 'exit_price',
			status: 'status',
			rrRatio: 'rr_ratio',
			pnlAmount: 'pnl_amount',
			pnlPercent: 'pnl_percent',
			notes: 'notes',
		};

		const sets: string[] = [];
		const values: unknown[] = [];

		for (const [key, column] of Object.entries(fieldMap)) {
			const value = (updateData as Record<string, unknown>)[key];
			if (value !== undefined) {
				sets.push(`${column} = ?`);
				values.push(value);
			}
		}

		if (sets.length > 0) {
			sets.push("updated_at = ?");
			values.push(new Date().toISOString());
			values.push(Number(id));
			await this.db.run(
				`UPDATE trade_positions SET ${sets.join(', ')} WHERE id = ?;`,
				values,
			);
		}

		const result = await this.db.query(
			'SELECT * FROM trade_positions WHERE id = ?;',
			[Number(id)],
		);
		return this.mapRowToTrade(result.values![0]);
	}

	async deleteTrade(id: string): Promise<void> {
		await this.initialize();
		// Delete image files from filesystem first
		const images = await this.db.query(
			'SELECT file_path FROM trade_images WHERE trade_id = ?;',
			[Number(id)],
		);
		for (const img of images.values ?? []) {
			try {
				if (this._isElectron) {
					await window.electronFS!.deleteFile(img.file_path as string);
				} else {
					await Filesystem.deleteFile({ path: img.file_path as string });
				}
			} catch {
				// File may already be deleted
			}
		}
		await this.db.run('DELETE FROM trade_positions WHERE id = ?;', [
			Number(id),
		]);
	}

	// --- Trade Images ---

	async getTradeImages(tradeId: string): Promise<TradeImage[]> {
		await this.initialize();
		const result = await this.db.query(
			'SELECT * FROM trade_images WHERE trade_id = ? ORDER BY sort_order;',
			[Number(tradeId)],
		);
		return (result.values ?? []).map((row) => this.mapRowToImage(row));
	}

	async uploadImage(tradeId: string, file: File): Promise<TradeImage> {
		await this.initialize();
		// Convert File to base64
		const arrayBuffer = await file.arrayBuffer();
		const bytes = new Uint8Array(arrayBuffer);
		let binary = '';
		for (let i = 0; i < bytes.length; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		const base64Data = btoa(binary);

		const fileName = `${Date.now()}_${file.name}`;
		const filePath = `${IMAGE_DIR}/${fileName}`;

		// Write file to filesystem
		let fullPath: string;
		if (this._isElectron) {
			fullPath = await window.electronFS!.writeFile(filePath, base64Data);
		} else {
			const writeResult = await Filesystem.writeFile({
				path: filePath,
				data: base64Data,
				directory: Directory.Data,
			});
			fullPath = writeResult.uri;
		}

		// Insert DB record
		const now = new Date().toISOString();
		const result = await this.db.run(
			`INSERT INTO trade_images (trade_id, file_name, mime_type, file_path, sort_order, created_at)
			 VALUES (?, ?, ?, ?, 0, ?);`,
			[Number(tradeId), fileName, file.type, fullPath, now],
		);

		const id = result.changes?.lastId;
		const image = await this.db.query(
			'SELECT * FROM trade_images WHERE id = ?;',
			[id],
		);
		return this.mapRowToImage(image.values![0]);
	}

	async deleteImage(id: string): Promise<void> {
		await this.initialize();
		// Get file path before deleting
		const result = await this.db.query(
			'SELECT file_path FROM trade_images WHERE id = ?;',
			[Number(id)],
		);
		if (result.values && result.values.length > 0) {
			try {
				if (this._isElectron) {
					await window.electronFS!.deleteFile(result.values[0].file_path as string);
				} else {
					await Filesystem.deleteFile({
						path: result.values[0].file_path as string,
					});
				}
			} catch {
				// File may already be deleted
			}
		}
		await this.db.run('DELETE FROM trade_images WHERE id = ?;', [Number(id)]);
	}

	// --- Tickers ---

	async searchTickers(query: string): Promise<Ticker[]> {
		await this.initialize();
		const pattern = `%${query}%`;
		const result = await this.db.query(
			'SELECT * FROM tickers WHERE symbol LIKE ? OR name LIKE ? LIMIT 20;',
			[pattern, pattern],
		);
		return (result.values ?? []).map((row) => this.mapRowToTicker(row));
	}

	async getRecentTickers(limit: number): Promise<string[]> {
		await this.initialize();
		const result = await this.db.query(
			`SELECT ticker_symbol, MAX(date) as latest_date
			 FROM trade_positions
			 GROUP BY ticker_symbol
			 ORDER BY latest_date DESC
			 LIMIT ?;`,
			[limit],
		);
		return (result.values ?? []).map(
			(row) => row.ticker_symbol as string,
		);
	}
}
