<script lang="ts">
	import FiscalGrid from '$lib/shared/ui/widgets/fiscalGrid/FiscalGrid.svelte';
	import { loadCapabilities } from '$lib/features/forms/shared/stores/capabilities.store';
	import { buildWeekSatSunSchema } from '../rules/gridSchema.rules';
	import { createGridDraftSaver, gridDraftKey, loadGridDraft } from '../stores/gridDraft.store';
	import {
		createColConfig,
		getFiscalMonths
	} from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.logic';
	import type { Capabilities } from '$lib/features/forms/shared/types/capabilities.types';
	import type { GridValues, RowDef } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.types';

	let {
		type,
		year,
		slug
	}: {
		type: 'urban' | 'rural';
		year: number;
		slug: 'weekday' | 'saturday' | 'sunday';
	} = $props();

	const capabilities = $derived<Capabilities | null>(loadCapabilities(type, year));
	const rows = $derived<RowDef[]>(
		capabilities ? buildWeekSatSunSchema({ type, slug, capabilities }) : []
	);
	const totalCols = createColConfig(getFiscalMonths().length).TOTAL_COLS;
	const draftKey = $derived(gridDraftKey(type, year, slug));
	const initialValues = $derived<GridValues>(loadGridDraft(draftKey, rows, totalCols));
	const onValuesChange = $derived<((values: GridValues) => void) | undefined>(
		createGridDraftSaver(draftKey, rows)
	);
	const title = $derived(slug.charAt(0).toUpperCase() + slug.slice(1));
</script>

<section class="flex h-full min-h-0 flex-col gap-2">
	<!--
	<h1
		class="px-4 text-[2.125rem] font-bold tracking-wide text-[var(--theme-color)] capitalize dark:text-[var(--accent-color)]"
	>
		{title}
	</h1>
	-->
	{#if !capabilities}
		<div
			class="rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
		>
			Complete Overview first.
		</div>
	{:else if capabilities.days[slug].offered === false}
		<div
			class="rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
		>
			No service offered on {title} — nothing to report.
		</div>
	{:else}
		<div class="flex-1 min-h-0">
			<FiscalGrid {rows} {initialValues} {onValuesChange} />
		</div>
	{/if}
</section>
