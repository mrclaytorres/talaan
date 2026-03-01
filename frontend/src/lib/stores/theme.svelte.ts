import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

class ThemeStore {
	current = $state<Theme>('dark');

	constructor() {
		if (browser) {
			const saved = localStorage.getItem('theme') as Theme | null;
			if (saved === 'light' || saved === 'dark') {
				this.current = saved;
			} else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
				this.current = 'light';
			}
			this.apply();
		}
	}

	toggle(): void {
		this.current = this.current === 'dark' ? 'light' : 'dark';
		this.apply();
	}

	private apply(): void {
		if (!browser) return;
		document.documentElement.setAttribute('data-theme', this.current);
		localStorage.setItem('theme', this.current);
	}
}

export const themeStore = new ThemeStore();
