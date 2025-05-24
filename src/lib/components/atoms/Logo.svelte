<script lang="ts" context="module">
	export interface LogoProps {
		height: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
		marginLeft?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
		marginRight?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
	}
</script>

<script lang="ts">
	export let height: LogoProps['height'];
	export let marginLeft: LogoProps['marginLeft'] | undefined = undefined;
	export let marginRight: LogoProps['marginRight'] | undefined = undefined;

	const heightClasses: Record<LogoProps['height'], string> = {
		sm: 'h-6',
		md: 'h-8',
		lg: 'h-10',
		xl: 'h-12',
		'2xl': 'h-14'
	};

	const marginLeftClasses: Record<NonNullable<LogoProps['marginLeft']>, string> = {
		xs: 'ml-1',
		sm: 'ml-2',
		md: 'ml-4',
		lg: 'ml-6',
		xl: 'ml-8',
		'2xl': 'ml-10'
	};

	const marginRightClasses: Record<NonNullable<LogoProps['marginRight']>, string> = {
		xs: 'mr-1',
		sm: 'mr-2',
		md: 'mr-4',
		lg: 'mr-6',
		xl: 'mr-8',
		'2xl': 'mr-10'
	};

	const mlClass = marginLeft ? marginLeftClasses[marginLeft] : '';
	const mrClass = marginRight ? marginRightClasses[marginRight] : '';

	const mbClass = (height === 'xl' || height === '2xl') ? 'pb-2' : 'pb-0.5';
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	fill="none"
	stroke="#000"
	stroke-linecap="round"
	stroke-linejoin="round"
	stroke-width="2"
	class={`${mbClass} w-auto ${heightClasses[height]} ${mlClass} ${mrClass}`}
>
	<!-- <g fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
			<path d="M12 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8M3 10h18M10 3v18m6 1l5-5" />
			<path d="M21 21.5V17h-4.5" />
		</g> -->
	<path
		fill="none"
		stroke="#000"
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width="2"
		d="M19 22.5a4.75 4.75 0 0 1 3.5-3.5a4.75 4.75 0 0 1-3.5-3.5a4.75 4.75 0 0 1-3.5 3.5a4.75 4.75 0 0 1 3.5 3.5M12 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 10h18M10 3v18"
	/>
</svg>
