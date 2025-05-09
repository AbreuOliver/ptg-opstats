import adapter from '@sveltejs/adapter-auto';
import { sveltePreprocess } from 'svelte-preprocess'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: sveltePreprocess({
		postcss: true // enable Tailwind via PostCSS
	}),

	kit: {
		adapter: adapter()
	}
};

export default config;
