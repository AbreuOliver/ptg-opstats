<!-- deprecated; use WeekSatSunGridPage. -->
<script lang="ts">
	import FiscalGrid from '$lib/shared/ui/widgets/fiscalGrid/FiscalGrid.svelte';
	import { RURAL_MODES } from '$lib/shared/rules/modes.rules';
	import {
		buildWeekSatSunRows,
		WEEK_SAT_SUN_TEMPLATE
	} from '$lib/features/forms/grids/weekSatSun/rules/buildWeekSatSunRows.rules';

	const activeModes = new Set(['dr_do', 'dr_pt', 'mb_do', 'mb_pt', 'mt_do', 'mt_pt']);
	const rows = buildWeekSatSunRows({
		activeModes,
		modeCatalog: RURAL_MODES,
		template: WEEK_SAT_SUN_TEMPLATE
	});
</script>

<FiscalGrid {rows} />
