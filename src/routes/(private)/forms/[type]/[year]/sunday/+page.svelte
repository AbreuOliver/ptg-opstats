<script lang="ts">
	import { page } from '$app/state';
	import WeekSatSunGridPage from '$lib/features/forms/grids/weekSatSun/ui/WeekSatSunGridPage.svelte';

	$: type = page.params.type as 'urban' | 'rural';
	$: year = Number(page.params.year);
</script>

<WeekSatSunGridPage {type} {year} slug="sunday" />
