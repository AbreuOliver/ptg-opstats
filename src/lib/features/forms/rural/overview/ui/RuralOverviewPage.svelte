<script lang="ts">
	import RuralOverviewForm from './RuralOverviewForm.svelte';
	import { defaultCapabilities } from '$lib/features/forms/shared/rules/defaultCapabilities.rules';
	import { normalizeCapabilities } from '$lib/features/forms/shared/rules/normalizeCapabilities.rules';
	import {
		loadCapabilities,
		saveCapabilities
	} from '$lib/features/forms/shared/stores/capabilities.store';
	import type { Capabilities, FormType } from '$lib/features/forms/shared/types/capabilities.types';

	let { type, year }: { type: FormType; year: number } = $props();

	let model = $state<Capabilities>(defaultCapabilities(type));
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let lastKey = '';

	$effect(() => {
		const nextKey = `${type}:${year}`;
		if (nextKey !== lastKey) {
			lastKey = nextKey;
			const existing = loadCapabilities(type, year);
			model = existing ?? defaultCapabilities(type);
		}
	});

	function queueSave(next: Capabilities) {
		const normalized = normalizeCapabilities(next);
		model = normalized;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => saveCapabilities(type, year, normalized), 300);
	}
</script>

<section class="flex flex-col">
	<h1 class="text-zinc-800 dark:text-white text-3xl font-semibold mb-4 pl-4">Overview</h1>
	<RuralOverviewForm bind:value={model} onChange={queueSave} />
</section>
