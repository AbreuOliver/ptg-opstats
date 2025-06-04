import forms from '@tailwindcss/forms';
import type { Config } from 'tailwindcss';
import { skeleton } from '@skeletonlabs/tw-plugin';

export default {
	content: [
		// './src/**/*.{html,js,svelte,ts}'
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/@skeletonlabs/skeleton/**/*.{html,js,svelte,ts}'
	],
	
	theme: {
		extend: {
			fontFamily: {
				sans: ['Epilogue', 'ui-sans-serif', 'system-ui'],
			}
		}
	},

	plugins: [forms, 
		skeleton({
			themes: {
				preset: ['wintry'],
			}
		})
	]
} satisfies Config;

