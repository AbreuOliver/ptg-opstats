<!-- deprecated: use UrbanOverviewPage -->
<script lang="ts">
	import UrbanOverviewPage from '$lib/features/forms/urban/overview/ui/UrbanOverviewPage.svelte';

	let {
		type = 'urban',
		year = new Date().getFullYear()
	}: {
		type?: 'urban' | 'rural';
		year?: number;
	} = $props();
</script>

<UrbanOverviewPage {type} {year} />
