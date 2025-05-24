<script lang="ts">
	export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';

	// Map size prop to Tailwind margin classes
	const marginClasses = {
		xs: 'mt-2',
		sm: 'mt-4',
		md: 'mt-6',
		lg: 'mt-8',
		xl: 'mt-12'
	};
</script>

<hr class={`w-full border-none ${marginClasses[size]}`} />
