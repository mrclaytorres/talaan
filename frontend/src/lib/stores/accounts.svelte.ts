import type {
	TradingAccount,
	CreateAccountData,
	UpdateAccountData,
} from '$lib/types/index.js';
import { getDataService } from '$lib/services/index.js';

class AccountsStore {
	accounts = $state<TradingAccount[]>([]);
	activeAccountId = $state<string | 'all'>('all');
	isLoading = $state(false);

	async loadAccounts(): Promise<void> {
		this.isLoading = true;
		try {
			const ds = getDataService();
			this.accounts = await ds.getAccounts();
			// Default to first account instead of "All Accounts"
			if (this.activeAccountId === 'all' && this.accounts.length > 0) {
				this.activeAccountId = String(this.accounts[0].id);
			}
		} finally {
			this.isLoading = false;
		}
	}

	async createAccount(data: CreateAccountData): Promise<TradingAccount> {
		const ds = getDataService();
		const account = await ds.createAccount(data);
		this.accounts = [...this.accounts, account];
		return account;
	}

	async updateAccount(id: string, data: UpdateAccountData): Promise<TradingAccount> {
		const ds = getDataService();
		const updated = await ds.updateAccount(id, data);
		this.accounts = this.accounts.map((a) => (a.id === id ? updated : a));
		return updated;
	}

	async deleteAccount(id: string): Promise<void> {
		const ds = getDataService();
		await ds.deleteAccount(id);
		this.accounts = this.accounts.filter((a) => a.id !== id);
		if (this.activeAccountId === String(id)) {
			this.activeAccountId = this.accounts.length > 0 ? String(this.accounts[0].id) : 'all';
		}
	}

	async getTradeCountForAccount(accountId: string): Promise<number> {
		const ds = getDataService();
		const result = await ds.getTrades({ accountId, limit: 0 });
		return result.totalDocs;
	}

	setActiveAccount(id: string | 'all'): void {
		this.activeAccountId = String(id);
	}
}

export const accountsStore = new AccountsStore();
