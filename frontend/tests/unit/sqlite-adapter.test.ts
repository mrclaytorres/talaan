import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockRun = vi.fn();
const mockQuery = vi.fn();
const mockExecute = vi.fn();
const mockOpen = vi.fn();
const mockDbConnection = {
	open: mockOpen,
	execute: mockExecute,
	run: mockRun,
	query: mockQuery,
};

const mockCreateConnection = vi.fn().mockResolvedValue(mockDbConnection);
const mockRetrieveConnection = vi.fn().mockResolvedValue(mockDbConnection);
const mockCheckConnectionsConsistency = vi.fn().mockResolvedValue({ result: false });
const mockIsConnection = vi.fn().mockResolvedValue({ result: false });

vi.mock('@capacitor-community/sqlite', () => {
	// Must use a regular function (not arrow) so it can be called with `new`
	function MockSQLiteConnection() {
		return {
			createConnection: mockCreateConnection,
			retrieveConnection: mockRetrieveConnection,
			checkConnectionsConsistency: mockCheckConnectionsConsistency,
			isConnection: mockIsConnection,
		};
	}
	return {
		CapacitorSQLite: {},
		SQLiteConnection: MockSQLiteConnection,
	};
});

const mockWriteFile = vi.fn().mockResolvedValue({ uri: 'file:///data/trade_images/123_photo.jpg' });
const mockDeleteFile = vi.fn().mockResolvedValue(undefined);
const mockMkdir = vi.fn().mockResolvedValue(undefined);

vi.mock('@capacitor/filesystem', () => ({
	Filesystem: {
		writeFile: (...args: unknown[]) => mockWriteFile(...args),
		deleteFile: (...args: unknown[]) => mockDeleteFile(...args),
		mkdir: (...args: unknown[]) => mockMkdir(...args),
	},
	Directory: {
		Data: 'DATA',
	},
}));

vi.mock('@capacitor/core', () => ({
	Capacitor: {
		convertFileSrc: (path: string) => `https://localhost/_capacitor_file_${path}`,
	},
}));

// Mock fetch for ticker seeding
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { SQLiteAdapter } from '$lib/services/sqlite.js';

function resetMocks() {
	mockRun.mockReset();
	mockQuery.mockReset();
	mockExecute.mockReset();
	mockOpen.mockReset();
	mockCreateConnection.mockReset().mockResolvedValue(mockDbConnection);
	mockRetrieveConnection.mockReset().mockResolvedValue(mockDbConnection);
	mockCheckConnectionsConsistency.mockReset().mockResolvedValue({ result: false });
	mockIsConnection.mockReset().mockResolvedValue({ result: false });
	mockWriteFile.mockReset().mockResolvedValue({ uri: 'file:///data/trade_images/123_photo.jpg' });
	mockDeleteFile.mockReset().mockResolvedValue(undefined);
	mockMkdir.mockReset().mockResolvedValue(undefined);
	mockFetch.mockReset();
}

