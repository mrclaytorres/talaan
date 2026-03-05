import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the PayloadAdapter — must use regular function for `new` compatibility
vi.mock('$lib/services/payload.js', () => {
	function MockPayloadAdapter(this: Record<string, unknown>, baseUrl: string) {
		this.__type = 'PayloadAdapter';
		this.baseUrl = baseUrl;
	}
	return { PayloadAdapter: MockPayloadAdapter };
});

// Mock the SQLiteAdapter module (for dynamic import)
vi.mock('$lib/services/sqlite.js', () => {
	function MockSQLiteAdapter(this: Record<string, unknown>) {
		this.__type = 'SQLiteAdapter';
		this.initialize = vi.fn().mockResolvedValue(undefined);
		this.getUser = vi.fn().mockResolvedValue(null);
		this.createUser = vi.fn().mockResolvedValue({ id: '1', displayName: 'Test' });
	}
	return { SQLiteAdapter: MockSQLiteAdapter };
});

describe('DataService Factory', () => {
	let originalWindow: typeof globalThis.window;

	beforeEach(() => {
		originalWindow = globalThis.window;
		// Reset modules between tests to clear singleton
		vi.resetModules();
	});

	afterEach(() => {
		// Restore window
		if (originalWindow === undefined) {
			// @ts-expect-error - restoring undefined window for SSR test
			delete globalThis.window;
		} else {
			globalThis.window = originalWindow;
		}
	});

	it('returns PayloadAdapter on web (non-native)', async () => {
		// Ensure window exists but Capacitor is not native
		globalThis.window = {
			...globalThis.window,
			Capacitor: { isNativePlatform: () => false },
			location: { origin: 'http://localhost:5173' },
		} as unknown as Window & typeof globalThis;

		const { createDataService } = await import('$lib/services/index.js');
		const service = createDataService();

		// PayloadAdapter is a plain object from mock
		expect((service as unknown as { __type: string }).__type).toBe('PayloadAdapter');
	});

	it('uses __PUBLIC_API_URL__ when available', async () => {
		globalThis.window = {
			...globalThis.window,
			__PUBLIC_API_URL__: 'https://api.example.com',
			Capacitor: undefined,
			location: { origin: 'http://localhost:5173' },
		} as unknown as Window & typeof globalThis;

		const { createDataService } = await import('$lib/services/index.js');
		const service = createDataService();

		expect((service as unknown as { baseUrl: string }).baseUrl).toBe(
			'https://api.example.com',
		);
	});

	it('returns Proxy-based adapter on native platform', async () => {
		globalThis.window = {
			...globalThis.window,
			Capacitor: { isNativePlatform: () => true },
			location: { origin: 'http://localhost' },
		} as unknown as Window & typeof globalThis;

		const { createDataService } = await import('$lib/services/index.js');
		const service = createDataService();

		// The service should be a Proxy — calling a method should work
		// It dynamically imports sqlite.js and forwards calls
		const user = await service.getUser();
		expect(user).toBeNull();
	});

	it('getDataService returns singleton', async () => {
		globalThis.window = {
			...globalThis.window,
			Capacitor: { isNativePlatform: () => false },
			location: { origin: 'http://localhost:5173' },
		} as unknown as Window & typeof globalThis;

		const { getDataService } = await import('$lib/services/index.js');
		const service1 = getDataService();
		const service2 = getDataService();

		expect(service1).toBe(service2);
	});

	it('falls back to localhost API URL when window has no __PUBLIC_API_URL__', async () => {
		globalThis.window = {
			...globalThis.window,
			Capacitor: undefined,
			location: { origin: 'http://myapp.com' },
		} as unknown as Window & typeof globalThis;

		const { createDataService } = await import('$lib/services/index.js');
		const service = createDataService();

		expect((service as unknown as { baseUrl: string }).baseUrl).toBe(
			'http://myapp.com/api',
		);
	});
});
