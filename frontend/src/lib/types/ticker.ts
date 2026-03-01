export type AssetClass = 'stock' | 'forex' | 'crypto';

export interface Ticker {
	symbol: string;
	name: string;
	assetClass: AssetClass;
	exchange: string | null;
	baseCurrency: string | null;
	quoteCurrency: string | null;
}
