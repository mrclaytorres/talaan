export interface TradingAccount {
	id: string;
	user: string;
	name: string;
	description: string | null;
	currency: string;
	startingCapital: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreateAccountData {
	user: string;
	name: string;
	description?: string;
	currency?: string;
	startingCapital: number;
}

export interface UpdateAccountData {
	name?: string;
	description?: string | null;
	currency?: string;
	startingCapital?: number;
}
