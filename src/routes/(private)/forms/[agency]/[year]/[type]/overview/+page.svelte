<script lang="ts">
    import { page } from '$app/state';
    import type { PageData } from './$types';
    import UrbanOverviewPage from '$lib/features/forms/urban/overview/ui/UrbanOverviewPage.svelte';
    import RuralOverviewPage from '$lib/features/forms/rural/overview/ui/RuralOverviewPage.svelte';
	import { isEditableFiscalYear } from '$lib/features/forms/shared/fiscalYearAccess';

	let { data }: { data: PageData } = $props();
    const type = $derived(page.params.type as 'urban' | 'rural');
    const year = $derived(Number(page.params.year));
	const currentFiscalYear = $derived.by(() => {
		const now = new Date();
		return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
	});
	const readonly = $derived(!isEditableFiscalYear(year, currentFiscalYear));
</script>

{#if type === 'urban'}
    <UrbanOverviewPage {type} {year} {readonly} prefill={data.overviewPrefill} />
{:else}
    <RuralOverviewPage {type} {year} {readonly} prefill={data.overviewPrefill} />
{/if}
