<script lang="ts">
	import { page } from '$app/state';
	import UrbanOverviewPage from '$lib/features/forms/urban/overview/ui/UrbanOverviewPage.svelte';
	import RuralOverviewPage from '$lib/features/forms/rural/overview/ui/RuralOverviewPage.svelte';

	$: type = page.params.type as 'urban' | 'rural';
	$: year = Number(page.params.year);
</script>

{#if type === 'urban'}
	<UrbanOverviewPage {type} {year} />
{:else}
	<RuralOverviewPage {type} {year} />
{/if}
