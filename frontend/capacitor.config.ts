import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.claytradingjournal.app',
	appName: 'Trading Journal',
	webDir: 'build',
	plugins: {
		Camera: {
			presentationStyle: 'popover',
		},
	},
};

export default config;
