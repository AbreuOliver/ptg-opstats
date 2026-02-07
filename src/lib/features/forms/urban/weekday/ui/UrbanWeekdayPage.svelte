<script lang="ts">
	import { buildUrbanWeekdayGridModel } from '../rules/gridModel.rules';
	import { createEmptyValues, recalcAll, applyCellEdit } from '$lib/shared/ui/widgets/dataGrid/grid.engine';
	import FiscalGrid from '$lib/shared/ui/widgets/dataGrid/FiscalGrid.svelte';

	const model = buildUrbanWeekdayGridModel();
	let values = recalcAll(model, createEmptyValues(model));

	function onEdit(e: CustomEvent<{ r: number; c: number; value: number | null }>) {
		const { r, c, value } = e.detail;
		values = applyCellEdit(model, values, r, c, value);
	}
</script>

<FiscalGrid {model} {values} on:edit={onEdit} />
