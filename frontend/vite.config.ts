import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		target: 'es2022',
	},
	server: {
		cors: true,
		host: true,
		port: 5173,
		allowedHosts: ['working-exciting-beagle.ngrok-free.app'],
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true,
			},
		},
	},
});
