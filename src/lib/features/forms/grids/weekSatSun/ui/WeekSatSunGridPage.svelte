<script lang="ts">
	import FiscalGrid from '$lib/shared/ui/widgets/fiscalGrid/FiscalGrid.svelte';
	import { loadCapabilities } from '$lib/features/forms/shared/stores/capabilities.store';
	import { buildWeekSatSunSchema } from '../rules/gridSchema.rules';
	import { createGridDraftSaver, gridDraftKey, loadGridDraft } from '../stores/gridDraft.store';
	import type { Capabilities } from '$lib/features/forms/shared/types/capabilities.types';
	import type { GridValues, RowDef } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.types';

	export let type: 'urban' | 'rural';
	export let year: number;
	export let slug: 'weekday' | 'saturday' | 'sunday';

	let capabilities: Capabilities | null = null;
	let rows: RowDef[] = [];
	let initialValues: GridValues | undefined = undefined;
	let onValuesChange: ((values: GridValues) => void) | undefined = undefined;
	let draftKey = '';
	let title = '';

	$: capabilities = loadCapabilities(type, year);
	$: rows = capabilities ? buildWeekSatSunSchema({ type, capabilities }) : [];
	$: draftKey = gridDraftKey(type, year, slug);
	$: initialValues = loadGridDraft(draftKey) ?? undefined;
	$: onValuesChange = createGridDraftSaver(draftKey);
	$: title = slug.charAt(0).toUpperCase() + slug.slice(1);
</script>

<section class="flex flex-col">
	<h1 class="mb-4 pl-4 text-3xl font-semibold text-zinc-800 dark:text-white">{title}</h1>
	{#if !capabilities}
		<div class="rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
			Complete Overview first.
		</div>
	{:else if capabilities.days[slug].offered === false}
		<div class="rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
			No service offered on {title} — nothing to report.
		</div>
	{:else}
		<FiscalGrid {rows} {initialValues} {onValuesChange} />
	{/if}
</section>
