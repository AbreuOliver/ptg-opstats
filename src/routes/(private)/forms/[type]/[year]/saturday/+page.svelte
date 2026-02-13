<script lang="ts">
	import { page } from '$app/state';
	import WeekSatSunGridPage from '$lib/features/forms/grids/weekSatSun/ui/WeekSatSunGridPage.svelte';

	const type = $derived(page.params.type as 'urban' | 'rural');
	const year = $derived(Number(page.params.year));
</script>

<WeekSatSunGridPage {type} {year} slug="saturday" />
