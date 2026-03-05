export type TradeDirection = 'long' | 'short';
export type TradeStatus = 'open' | 'closed';

export interface TradePosition {
	id: string;
	account: string;
	date: string;
	tickerSymbol: string;
	direction: TradeDirection;
	entryPrice: number;
	stopLoss: number;
	takeProfit: number;
	positionSize: number | null;
	exitPrice: number | null;
	status: TradeStatus;
	rrRatio: number | null;
	pnlAmount: number | null;
	pnlPercent: number | null;
	commission: number | null;
	grossPnl: number | null;
	notes: string | null;
	images?: TradeImage[];
	createdAt: string;
	updatedAt: string;
}

export interface CreateTradeData {
	account: string;
	date: string;
	tickerSymbol: string;
	direction: TradeDirection;
	entryPrice: number;
	stopLoss: number;
	takeProfit: number;
	positionSize?: number;
	exitPrice?: number;
	status?: TradeStatus;
	rrRatio?: number;
	pnlAmount?: number;
	pnlPercent?: number;
	commission?: number;
	grossPnl?: number;
	notes?: string;
}

export interface UpdateTradeData {
	date?: string;
	tickerSymbol?: string;
	direction?: TradeDirection;
	entryPrice?: number;
	stopLoss?: number;
	takeProfit?: number;
	positionSize?: number | null;
	exitPrice?: number | null;
	status?: TradeStatus;
	rrRatio?: number | null;
	pnlAmount?: number | null;
	pnlPercent?: number | null;
	commission?: number | null;
	grossPnl?: number | null;
	notes?: string | null;
}

export interface TradeImage {
	id: string;
	trade: string;
	fileName: string;
	mimeType: string;
	filePath: string;
	sortOrder: number;
	url?: string;
	sizes?: {
		thumbnail?: { url: string; width: number; height: number };
		medium?: { url: string; width: number; height: number };
	};
	createdAt: string;
}

export interface TradeFilters {
	accountId?: string;
	status?: TradeStatus;
	dateStart?: string;
	dateEnd?: string;
	page?: number;
	limit?: number;
}
