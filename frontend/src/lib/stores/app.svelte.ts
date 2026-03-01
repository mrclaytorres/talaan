import { getDataService } from '$lib/services/index.js';

class AppStore {
	isLoading = $state(true);
	isAuthenticated = $state(false);
	isFirstLaunch = $state(true);
	hasPassword = $state(false);
	error = $state<string | null>(null);
	activeAccountId = $state<string | 'all'>('all');

	async init(): Promise<void> {
		try {
			this.isLoading = true;
			this.error = null;
			const ds = getDataService();
			const user = await ds.getUser();

			if (user) {
				this.isFirstLaunch = false;
				this.hasPassword = !!user.passwordHash;
				// If no password, auto-authenticate
				if (!this.hasPassword) {
					this.isAuthenticated = true;
				}
			} else {
				this.isFirstLaunch = true;
				this.isAuthenticated = false;
			}
		} catch (e) {
			this.error =
				e instanceof Error ? e.message : 'Failed to initialize app';
			// On error, allow setup flow
			this.isFirstLaunch = true;
		} finally {
			this.isLoading = false;
		}
	}

	setAuthenticated(value: boolean): void {
		this.isAuthenticated = value;
	}

	setActiveAccount(id: string | 'all'): void {
		this.activeAccountId = id;
	}

	clearError(): void {
		this.error = null;
	}
}

export const appStore = new AppStore();
