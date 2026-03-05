import type { DataService } from './types.js';
import { PayloadAdapter } from './payload.js';

let _dataService: DataService | null = null;

/**
 * Create a Proxy-based DataService that lazily loads SQLiteAdapter on native.
 * This avoids bundling @capacitor-community/sqlite in the web build.
 */
function createNativeDataService(): DataService {
	let adapterPromise: Promise<DataService> | null = null;

	function getAdapter(): Promise<DataService> {
		if (!adapterPromise) {
			adapterPromise = import('./sqlite.js').then(async (mod) => {
				const adapter = new mod.SQLiteAdapter();
				await adapter.initialize();
				return adapter;
			});
		}
		return adapterPromise;
	}

	return new Proxy({} as DataService, {
		get(_target, prop: string) {
			return async (...args: unknown[]) => {
				const adapter = await getAdapter();
				const method = adapter[prop as keyof DataService] as (
					...a: unknown[]
				) => unknown;
				return method.apply(adapter, args);
			};
		},
	});
}

export function createDataService(): DataService {
	// Check if running on a native platform (Capacitor Android/iOS or Electron)
	const isNative =
		typeof window !== 'undefined' &&
		(window.Capacitor?.isNativePlatform?.() === true ||
			window.electronFS !== undefined);

	if (isNative) {
		return createNativeDataService();
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
