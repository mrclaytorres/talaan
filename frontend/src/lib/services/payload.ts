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
import type {
	DataService,
	PaginatedResult,
	DailyPnLRow,
	MonthlyPnLRow,
	DashboardSummary,
	TickerDistributionRow,
} from './types.js';

export class PayloadAdapter implements DataService {
	private baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	private async request<T>(
		path: string,
		options: RequestInit = {},
	): Promise<T> {
		const res = await fetch(`${this.baseUrl}${path}`, {
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
			...options,
		});

		if (!res.ok) {
			const error = await res.json().catch(() => ({ message: res.statusText }));
			throw new Error(error.message || `Request failed: ${res.status}`);
		}

		return res.json();
	}

	// User
	async getUser(): Promise<User | null> {
		const result = await this.request<PaginatedResult<User>>('/users?limit=1');
		return result.docs[0] ?? null;
	}

	async createUser(data: CreateUserData): Promise<User> {
		const slug = data.displayName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
		const result = await this.request<{ doc: User }>('/users', {
			method: 'POST',
			body: JSON.stringify({
				...data,
				email: `${slug}@local.journal`,
				password: data.password || 'local-only',
			}),
		});
		return result.doc;
	}

	async updateUser(id: string, data: UpdateUserData): Promise<User> {
		const result = await this.request<{ doc: User }>(`/users/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
		return result.doc;
	}

	// Trading Accounts
	async getAccounts(): Promise<TradingAccount[]> {
		const result = await this.request<PaginatedResult<TradingAccount>>(
			'/trading-accounts?limit=100&sort=createdAt',
		);
		return result.docs;
	}

	async createAccount(data: CreateAccountData): Promise<TradingAccount> {
		const result = await this.request<{ doc: TradingAccount }>(
			'/trading-accounts',
			{
				method: 'POST',
				body: JSON.stringify({
					...data,
					user: Number(data.user),
				}),
			},
		);
		return result.doc;
	}

	async updateAccount(
		id: string,
		data: UpdateAccountData,
	): Promise<TradingAccount> {
		const result = await this.request<{ doc: TradingAccount }>(
			`/trading-accounts/${id}`,
			{
				method: 'PATCH',
				body: JSON.stringify(data),
			},
		);
		return result.doc;
	}

	async deleteAccount(id: string): Promise<void> {
		await this.request(`/trading-accounts/${id}`, { method: 'DELETE' });
	}

	// Trade Positions
	async getTrades(
		filters?: TradeFilters,
	): Promise<PaginatedResult<TradePosition>> {
		const params = new URLSearchParams();
		params.set('sort', '-date');
		params.set('limit', String(filters?.limit ?? 50));
		params.set('page', String(filters?.page ?? 1));

		if (filters?.accountId) {
			params.set('where[account][equals]', filters.accountId);
		}
		if (filters?.status) {
			params.set('where[status][equals]', filters.status);
		}
		if (filters?.dateStart) {
			params.set('where[date][greater_than_equal]', filters.dateStart);
		}
		if (filters?.dateEnd) {
			params.set('where[date][less_than_equal]', filters.dateEnd);
		}

		params.set('depth', '0');
		return this.request<PaginatedResult<TradePosition>>(
			`/trade-positions?${params.toString()}`,
		);
	}

	async getTrade(id: string): Promise<TradePosition | null> {
		try {
			return await this.request<TradePosition>(`/trade-positions/${id}?depth=0`);
		} catch {
			return null;
		}
	}

	async getTradesByDateRange(
		start: string,
		end: string,
		accountId?: string,
	): Promise<TradePosition[]> {
		const params = new URLSearchParams();
		params.set('where[date][greater_than_equal]', start);
		params.set('where[date][less_than_equal]', end);
		params.set('where[status][equals]', 'closed');
		params.set('limit', '10000');
		params.set('depth', '0');

		if (accountId) {
			params.set('where[account][equals]', accountId);
		}

		const result = await this.request<PaginatedResult<TradePosition>>(
			`/trade-positions?${params.toString()}`,
		);
		return result.docs;
	}

	async createTrade(data: CreateTradeData): Promise<TradePosition> {
		const result = await this.request<{ doc: TradePosition }>(
			'/trade-positions?depth=0',
			{
				method: 'POST',
				body: JSON.stringify({
					...data,
					account: Number(data.account),
				}),
			},
		);
		return result.doc;
	}

	async updateTrade(
		id: string,
		data: UpdateTradeData,
	): Promise<TradePosition> {
		// Strip 'account' — it's on CreateTradeData but not UpdateTradeData,
		// yet the form may pass it through. Sending it causes Payload to reject the PATCH.
		const { account: _account, ...updateData } = data as UpdateTradeData & { account?: unknown };
		const result = await this.request<{ doc: TradePosition }>(
			`/trade-positions/${id}?depth=0`,
			{
				method: 'PATCH',
				body: JSON.stringify(updateData),
			},
		);
		return result.doc;
	}

	async deleteTrade(id: string): Promise<void> {
		// Delete associated images first
		const images = await this.getTradeImages(id);
		for (const image of images) {
			await this.deleteImage(image.id);
		}
		await this.request(`/trade-positions/${id}`, { method: 'DELETE' });
	}

	// Trade Images
	async getTradeImages(tradeId: string): Promise<TradeImage[]> {
		const result = await this.request<PaginatedResult<TradeImage>>(
			`/trade-images?where[trade][equals]=${tradeId}&sort=sortOrder&limit=100`,
		);
		return result.docs;
	}

	async uploadImage(tradeId: string, file: File): Promise<TradeImage> {
		const formData = new FormData();
		formData.append('file', file);
		// Payload v3 multipart uploads require non-file fields as a JSON string in _payload
		formData.append('_payload', JSON.stringify({ trade: Number(tradeId), sortOrder: 0 }));

		const res = await fetch(`${this.baseUrl}/trade-images`, {
			method: 'POST',
			body: formData,
		});

		if (!res.ok) {
			const error = await res.json().catch(() => ({ message: res.statusText }));
			throw new Error(error.message || `Upload failed: ${res.status}`);
		}

		const result = await res.json();
		return result.doc;
	}

	async deleteImage(id: string): Promise<void> {
		await this.request(`/trade-images/${id}`, { method: 'DELETE' });
	}

	// Tickers
	async searchTickers(query: string): Promise<Ticker[]> {
		const params = new URLSearchParams();
		params.set('where[or][0][symbol][contains]', query);
		params.set('where[or][1][name][contains]', query);
		params.set('limit', '20');

		const result = await this.request<PaginatedResult<Ticker>>(
			`/tickers?${params.toString()}`,
		);
		return result.docs;
	}

	async getRecentTickers(limit: number): Promise<string[]> {
		const result = await this.request<PaginatedResult<TradePosition>>(
			`/trade-positions?sort=-date&limit=${limit}&depth=0`,
		);
		const symbols = new Set<string>();
		for (const trade of result.docs) {
			symbols.add(trade.tickerSymbol);
			if (symbols.size >= limit) break;
		}
		return [...symbols];
	}

	// --- Dashboard aggregations ---

	private dashboardCache: {
		key: string;
		data: { dailyPnL: DailyPnLRow[]; monthlyPnL: MonthlyPnLRow[]; summary: DashboardSummary; tickerDistribution: TickerDistributionRow[] };
		expiresAt: number;
	} | null = null;

	private async fetchDashboardStats(accountId?: string): Promise<{
		dailyPnL: DailyPnLRow[];
		monthlyPnL: MonthlyPnLRow[];
		summary: DashboardSummary;
		tickerDistribution: TickerDistributionRow[];
	}> {
		const cacheKey = accountId ?? '__all__';
		if (this.dashboardCache && this.dashboardCache.key === cacheKey && Date.now() < this.dashboardCache.expiresAt) {
			return this.dashboardCache.data;
		}

		const params = accountId ? `?accountId=${accountId}` : '';
		const data = await this.request<{
			dailyPnL: DailyPnLRow[];
			monthlyPnL: MonthlyPnLRow[];
			summary: DashboardSummary;
			tickerDistribution: TickerDistributionRow[];
		}>(`/dashboard/stats${params}`);

		this.dashboardCache = { key: cacheKey, data, expiresAt: Date.now() + 5000 };
		return data;
	}

	async getDailyPnL(accountId?: string): Promise<DailyPnLRow[]> {
		const stats = await this.fetchDashboardStats(accountId);
		return stats.dailyPnL;
	}

	async getMonthlyPnL(accountId?: string): Promise<MonthlyPnLRow[]> {
		const stats = await this.fetchDashboardStats(accountId);
		return stats.monthlyPnL;
	}

	async getDashboardSummary(accountId?: string): Promise<DashboardSummary> {
		const stats = await this.fetchDashboardStats(accountId);
		return stats.summary;
	}

	async getTickerDistribution(accountId?: string): Promise<TickerDistributionRow[]> {
		const stats = await this.fetchDashboardStats(accountId);
		return stats.tickerDistribution;
	}

	async getTradesForDate(date: string, accountId?: string): Promise<TradePosition[]> {
		const params = new URLSearchParams();
		params.set('where[date][greater_than_equal]', `${date}T00:00:00`);
		params.set('where[date][less_than_equal]', `${date}T23:59:59`);
		params.set('where[status][equals]', 'closed');
		params.set('limit', '100');
		params.set('depth', '0');
		if (accountId) {
			params.set('where[account][equals]', accountId);
		}
		const result = await this.request<PaginatedResult<TradePosition>>(
			`/trade-positions?${params.toString()}`,
		);
		return result.docs;
	}
}
