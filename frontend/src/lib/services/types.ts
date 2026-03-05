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

export interface PaginatedResult<T> {
	docs: T[];
	totalDocs: number;
	totalPages: number;
	page: number;
	limit: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

export interface DailyPnLRow {
	date: string;        // 'YYYY-MM-DD'
	amount: number;      // SUM(pnl_amount)
	percent: number;     // SUM(pnl_percent)
	tradeCount: number;
	wins: number;
	losses: number;
}

export interface MonthlyPnLRow {
	month: string;       // 'YYYY-MM'
	amount: number;
	percent: number;
	tradingDays: number;
}

export interface DashboardSummary {
	totalPnl: number;
	totalClosedTrades: number;
	wins: number;
	losses: number;
	todayAmount: number;
	todayPercent: number;
	todayCount: number;
}

export interface TickerDistributionRow {
	ticker: string;
	count: number;
}

export interface DataService {
	// User
	getUser(): Promise<User | null>;
	createUser(data: CreateUserData): Promise<User>;
	updateUser(id: string, data: UpdateUserData): Promise<User>;

	// Trading Accounts
	getAccounts(): Promise<TradingAccount[]>;
	createAccount(data: CreateAccountData): Promise<TradingAccount>;
	updateAccount(id: string, data: UpdateAccountData): Promise<TradingAccount>;
	deleteAccount(id: string): Promise<void>;

	// Trade Positions
	getTrades(filters?: TradeFilters): Promise<PaginatedResult<TradePosition>>;
	getTrade(id: string): Promise<TradePosition | null>;
	getTradesByDateRange(
		start: string,
		end: string,
		accountId?: string,
	): Promise<TradePosition[]>;
	createTrade(data: CreateTradeData): Promise<TradePosition>;
	updateTrade(id: string, data: UpdateTradeData): Promise<TradePosition>;
	deleteTrade(id: string): Promise<void>;

	// Trade Images
	getTradeImages(tradeId: string): Promise<TradeImage[]>;
	uploadImage(tradeId: string, file: File): Promise<TradeImage>;
	deleteImage(id: string): Promise<void>;

	// Tickers
	searchTickers(query: string): Promise<Ticker[]>;
	getRecentTickers(limit: number): Promise<string[]>;

	// Dashboard aggregations
	getDailyPnL(accountId?: string): Promise<DailyPnLRow[]>;
	getMonthlyPnL(accountId?: string): Promise<MonthlyPnLRow[]>;
	getDashboardSummary(accountId?: string): Promise<DashboardSummary>;
	getTickerDistribution(accountId?: string, limit?: number): Promise<TickerDistributionRow[]>;
	getTradesForDate(date: string, accountId?: string): Promise<TradePosition[]>;
}
