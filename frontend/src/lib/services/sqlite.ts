/**
 * SQLiteAdapter — implements DataService for mobile (Capacitor).
 *
 * Uses @capacitor-community/sqlite for database operations
 * and @capacitor/filesystem for image storage.
 *
 * This adapter is only loaded on native platforms and will be
 * implemented fully when mobile development begins.
 * For now it provides the interface contract.
 */
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
} from '$lib/types/index.js';
import type { DataService, PaginatedResult } from './types.js';

export class SQLiteAdapter implements DataService {
	private initialized = false;

	async initialize(): Promise<void> {
		if (this.initialized) return;
		// SQLite database initialization will be implemented
		// when mobile development begins (Phase 9 / T061)
		this.initialized = true;
	}

	async getUser(): Promise<User | null> {
		await this.initialize();
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async createUser(_data: CreateUserData): Promise<User> {
		await this.initialize();
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async updateUser(_id: string, _data: UpdateUserData): Promise<User> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async getAccounts(): Promise<TradingAccount[]> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async createAccount(_data: CreateAccountData): Promise<TradingAccount> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async updateAccount(
		_id: string,
		_data: UpdateAccountData,
	): Promise<TradingAccount> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async deleteAccount(_id: string): Promise<void> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async getTrades(
		_filters?: TradeFilters,
	): Promise<PaginatedResult<TradePosition>> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async getTrade(_id: string): Promise<TradePosition | null> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async getTradesByDateRange(
		_start: string,
		_end: string,
		_accountId?: string,
	): Promise<TradePosition[]> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async createTrade(_data: CreateTradeData): Promise<TradePosition> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async updateTrade(
		_id: string,
		_data: UpdateTradeData,
	): Promise<TradePosition> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async deleteTrade(_id: string): Promise<void> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async getTradeImages(_tradeId: string): Promise<TradeImage[]> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async uploadImage(_tradeId: string, _file: File): Promise<TradeImage> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async deleteImage(_id: string): Promise<void> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async searchTickers(_query: string): Promise<Ticker[]> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}

	async getRecentTickers(_limit: number): Promise<string[]> {
		throw new Error('SQLiteAdapter: not yet implemented');
	}
}
