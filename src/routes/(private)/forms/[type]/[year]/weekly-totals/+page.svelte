<script lang="ts">
	import { page } from '$app/state';
	import { loadCapabilities } from '$lib/features/forms/shared/stores/capabilities.store';
	import { buildWeekSatSunSchema } from '$lib/features/forms/grids/weekSatSun/rules/gridSchema.rules';
	import {
		gridDraftKey,
		loadGridDraft
	} from '$lib/features/forms/grids/weekSatSun/stores/gridDraft.store';
	import FiscalGrid from '$lib/shared/ui/widgets/fiscalGrid/FiscalGrid.svelte';
	import {
		createColConfig,
		getFiscalMonths
	} from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.logic';
	import type { GridValues, RowDef } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.types';
	import type { Capabilities, DaySlug } from '$lib/features/forms/shared/types/capabilities.types';

	const type = $derived(page.params.type as 'urban' | 'rural');
	const year = $derived(Number(page.params.year));
	const capabilities = $derived<Capabilities | null>(loadCapabilities(type, year));
	const rows = $derived<RowDef[]>(
		capabilities ? buildWeekSatSunSchema({ type, slug: 'weekday', capabilities }) : []
	);

	const { COL_MONTHS, TOTAL_COLS } = createColConfig(getFiscalMonths().length);
	const daySlugs: DaySlug[] = ['weekday', 'saturday', 'sunday'];

	function createEmptyValues(rowCount: number): GridValues {
		return Array.from({ length: rowCount }, () => Array.from({ length: TOTAL_COLS }, () => null));
	}

	function buildWeeklyTotals(rows: RowDef[], dayDrafts: GridValues[]): GridValues {
		const totals = createEmptyValues(rows.length);

		for (let r = 0; r < rows.length; r++) {
			if (rows[r]?.type !== 'number') continue;

			for (let c = 0; c < COL_MONTHS; c++) {
				let sum = 0;

				for (const draft of dayDrafts) {
					const value = draft[r]?.[c];
					if (typeof value === 'number') {
						sum += value;
					}
				}

				totals[r][c] = sum;
			}
		}

		return totals;
	}

	const initialValues = $derived.by<GridValues>(() => {
		if (!rows.length) return createEmptyValues(0);

		const drafts = daySlugs.map((slug) =>
			loadGridDraft(gridDraftKey(type, year, slug), rows, TOTAL_COLS)
		);
		return buildWeeklyTotals(rows, drafts);
	});
</script>

<section class="flex flex-col gap-3">
	<div class="flex items-center">
		<!-- <h1
			class="px-4 text-[2.125rem] font-bold tracking-wide text-[var(--accent-color)] capitalize dark:text-[var(--accent-color)]"
		>
			Weekly Totals
		</h1> -->
		<div class="px-4 text-sm font-semibold tracking-wide text-[var(--text)] uppercase">
			No data entry on this form
		</div>
	</div>

	{#if !capabilities}
		<div
			class="rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
		>
			Complete Overview first.
		</div>
	{:else}
		<FiscalGrid {rows} {initialValues} readonly={true} />
	{/if}
</section>
