<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import {
		capabilitiesRevision,
		loadCapabilities
	} from '$lib/features/forms/shared/stores/capabilities.store';
	import { normalizeAgencyName } from '$lib/features/forms/persistence/agency';
	import { buildWeekSatSunSchema } from '$lib/features/forms/grids/weekSatSun/rules/gridSchema.rules';
	import {
		gridDraftKey,
		hasGridDraft,
		loadGridDraft
	} from '$lib/features/forms/grids/weekSatSun/stores/gridDraft.store';
	import {
		buildGridValuesFromSnapshot,
		inferSelectedModesFromSnapshot
	} from '$lib/features/forms/grids/weekSatSun/rules/rdsMonthlyMapping.rules';
	import { URBAN_MODES, RURAL_MODES } from '$lib/shared/rules/modes.rules';
	import FiscalGrid from '$lib/shared/ui/widgets/fiscalGrid/FiscalGrid.svelte';
	import {
		createColConfig,
		getFiscalMonths
	} from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.logic';
	import type { GridValues, RowDef } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.types';
	import type { Capabilities, DaySlug } from '$lib/features/forms/shared/types/capabilities.types';
	import type { RdsDaySnapshot } from '$lib/features/forms/grids/weekSatSun/types/rdsSnapshot.types';

	let { data }: { data: PageData } = $props();
	const type = $derived(page.params.type as 'urban' | 'rural');
	const year = $derived(Number(page.params.year));
	function matchesOverviewAgency(existing: Capabilities | null): existing is Capabilities {
		if (!existing) return false;
		if (!data.overviewCapabilities?.ctpGranteeLegalName) return true;
		return (
			normalizeAgencyName(existing.ctpGranteeLegalName) ===
			normalizeAgencyName(data.overviewCapabilities.ctpGranteeLegalName)
		);
	}

	const storedCapabilities = $derived.by<Capabilities | null>(() => {
		$capabilitiesRevision;
		return data.readonlyYear ? null : loadCapabilities(type, year);
	});
	const capabilities = $derived<Capabilities | null>(
		matchesOverviewAgency(storedCapabilities) ? storedCapabilities : data.overviewCapabilities
	);
	const inferredModeIds = $derived.by<string[]>(() => {
		const modes = new Set<string>();
		for (const snapshot of Object.values(data.rdsSnapshots)) {
			for (const mode of inferSelectedModesFromSnapshot(type, snapshot)) {
				modes.add(mode);
			}
		}
		return Array.from(modes);
	});
	const fallbackCapabilities = $derived.by<Capabilities>(() => {
		const defaultModes = (type === 'urban' ? URBAN_MODES : RURAL_MODES).map((mode) => mode.id);
		return {
			ctpGranteeLegalName: '',
			contactFirstName: '',
			contactLastName: '',
			email: '',
			phone: '',
			date: '',
			selectedModes: inferredModeIds.length > 0 ? inferredModeIds : defaultModes,
			days: {
				weekday: { offered: true },
				saturday: { offered: (data.rdsSnapshots.saturday?.rows.length ?? 0) > 0 },
				sunday: { offered: (data.rdsSnapshots.sunday?.rows.length ?? 0) > 0 }
			}
		};
	});
	const effectiveCapabilities = $derived.by<Capabilities>(() => {
		if (!capabilities) return fallbackCapabilities;
		return capabilities;
	});
	const rows = $derived<RowDef[]>(
		buildWeekSatSunSchema({ type, slug: 'weekday', capabilities: effectiveCapabilities })
	);

	const { COL_MONTHS, TOTAL_COLS } = createColConfig(getFiscalMonths().length);
	const daySlugs = $derived.by<DaySlug[]>(() => {
		return (['weekday', 'saturday', 'sunday'] as DaySlug[]).filter(
			(slug) => effectiveCapabilities.days[slug].offered !== false
		);
	});

	function createEmptyValues(rowCount: number): GridValues {
		return Array.from({ length: rowCount }, () => Array.from({ length: TOTAL_COLS }, () => null));
	}

	function loadValuesForDay(
		slug: DaySlug,
		dayRows: RowDef[],
		snapshot: RdsDaySnapshot | null
	): GridValues {
		const fromRds = buildGridValuesFromSnapshot(type, dayRows, TOTAL_COLS, snapshot);
		if (data.readonlyYear) return fromRds;

		const draftKey = gridDraftKey(type, year, slug);
		if (!hasGridDraft(draftKey)) return fromRds;
		return loadGridDraft(draftKey, dayRows, TOTAL_COLS);
	}

	function buildWeeklyTotals(
		rows: RowDef[],
		dayValuesBySlug: Partial<Record<DaySlug, { rows: RowDef[]; values: GridValues }>>
	): GridValues {
		const totals = createEmptyValues(rows.length);

		for (let r = 0; r < rows.length; r++) {
			const targetRow = rows[r];
			if (targetRow?.type !== 'number') continue;

			for (let c = 0; c < COL_MONTHS; c++) {
				let sum = 0;

				for (const slug of daySlugs) {
					const day = dayValuesBySlug[slug];
					if (!day) continue;
					const sourceRowIndex = day.rows.findIndex((row) => row.id === targetRow.id);
					if (sourceRowIndex === -1) continue;
					const value = day.values[sourceRowIndex]?.[c];
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

		const valuesBySlug: Partial<Record<DaySlug, { rows: RowDef[]; values: GridValues }>> = {};
		for (const slug of daySlugs) {
			const dayRows = buildWeekSatSunSchema({ type, slug, capabilities: effectiveCapabilities });
			valuesBySlug[slug] = {
				rows: dayRows,
				values: loadValuesForDay(slug, dayRows, data.rdsSnapshots[slug] ?? null)
			};
		}
		return buildWeeklyTotals(rows, valuesBySlug);
	});
</script>

<section class="flex flex-col">
	<div class="flex items-center">
		<!-- <h1
			class="px-4 text-[2.125rem] font-bold tracking-wide text-[var(--accent-color)] capitalize dark:text-[var(--accent-color)]"
		>
			Weekly Totals
		</h1> -->
	</div>

	<FiscalGrid {rows} {initialValues} readonly={true} />
</section>
