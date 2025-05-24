<script lang="ts">
	export let height: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md';
	export let marginLeft: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined = undefined;
	export let marginRight: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined = undefined;

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

<img
	src="https://ik.imagekit.io/bip1v395ybp/02%20Primary%20ITRE%20Only%202CK_f3AhC2Oya.png?updatedAt=1732400411825"
	alt="logo"
	class={`w-auto ${heightClasses[height]} ${mlClass} ${mrClass}`}
/>
