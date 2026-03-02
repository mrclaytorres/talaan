import type {
	TradePosition,
	CreateTradeData,
	UpdateTradeData,
	TradeFilters,
} from '$lib/types/index.js';
import type { PaginatedResult } from '$lib/services/types.js';
import { getDataService } from '$lib/services/index.js';
import { calculateRRRatio, calculateRealizedRR, calculatePnL, inferDirection } from '$lib/utils/calculations.js';

class TradesStore {
	trades = $state<TradePosition[]>([]);
	currentTrade = $state<TradePosition | null>(null);
	totalDocs = $state(0);
	totalPages = $state(1);
	currentPage = $state(1);
	isLoading = $state(false);

	async loadTrades(filters?: TradeFilters): Promise<void> {
		this.isLoading = true;
		try {
			const ds = getDataService();
			const result: PaginatedResult<TradePosition> = await ds.getTrades(filters);
			this.trades = result.docs;
			this.totalDocs = result.totalDocs;
			this.totalPages = result.totalPages;
			this.currentPage = result.page;
		} finally {
			this.isLoading = false;
		}
	}

	async loadTrade(id: string): Promise<void> {
		this.isLoading = true;
		try {
			const ds = getDataService();
			this.currentTrade = await ds.getTrade(id);
		} finally {
			this.isLoading = false;
		}
	}

	async createTrade(data: CreateTradeData): Promise<TradePosition> {
		const ds = getDataService();

		// Auto-infer direction if not set
		if (!data.direction) {
			data.direction = inferDirection(data.entryPrice, data.stopLoss);
		}

		// Compute R:R — realized if closing, planned if open
		if (data.status === 'closed' && data.exitPrice) {
			data.rrRatio = calculateRealizedRR(
				data.direction,
				data.entryPrice,
				data.stopLoss,
				data.exitPrice,
			) ?? undefined;

			const pnl = calculatePnL(
				data.direction,
				data.entryPrice,
				data.exitPrice,
				data.positionSize ?? null,
			);
			if (data.pnlAmount === undefined || data.pnlAmount === null) {
				data.pnlAmount = pnl.amount ?? undefined;
			}
			if (data.pnlPercent === undefined || data.pnlPercent === null) {
				data.pnlPercent = pnl.percent;
			}
		} else {
			data.rrRatio = calculateRRRatio(
				data.entryPrice,
				data.stopLoss,
				data.takeProfit,
			) ?? undefined;
		}

		const trade = await ds.createTrade(data);
		this.trades = [trade, ...this.trades];
		return trade;
	}

	async updateTrade(id: string, data: UpdateTradeData): Promise<TradePosition> {
		const ds = getDataService();

		const sid = String(id);
		const existing = this.trades.find((t) => String(t.id) === sid) ?? (String(this.currentTrade?.id) === sid ? this.currentTrade : null);
		if (existing) {
			const entry = data.entryPrice ?? existing.entryPrice;
			const sl = data.stopLoss ?? existing.stopLoss;
			const tp = data.takeProfit ?? existing.takeProfit;
			const dir = data.direction ?? existing.direction;
			const exitPrice = data.exitPrice ?? existing.exitPrice;
			const status = data.status ?? existing.status;
			const size = data.positionSize !== undefined ? data.positionSize : existing.positionSize;

			// Compute R:R — realized if closed with exit price, planned if open
			if (status === 'closed' && exitPrice) {
				data.rrRatio = calculateRealizedRR(dir, entry, sl, exitPrice);
			} else if (data.entryPrice !== undefined || data.stopLoss !== undefined || data.takeProfit !== undefined) {
				data.rrRatio = calculateRRRatio(entry, sl, tp);
			}

			// Compute P&L if closing or price changed, but only if user didn't manually set values
			if ((status === 'closed' || data.exitPrice !== undefined) && exitPrice) {
				const pnl = calculatePnL(dir, entry, exitPrice, size);
				if (data.pnlAmount === undefined || data.pnlAmount === null) {
					data.pnlAmount = pnl.amount;
				}
				if (data.pnlPercent === undefined || data.pnlPercent === null) {
					data.pnlPercent = pnl.percent;
				}
			}
		}

		const updated = await ds.updateTrade(id, data);
		this.trades = this.trades.map((t) => (String(t.id) === sid ? updated : t));
		if (String(this.currentTrade?.id) === sid) {
			this.currentTrade = updated;
		}
		return updated;
	}

	async deleteTrade(id: string): Promise<void> {
		const ds = getDataService();
		await ds.deleteTrade(id);
		const sid = String(id);
		this.trades = this.trades.filter((t) => String(t.id) !== sid);
		if (String(this.currentTrade?.id) === sid) {
			this.currentTrade = null;
		}
	}

	async closeTrade(id: string, exitPrice: number): Promise<TradePosition> {
		return this.updateTrade(id, {
			exitPrice,
			status: 'closed',
		});
	}
}

export const tradesStore = new TradesStore();
