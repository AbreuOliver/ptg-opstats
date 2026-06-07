import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	optimizeDeps: {
		include: ['@skeletonlabs/skeleton-svelte']
	},
	ssr: {
		noExternal: ['@skeletonlabs/skeleton-svelte']
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
