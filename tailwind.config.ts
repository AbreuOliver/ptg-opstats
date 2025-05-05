import forms from '@tailwindcss/forms';
import type { Config } from 'tailwindcss';
import { skeleton } from '@skeletonlabs/tw-plugin';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {}
	},

	plugins: [forms, 
		skeleton({
			themes: {
				preset: ['wintry'],
			}
		})
	]
} satisfies Config;
