<script lang="ts">
	import UrbanOverviewForm from './UrbanOverviewForm.svelte';
	import { defaultCapabilities } from '$lib/features/forms/shared/rules/defaultCapabilities.rules';
	import { normalizeCapabilities } from '$lib/features/forms/shared/rules/normalizeCapabilities.rules';
	import {
		loadCapabilities,
		saveCapabilities
	} from '$lib/features/forms/shared/stores/capabilities.store';
	import type { Capabilities, FormType } from '$lib/features/forms/shared/types/capabilities.types';

	export let type: FormType;
	export let year: number;

	let model: Capabilities = defaultCapabilities(type);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let lastKey = '';

	$: {
		const nextKey = `${type}:${year}`;
		if (nextKey !== lastKey) {
			lastKey = nextKey;
			const existing = loadCapabilities(type, year);
			model = existing ?? defaultCapabilities(type);
		}
	}


	function queueSave(next: Capabilities) {
		console.log('queueSave IN  selectedModes:', next.selectedModes);

		const normalized = normalizeCapabilities(next);

		console.log('queueSave OUT selectedModes:', normalized.selectedModes);

		model = normalized;

		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => saveCapabilities(type, year, normalized), 300);
	}
</script>

<section class="flex flex-col">
	<h1 class="mb-4 pl-4 text-3xl font-semibold text-zinc-800 dark:text-white">Overview</h1>
	<UrbanOverviewForm bind:value={model} onChange={queueSave} />
</section>
