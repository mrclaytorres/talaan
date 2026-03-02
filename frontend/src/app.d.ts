// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	const __APP_VERSION__: string;

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		electronFS?: {
			writeFile(path: string, base64Data: string): Promise<string>;
			deleteFile(path: string): Promise<void>;
			mkdir(path: string): Promise<void>;
			getAppDataPath(): Promise<string>;
		};
	}
}

export {};
