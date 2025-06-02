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

// import forms from '@tailwindcss/forms';
// import { skeleton } from '@skeletonlabs/tw-plugin';

// const config = {
// 	content: ['./src/**/*.{html,js,svelte,ts}'],
// 	safelist: [
// 		// Variants
// 		'text-4xl', 'leading-12', 'font-semibold', 'tracking-tight', 'text-balance', 'sm:text-5xl',
// 		'text-xl', 'leading-9', 'font-medium',
// 		'text-lg', 'leading-7',
// 		'text-base/7', 'text-gray-500',

// 		// Colors
// 		'text-gray-950',
// 		'text-indigo-600',
// 		'text-amber-500',

// 		// Padding
// 		'py-1', 'py-2', 'py-4', 'py-6', 'py-8'
// 	],
// 	theme: {
// 		extend: {}
// 	},
// 	plugins: [
// 		forms,
// 		skeleton({
// 			themes: {
// 				preset: ['wintry']
// 			}
// 		})
// 	]
// };

// export default config;

