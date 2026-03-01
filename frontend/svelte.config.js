import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			fallback: 'index.html',
		}),
		csrf: {
			trustedOrigins: ['https://working-exciting-beagle.ngrok-free.app/'],
		},
	},
};

export default config;
