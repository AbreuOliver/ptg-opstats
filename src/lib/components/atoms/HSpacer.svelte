<script lang="ts" context="module">
	export interface HSpacerProps {
		marginLeft?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
		marginRight?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
	}
</script>

<script lang="ts">
	export let marginLeft: HSpacerProps['marginLeft'] | undefined = undefined;
	export let marginRight: HSpacerProps['marginRight'] | undefined = undefined;

	const marginLeftClasses: Record<NonNullable<HSpacerProps['marginLeft']>, string> = {
		xs: 'ml-1',
		sm: 'ml-2',
		md: 'ml-4',
		lg: 'ml-6',
		xl: 'ml-8',
		'2xl': 'ml-10'
	};

	const marginRightClasses: Record<NonNullable<HSpacerProps['marginRight']>, string> = {
		xs: 'mr-1',
		sm: 'mr-2',
		md: 'mr-4',
		lg: 'mr-6',
		xl: 'mr-8',
		'2xl': 'mr-10'
	};

	const mlClass = marginLeft ? marginLeftClasses[marginLeft] : '';
	const mrClass = marginRight ? marginRightClasses[marginRight] : '';
</script>

<hr class={`w-full border-none ${mlClass} ${mrClass}`} />
