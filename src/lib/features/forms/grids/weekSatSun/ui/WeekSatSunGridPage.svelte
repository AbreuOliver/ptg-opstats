<script lang="ts">
	import { browser } from '$app/environment';
	import FiscalGrid from '$lib/shared/ui/widgets/fiscalGrid/FiscalGrid.svelte';
	import {
		capabilitiesRevision,
		loadCapabilities
	} from '$lib/features/forms/shared/stores/capabilities.store';
	import { normalizeAgencyName } from '$lib/features/forms/persistence/agency';
	import { URBAN_MODES, RURAL_MODES } from '$lib/shared/rules/modes.rules';
	import { buildWeekSatSunSchema } from '../rules/gridSchema.rules';
	import {
		createGridDraftSaver,
		gridDraftKey,
		loadGridDraft
	} from '../stores/gridDraft.store';
	import { setFormRemoteSnapshot } from '$lib/features/forms/persistence/formDraftRegistry';
	import {
		buildGridValuesFromSnapshot,
		inferSelectedModesFromSnapshot
	} from '../rules/rdsMonthlyMapping.rules';
	import {
		createColConfig,
		getFiscalMonths
	} from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.logic';
	import type { Capabilities } from '$lib/features/forms/shared/types/capabilities.types';
	import type { RdsDaySnapshot } from '../types/rdsSnapshot.types';
	import type { GridValues, RowDef } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.types';

	let {
		type,
		year,
		slug,
		rdsSnapshot = null,
		readonlyYear = false,
		overviewCapabilities = null
	}: {
		type: 'urban' | 'rural';
		year: number;
		slug: 'weekday' | 'saturday' | 'sunday';
		rdsSnapshot?: RdsDaySnapshot | null;
		readonlyYear?: boolean;
		overviewCapabilities?: Capabilities | null;
	} = $props();

	function matchesOverviewAgency(existing: Capabilities | null): existing is Capabilities {
		if (!existing) return false;
		if (!overviewCapabilities?.ctpGranteeLegalName) return true;
		return (
			normalizeAgencyName(existing.ctpGranteeLegalName) ===
			normalizeAgencyName(overviewCapabilities.ctpGranteeLegalName)
		);
	}

	const storedCapabilities = $derived.by<Capabilities | null>(() => {
		$capabilitiesRevision;
		return readonlyYear ? null : loadCapabilities(type, year);
	});
	const capabilities = $derived<Capabilities | null>(
		matchesOverviewAgency(storedCapabilities) ? storedCapabilities : overviewCapabilities
	);
	const fallbackCapabilities = $derived.by<Capabilities>(() => {
		const inferredModes = inferSelectedModesFromSnapshot(type, rdsSnapshot);
		const defaultModes = (type === 'urban' ? URBAN_MODES : RURAL_MODES).map((mode) => mode.id);
		return {
			ctpGranteeLegalName: '',
			contactFirstName: '',
			contactLastName: '',
			email: '',
			phone: '',
			date: '',
			selectedModes: inferredModes.length > 0 ? inferredModes : defaultModes,
			days: {
				weekday: { offered: true },
				saturday: { offered: true },
				sunday: { offered: true }
			}
		};
	});
	const effectiveCapabilities = $derived<Capabilities>(capabilities ?? fallbackCapabilities);
	const rows = $derived<RowDef[]>(
		buildWeekSatSunSchema({ type, slug, capabilities: effectiveCapabilities })
	);
	const totalCols = createColConfig(getFiscalMonths().length).TOTAL_COLS;
	const draftKey = $derived(gridDraftKey(type, year, slug));
	const baselineValues = $derived.by<GridValues>(() => {
		return buildGridValuesFromSnapshot(type, rows, totalCols, rdsSnapshot);
	});
	const initialValues = $derived.by<GridValues>(() => {
		const fromRds = baselineValues;
		return loadGridDraft(draftKey, rows, totalCols, fromRds);
	});
	const onValuesChange = $derived<((values: GridValues) => void) | undefined>(
		readonlyYear ? undefined : createGridDraftSaver(draftKey, rows)
	);
	const title = $derived(slug.charAt(0).toUpperCase() + slug.slice(1));
	const operatingDaysMax = $derived(slug === 'weekday' ? 23 : 5);
	const rowMaxById = $derived.by<Record<string, number>>(() => {
		const maxBySuffix: Record<string, number> =
			type === 'urban'
				? {
						am_pm_peak_period_vehicles: 50000,
						midday_vehicles: 10000,
						total_unlinked_passenger_trips: 400000,
						vehicle_revenue_miles: 50000,
						vehicle_revenue_hours: 50000
					}
				: {
						hours: 50000,
						miles: 500000,
						pt_nc: 400000,
						medicaid: 50000,
						nonmedicaid: 25000
					};

		const perRowMax: Record<string, number> = {};
		for (const row of rows) {
			if (row.type !== 'number' || row.id === 'operating_days') continue;
			const suffix = row.id.split('__').pop() ?? '';
			const max = maxBySuffix[suffix];
			if (max !== undefined) perRowMax[row.id] = max;
		}
		return perRowMax;
	});

	function toRemoteDraft(values: GridValues): Record<string, (number | null)[]> {
		const draftByRowId: Record<string, (number | null)[]> = {};
		for (let rowIndex = 0; rowIndex < Math.min(rows.length, values.length); rowIndex++) {
			draftByRowId[rows[rowIndex].id] = Array.isArray(values[rowIndex])
				? (values[rowIndex].slice() as (number | null)[])
				: [];
		}
		return draftByRowId;
	}

	$effect(() => {
		if (!browser) return;
		const remoteValues = buildGridValuesFromSnapshot(type, rows, totalCols, rdsSnapshot);
		setFormRemoteSnapshot(draftKey, toRemoteDraft(remoteValues));
	});
</script>

<section class="flex h-full min-h-0 flex-col gap-2">
	<!--
	<h1
		class="px-4 text-[2.125rem] font-bold tracking-wide text-[var(--theme-color)] capitalize dark:text-[var(--accent-color)]"
	>
		{title}
	</h1>
	-->
	{#if effectiveCapabilities.days[slug].offered === false}
		<div
			class="rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
		>
			No service offered on {title} — nothing to report.
		</div>
	{:else}
		<div class="min-h-0 flex-1">
			<FiscalGrid
				{rows}
				{initialValues}
				{baselineValues}
				{onValuesChange}
				{operatingDaysMax}
				{rowMaxById}
				snapshotKey={draftKey}
				readonly={readonlyYear}
			/>
		</div>
	{/if}
</section>
