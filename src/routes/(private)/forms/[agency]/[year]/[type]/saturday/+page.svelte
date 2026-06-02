<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import WeekSatSunGridPage from '$lib/features/forms/grids/weekSatSun/ui/WeekSatSunGridPage.svelte';

	let { data }: { data: PageData } = $props();
	const type = $derived(page.params.type as 'urban' | 'rural');
	const year = $derived(Number(page.params.year));
</script>

<WeekSatSunGridPage
	{type}
	{year}
	slug="saturday"
	rdsSnapshot={data.rdsSnapshot}
	readonlyYear={data.readonlyYear}
	overviewCapabilities={data.overviewCapabilities}
/>
