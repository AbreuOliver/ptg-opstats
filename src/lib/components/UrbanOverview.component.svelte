<!-- deprecated: use UrbanOverviewPage -->
<script lang="ts">
	import UrbanOverviewPage from '$lib/features/forms/urban/overview/ui/UrbanOverviewPage.svelte';

	export let type: 'urban' | 'rural' = 'urban';
	export let year: number = new Date().getFullYear();
</script>

<UrbanOverviewPage {type} {year} />
