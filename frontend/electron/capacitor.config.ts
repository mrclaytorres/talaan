import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig & { electron?: Record<string, unknown> } = {
	appId: 'com.claytradingjournal.app',
	appName: 'Talaan',
	webDir: 'build',
	plugins: {
		Camera: {
			presentationStyle: 'popover',
		},
		CapacitorSQLite: {
			iosDatabaseLocation: 'Library/CapacitorDatabase',
			iosIsEncryption: false,
			androidIsEncryption: false,
			electronIsEncryption: false,
			electronLinuxLocation: 'Databases',
		},
	},
	electron: {
		trayIconAndMenuEnabled: false,
		splashScreenEnabled: false,
	},
};

export default config;
