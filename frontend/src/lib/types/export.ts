export interface ExportData {
	version: string;
	exportedAt: string;
	user: {
		displayName: string;
		timezone: string;
	};
	accounts: ExportAccount[];
}

export interface ExportAccount {
	id: string;
	name: string;
	description: string | null;
	currency: string;
	startingCapital: number;
	trades: ExportTrade[];
}

export interface ExportTrade {
	id: string;
	date: string;
	tickerSymbol: string;
	direction: 'long' | 'short';
	entryPrice: number;
	stopLoss: number;
	takeProfit: number;
	positionSize: number | null;
	exitPrice: number | null;
	status: 'open' | 'closed';
	rrRatio: number;
	pnlAmount: number | null;
	pnlPercent: number | null;
	commission: number | null;
	grossPnl: number | null;
	notes: string | null;
	images: ExportImage[];
}

export interface ExportImage {
	fileName: string;
	mimeType: string;
	data: string; // base64-encoded
}

export const EXPORT_VERSION = '1.0.0';
