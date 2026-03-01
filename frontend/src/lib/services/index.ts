import type { DataService } from './types.js';
import { PayloadAdapter } from './payload.js';

let _dataService: DataService | null = null;

export function createDataService(): DataService {
	// Check if running on a native platform (Capacitor)
	const isNative =
		typeof window !== 'undefined' &&
		window.Capacitor?.isNativePlatform?.() === true;

	if (isNative) {
		// Dynamically import SQLiteAdapter only on native platforms
		// to avoid bundling Capacitor SQLite on web
		throw new Error(
			'SQLiteAdapter: dynamic import not yet wired. ' +
				'Will be implemented when mobile dev begins.',
		);
	}

	const apiUrl =
		typeof window !== 'undefined'
			? (window.__PUBLIC_API_URL__ ?? `${window.location.origin}/api`)
			: 'http://localhost:3000/api';

	return new PayloadAdapter(apiUrl);
}

export function getDataService(): DataService {
	if (!_dataService) {
		_dataService = createDataService();
	}
	return _dataService;
}

export type { DataService } from './types.js';

// Extend window for config injection
declare global {
	interface Window {
		__PUBLIC_API_URL__?: string;
		Capacitor?: {
			isNativePlatform?: () => boolean;
		};
	}
}