/** Helper: set up a fresh adapter, initialize it, and return it */
async function createInitializedAdapter(): Promise<SQLiteAdapter> {
	// Seed query: ticker count = 0 → seed tickers
	mockQuery.mockResolvedValueOnce({ values: [{ count: 0 }] });
	mockFetch.mockResolvedValueOnce({
		json: async () => ({
			stocks: [{ symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' }],
			forex: [{ symbol: 'EURUSD', name: 'Euro / US Dollar', baseCurrency: 'EUR', quoteCurrency: 'USD' }],
			crypto: [{ symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', baseCurrency: 'BTC', quoteCurrency: 'USD' }],
		}),
	});
	mockExecute.mockResolvedValue({ changes: { changes: 0 } });

	const adapter = new SQLiteAdapter();
	await adapter.initialize();
	return adapter;
}

describe('SQLiteAdapter', () => {
	beforeEach(() => {
		resetMocks();
	});

	// --- Initialization ---
	describe('initialize', () => {
		it('creates connection, opens DB, enables foreign keys, creates tables, seeds tickers', async () => {
			const adapter = await createInitializedAdapter();

			expect(mockCreateConnection).toHaveBeenCalledWith(
				'talaan_journal', false, 'no-encryption', 1, false,
			);
			expect(mockOpen).toHaveBeenCalled();
			// Foreign keys pragma + create tables + seed tickers
			expect(mockExecute).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
			// Table creation
			expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS users'));
			// Mkdir for image directory
			expect(mockMkdir).toHaveBeenCalledWith(
				expect.objectContaining({ path: 'trade_images', recursive: true }),
			);
			// Does not re-initialize
			await adapter.initialize();
			expect(mockCreateConnection).toHaveBeenCalledTimes(1);
		});

		it('retrieves existing connection when available', async () => {
			mockCheckConnectionsConsistency.mockResolvedValueOnce({ result: true });
			mockIsConnection.mockResolvedValueOnce({ result: true });
			mockQuery.mockResolvedValueOnce({ values: [{ count: 5 }] }); // tickers exist

			const adapter = new SQLiteAdapter();
			await adapter.initialize();

			expect(mockRetrieveConnection).toHaveBeenCalledWith('talaan_journal', false);
			expect(mockCreateConnection).not.toHaveBeenCalled();
		});

		it('skips ticker seeding when tickers already exist', async () => {
			mockQuery.mockResolvedValueOnce({ values: [{ count: 50 }] });

			const adapter = new SQLiteAdapter();
			await adapter.initialize();

			expect(mockFetch).not.toHaveBeenCalled();
		});
	});

	// --- User ---
	describe('getUser', () => {
		it('returns null when no users exist', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({ values: [] });

			const result = await adapter.getUser();
			expect(result).toBeNull();
		});

		it('returns mapped user when found', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({
				values: [{
					id: 1,
					display_name: 'Clay',
					password_hash: 'hash123',
					timezone: 'America/New_York',
					security_q: 'Pet?',
					security_a: 'Cat',
					created_at: '2026-01-01T00:00:00.000Z',
					updated_at: '2026-01-02T00:00:00.000Z',
				}],
			});

			const user = await adapter.getUser();
			expect(user).toEqual({
				id: '1',
				displayName: 'Clay',
				passwordHash: 'hash123',
				timezone: 'America/New_York',
				securityQ: 'Pet?',
				securityA: 'Cat',
				createdAt: '2026-01-01T00:00:00.000Z',
				updatedAt: '2026-01-02T00:00:00.000Z',
			});
		});
	});

	describe('createUser', () => {
		it('inserts user and returns mapped result with string ID', async () => {
			const adapter = await createInitializedAdapter();
			mockRun.mockResolvedValueOnce({ changes: { lastId: 1, changes: 1 } });
			mockQuery.mockResolvedValueOnce({
				values: [{
					id: 1,
					display_name: 'Clay',
					password_hash: 'mypass',
					timezone: 'UTC',
					security_q: null,
					security_a: null,
					created_at: '2026-01-01T00:00:00.000Z',
					updated_at: '2026-01-01T00:00:00.000Z',
				}],
			});

			const user = await adapter.createUser({
				displayName: 'Clay',
				password: 'mypass',
				timezone: 'UTC',
			});

			expect(user.id).toBe('1');
			expect(user.displayName).toBe('Clay');
			expect(mockRun).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO users'),
				expect.arrayContaining(['Clay', 'mypass', 'UTC']),
			);
		});
	});

	describe('updateUser', () => {
		it('updates only provided fields with dynamic SET', async () => {
			const adapter = await createInitializedAdapter();
			mockRun.mockResolvedValueOnce({ changes: { changes: 1 } });
			mockQuery.mockResolvedValueOnce({
				values: [{
					id: 1,
					display_name: 'Updated',
					password_hash: null,
					timezone: 'UTC',
					security_q: null,
					security_a: null,
					created_at: '2026-01-01T00:00:00.000Z',
					updated_at: '2026-01-02T00:00:00.000Z',
				}],
			});

			const user = await adapter.updateUser('1', { displayName: 'Updated' });
			expect(user.displayName).toBe('Updated');
			expect(mockRun).toHaveBeenCalledWith(
				expect.stringContaining('display_name = ?'),
				expect.arrayContaining(['Updated']),
			);
		});
	});

	// --- Accounts ---
	describe('getAccounts', () => {
		it('returns all accounts ordered by created_at', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({
				values: [
					{ id: 1, user_id: 1, name: 'Main', description: null, currency: 'USD', starting_capital: 10000, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
					{ id: 2, user_id: 1, name: 'Demo', description: 'Demo account', currency: 'EUR', starting_capital: 5000, created_at: '2026-01-02T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z' },
				],
			});

			const accounts = await adapter.getAccounts();
			expect(accounts).toHaveLength(2);
			expect(accounts[0].id).toBe('1');
			expect(accounts[0].user).toBe('1');
			expect(accounts[0].name).toBe('Main');
			expect(accounts[1].id).toBe('2');
		});
	});

	describe('createAccount', () => {
		it('converts user ID to number for FK and returns string IDs', async () => {
			const adapter = await createInitializedAdapter();
			mockRun.mockResolvedValueOnce({ changes: { lastId: 1, changes: 1 } });
			mockQuery.mockResolvedValueOnce({
				values: [{
					id: 1, user_id: 1, name: 'Main', description: null,
					currency: 'USD', starting_capital: 10000,
					created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
				}],
			});

			const account = await adapter.createAccount({
				user: '1',
				name: 'Main',
				startingCapital: 10000,
			});

			expect(account.id).toBe('1');
			expect(mockRun).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO trading_accounts'),
				expect.arrayContaining([1, 'Main']),
			);
		});
	});

	describe('updateAccount', () => {
		it('updates with dynamic SET clauses', async () => {
			const adapter = await createInitializedAdapter();
			mockRun.mockResolvedValueOnce({ changes: { changes: 1 } });
			mockQuery.mockResolvedValueOnce({
				values: [{
					id: 1, user_id: 1, name: 'Renamed', description: null,
					currency: 'USD', starting_capital: 20000,
					created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z',
				}],
			});

			const account = await adapter.updateAccount('1', {
				name: 'Renamed',
				startingCapital: 20000,
			});

			expect(account.name).toBe('Renamed');
			expect(account.startingCapital).toBe(20000);
		});
	});

	describe('deleteAccount', () => {
		it('deletes image files for all trades before DB delete', async () => {
			const adapter = await createInitializedAdapter();
			// Query trades for account
			mockQuery.mockResolvedValueOnce({ values: [{ id: 10 }, { id: 11 }] });
			// Query images for trade 10
			mockQuery.mockResolvedValueOnce({ values: [{ file_path: 'file:///img1.jpg' }] });
			// Query images for trade 11
			mockQuery.mockResolvedValueOnce({ values: [{ file_path: 'file:///img2.jpg' }] });
			mockRun.mockResolvedValueOnce({ changes: { changes: 1 } });

			await adapter.deleteAccount('1');

			expect(mockDeleteFile).toHaveBeenCalledTimes(2);
			expect(mockRun).toHaveBeenCalledWith(
				'DELETE FROM trading_accounts WHERE id = ?;',
				[1],
			);
		});
	});

	// --- Trades ---
	describe('getTrades', () => {
		it('returns paginated result with correct math', async () => {
			const adapter = await createInitializedAdapter();
			// Count query
			mockQuery.mockResolvedValueOnce({ values: [{ count: 75 }] });
			// Data query
			mockQuery.mockResolvedValueOnce({
				values: Array.from({ length: 25 }, (_, i) => ({
					id: i + 51,
					account_id: 1,
					date: '2026-01-01',
					ticker_symbol: 'AAPL',
					direction: 'long',
					entry_price: 150,
					stop_loss: 145,
					take_profit: 165,
					position_size: 100,
					exit_price: null,
					status: 'open',
					rr_ratio: 3,
					pnl_amount: null,
					pnl_percent: null,
					notes: null,
					created_at: '2026-01-01T00:00:00.000Z',
					updated_at: '2026-01-01T00:00:00.000Z',
				})),
			});

			const result = await adapter.getTrades({ page: 3, limit: 25 });

			expect(result.totalDocs).toBe(75);
			expect(result.totalPages).toBe(3);
			expect(result.page).toBe(3);
			expect(result.limit).toBe(25);
			expect(result.hasNextPage).toBe(false);
			expect(result.hasPrevPage).toBe(true);
			expect(result.docs).toHaveLength(25);
			expect(result.docs[0].id).toBe('51');
		});

		it('applies all filters to WHERE clause', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({ values: [{ count: 5 }] });
			mockQuery.mockResolvedValueOnce({ values: [] });

			await adapter.getTrades({
				accountId: '1',
				status: 'closed',
				dateStart: '2026-01-01',
				dateEnd: '2026-01-31',
			});

			const countCall = mockQuery.mock.calls[mockQuery.mock.calls.length - 2];
			expect(countCall[0]).toContain('account_id = ?');
			expect(countCall[0]).toContain('status = ?');
			expect(countCall[0]).toContain('date >= ?');
			expect(countCall[0]).toContain('date <= ?');
			expect(countCall[1]).toEqual([1, 'closed', '2026-01-01', '2026-01-31']);
		});

		it('defaults to page 1, limit 50 when no filters', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({ values: [{ count: 10 }] });
			mockQuery.mockResolvedValueOnce({ values: [] });

			const result = await adapter.getTrades();

			expect(result.page).toBe(1);
			expect(result.limit).toBe(50);
		});
	});

	describe('getTrade', () => {
		it('returns null when trade not found', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({ values: [] });

			const result = await adapter.getTrade('999');
			expect(result).toBeNull();
		});

		it('returns mapped trade when found', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({
				values: [{
					id: 5, account_id: 1, date: '2026-02-01',
					ticker_symbol: 'MSFT', direction: 'short',
					entry_price: 400, stop_loss: 410, take_profit: 380,
					position_size: 50, exit_price: 385, status: 'closed',
					rr_ratio: 1.5, pnl_amount: 750, pnl_percent: 3.75,
					notes: 'Good trade', created_at: '2026-02-01T00:00:00.000Z',
					updated_at: '2026-02-02T00:00:00.000Z',
				}],
			});

			const trade = await adapter.getTrade('5');
			expect(trade).not.toBeNull();
			expect(trade!.id).toBe('5');
			expect(trade!.account).toBe('1');
			expect(trade!.tickerSymbol).toBe('MSFT');
			expect(trade!.direction).toBe('short');
			expect(trade!.pnlAmount).toBe(750);
		});
	});

	describe('getTradesByDateRange', () => {
		it('filters by date range and closed status only', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({ values: [] });

			await adapter.getTradesByDateRange('2026-01-01', '2026-01-31');

			expect(mockQuery).toHaveBeenCalledWith(
				expect.stringContaining("status = 'closed'"),
				['2026-01-01', '2026-01-31'],
			);
		});

		it('includes accountId filter when provided', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({ values: [] });

			await adapter.getTradesByDateRange('2026-01-01', '2026-01-31', '2');

			const call = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
			expect(call[0]).toContain('account_id = ?');
			expect(call[1]).toEqual(['2026-01-01', '2026-01-31', 2]);
		});
	});

	describe('createTrade', () => {
		it('converts account ID to number and returns mapped trade', async () => {
			const adapter = await createInitializedAdapter();
			mockRun.mockResolvedValueOnce({ changes: { lastId: 10, changes: 1 } });
			mockQuery.mockResolvedValueOnce({
				values: [{
					id: 10, account_id: 1, date: '2026-02-15',
					ticker_symbol: 'AAPL', direction: 'long',
					entry_price: 150, stop_loss: 145, take_profit: 165,
					position_size: 100, exit_price: null, status: 'open',
					rr_ratio: 3, pnl_amount: null, pnl_percent: null,
					notes: null, created_at: '2026-02-15T00:00:00.000Z',
					updated_at: '2026-02-15T00:00:00.000Z',
				}],
			});

			const trade = await adapter.createTrade({
				account: '1',
				date: '2026-02-15',
				tickerSymbol: 'AAPL',
				direction: 'long',
				entryPrice: 150,
				stopLoss: 145,
				takeProfit: 165,
				positionSize: 100,
			});

			expect(trade.id).toBe('10');
			expect(mockRun).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO trade_positions'),
				expect.arrayContaining([1, '2026-02-15', 'AAPL', 'long', 150, 145, 165]),
			);
		});
	});

	describe('updateTrade', () => {
		it('strips account field and uses dynamic SET', async () => {
			const adapter = await createInitializedAdapter();
			mockRun.mockResolvedValueOnce({ changes: { changes: 1 } });
			mockQuery.mockResolvedValueOnce({
				values: [{
					id: 10, account_id: 1, date: '2026-02-15',
					ticker_symbol: 'AAPL', direction: 'long',
					entry_price: 150, stop_loss: 145, take_profit: 165,
					position_size: 100, exit_price: 160, status: 'closed',
					rr_ratio: 3, pnl_amount: 1000, pnl_percent: 6.67,
					notes: null, created_at: '2026-02-15T00:00:00.000Z',
					updated_at: '2026-02-16T00:00:00.000Z',
				}],
			});

			const data = {
				account: '1', // should be stripped
				exitPrice: 160,
				status: 'closed' as const,
				pnlAmount: 1000,
			};

			const trade = await adapter.updateTrade('10', data as Record<string, unknown> & { exitPrice: number; status: 'closed'; pnlAmount: number });

			expect(trade.exitPrice).toBe(160);
			expect(trade.status).toBe('closed');
			// Verify account field was NOT included in the SET clause
			const runCall = mockRun.mock.calls[0];
			expect(runCall[0]).not.toContain('account_id');
			expect(runCall[0]).toContain('exit_price = ?');
		});
	});

	describe('deleteTrade', () => {
		it('deletes image files from filesystem before DB row', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({
				values: [
					{ file_path: 'file:///img1.jpg' },
					{ file_path: 'file:///img2.jpg' },
				],
			});
			mockRun.mockResolvedValueOnce({ changes: { changes: 1 } });

			await adapter.deleteTrade('10');

			expect(mockDeleteFile).toHaveBeenCalledTimes(2);
			expect(mockDeleteFile).toHaveBeenCalledWith({ path: 'file:///img1.jpg' });
			expect(mockDeleteFile).toHaveBeenCalledWith({ path: 'file:///img2.jpg' });
			expect(mockRun).toHaveBeenCalledWith(
				'DELETE FROM trade_positions WHERE id = ?;',
				[10],
			);
		});

		it('continues even if filesystem delete fails', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({
				values: [{ file_path: 'file:///missing.jpg' }],
			});
			mockDeleteFile.mockRejectedValueOnce(new Error('File not found'));
			mockRun.mockResolvedValueOnce({ changes: { changes: 1 } });

			// Should not throw
			await adapter.deleteTrade('10');
			expect(mockRun).toHaveBeenCalledWith(
				'DELETE FROM trade_positions WHERE id = ?;',
				[10],
			);
		});
	});

	// --- Images ---
	describe('getTradeImages', () => {
		it('returns images ordered by sort_order with WebView-compatible URLs', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({
				values: [{
					id: 1, trade_id: 10, file_name: 'chart.png',
					mime_type: 'image/png', file_path: 'file:///data/trade_images/chart.png',
					sort_order: 0, created_at: '2026-01-01T00:00:00.000Z',
				}],
			});

			const images = await adapter.getTradeImages('10');

			expect(images).toHaveLength(1);
			expect(images[0].id).toBe('1');
			expect(images[0].trade).toBe('10');
			expect(images[0].url).toBe('https://localhost/_capacitor_file_file:///data/trade_images/chart.png');
		});
	});

	describe('uploadImage', () => {
		it('writes file to filesystem and inserts DB record', async () => {
			const adapter = await createInitializedAdapter();
			mockRun.mockResolvedValueOnce({ changes: { lastId: 5, changes: 1 } });
			mockQuery.mockResolvedValueOnce({
				values: [{
					id: 5, trade_id: 10, file_name: '123_photo.jpg',
					mime_type: 'image/jpeg', file_path: 'file:///data/trade_images/123_photo.jpg',
					sort_order: 0, created_at: '2026-01-01T00:00:00.000Z',
				}],
			});

			const file = new File(['test-data'], 'photo.jpg', { type: 'image/jpeg' });
			const image = await adapter.uploadImage('10', file);

			expect(mockWriteFile).toHaveBeenCalledWith(
				expect.objectContaining({
					directory: 'DATA',
				}),
			);
			expect(image.id).toBe('5');
			expect(image.trade).toBe('10');
			expect(image.mimeType).toBe('image/jpeg');
		});
	});

	describe('deleteImage', () => {
		it('deletes file from filesystem then DB record', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({
				values: [{ file_path: 'file:///data/trade_images/chart.png' }],
			});
			mockRun.mockResolvedValueOnce({ changes: { changes: 1 } });

			await adapter.deleteImage('5');

			expect(mockDeleteFile).toHaveBeenCalledWith({
				path: 'file:///data/trade_images/chart.png',
			});
			expect(mockRun).toHaveBeenCalledWith(
				'DELETE FROM trade_images WHERE id = ?;',
				[5],
			);
		});

		it('still deletes DB record even if file delete fails', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({
				values: [{ file_path: 'file:///missing.jpg' }],
			});
			mockDeleteFile.mockRejectedValueOnce(new Error('Not found'));
			mockRun.mockResolvedValueOnce({ changes: { changes: 1 } });

			await adapter.deleteImage('5');
			expect(mockRun).toHaveBeenCalledWith(
				'DELETE FROM trade_images WHERE id = ?;',
				[5],
			);
		});
	});

	// --- Tickers ---
	describe('searchTickers', () => {
		it('searches by symbol and name with LIKE pattern, limit 20', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({
				values: [
					{ id: 1, symbol: 'AAPL', name: 'Apple Inc.', asset_class: 'stock', exchange: 'NASDAQ', base_currency: null, quote_currency: null },
				],
			});

			const tickers = await adapter.searchTickers('AAP');

			expect(mockQuery).toHaveBeenCalledWith(
				expect.stringContaining('LIKE ?'),
				['%AAP%', '%AAP%'],
			);
			expect(tickers).toHaveLength(1);
			expect(tickers[0].symbol).toBe('AAPL');
			expect(tickers[0].assetClass).toBe('stock');
		});
	});

	describe('getRecentTickers', () => {
		it('returns unique ticker symbols from recent trades', async () => {
			const adapter = await createInitializedAdapter();
			mockQuery.mockResolvedValueOnce({
				values: [
					{ ticker_symbol: 'AAPL', latest_date: '2026-02-15' },
					{ ticker_symbol: 'MSFT', latest_date: '2026-02-14' },
					{ ticker_symbol: 'GOOGL', latest_date: '2026-02-13' },
				],
			});

			const tickers = await adapter.getRecentTickers(5);

			expect(tickers).toEqual(['AAPL', 'MSFT', 'GOOGL']);
			expect(mockQuery).toHaveBeenCalledWith(
				expect.stringContaining('GROUP BY ticker_symbol'),
				[5],
			);
		});
	});

	// --- ID String Conversion ---
	describe('ID conversion', () => {
		it('all returned IDs are strings', async () => {
			const adapter = await createInitializedAdapter();

			// User
			mockQuery.mockResolvedValueOnce({
				values: [{
					id: 42, display_name: 'Test', password_hash: null,
					timezone: 'UTC', security_q: null, security_a: null,
					created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
				}],
			});
			const user = await adapter.getUser();
			expect(typeof user!.id).toBe('string');
			expect(user!.id).toBe('42');

			// Account
			mockQuery.mockResolvedValueOnce({
				values: [{
					id: 7, user_id: 42, name: 'Main', description: null,
					currency: 'USD', starting_capital: 10000,
					created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
				}],
			});
			const accounts = await adapter.getAccounts();
			expect(typeof accounts[0].id).toBe('string');
			expect(typeof accounts[0].user).toBe('string');
		});
	});
});
