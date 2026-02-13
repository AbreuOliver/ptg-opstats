<script lang="ts">
	let {
		height = 'md',
		marginLeft = undefined,
		marginRight = undefined
	}: {
		height?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
		marginLeft?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined;
		marginRight?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined;
	} = $props();

	const heightClasses = {
		sm: 'h-6',
		md: 'h-8',
		lg: 'h-10',
		xl: 'h-12',
		'2xl': 'h-14'
	};

	const marginClasses = {
		xs: 'm-1',
		sm: 'm-2',
		md: 'm-4',
		lg: 'm-6',
		xl: 'm-8'
	};

	const mlClass = marginLeft ? `ml-${marginClasses[marginLeft].slice(2)}` : '';
	const mrClass = marginRight ? `mr-${marginClasses[marginRight].slice(2)}` : '';
</script>

<svg
	version="1.1"
	id="Layer_1"
	xmlns="http://www.w3.org/2000/svg"
	xmlns:xlink="http://www.w3.org/1999/xlink"
	x="0px"
	y="0px"
	class={`w-auto ${heightClasses[height]} ${mlClass} ${mrClass} flex items-center justify-center`}
	viewBox="0 0 301.17 100"
	style="enable-background:new 0 0 301.17 100;"
	xml:space="preserve"
>
	<style type="text/css">
		.st0 {
			fill: #cc0000;
		}
	</style>
	<g class="dark:text-neutral-100/50 text-neutral-900" fill="currentColor">
		<g>
			<polygon
				class="st0"
				points="88.69,50 38.69,0 0,38.69 38.69,38.69 38.69,22 66.69,50 38.69,78 38.69,61.31 0,61.31 38.69,100 		
			"
			/>
		</g>
		<g>
			<path d="M101.17,79.75v-59.5h21.59v59.5H101.17z" />
			<path d="M147.74,79.75V39.07l-12.13,0.54V20.25h45.5v19.36l-12.13-0.54v40.68H147.74z" />
			<path
				d="M194.39,79.75v-59.5h26.85c6.24,0,12.76,0.71,18.2,6.15c3.03,3.03,5.62,7.58,5.62,14.63c0,5.26-1.61,8.56-3.3,10.62
			c-1.78,2.23-4.73,4.01-8.21,4.73v0.54c1.16,0.62,2.32,1.52,3.12,2.77l13.38,20.07h-24.89l-8.56-17.39
			c-0.27-0.63-0.54-0.89-0.8-1.87l-0.36,0.18v19.09H194.39z M215.44,46.74h2.5c1.25,0,3.21-0.18,4.55-1.34
			c0.71-0.63,1.52-1.78,1.52-3.66c0-1.34-0.36-2.68-1.16-3.57c-0.71-0.8-1.87-1.61-3.66-1.61h-3.75V46.74z"
			/>
			<path
				d="M260.49,79.75v-59.5h40.14v16.33h-18.55v5.53h16.86v15.61h-16.86v5.71h19.09v16.32H260.49z"
			/>
		</g>
	</g>
</svg>
