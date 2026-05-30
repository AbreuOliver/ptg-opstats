<script lang="ts">
	import UrbanOverviewForm from './UrbanOverviewForm.svelte';
	import { defaultCapabilities } from '$lib/features/forms/shared/rules/defaultCapabilities.rules';
	import { normalizeCapabilities } from '$lib/features/forms/shared/rules/normalizeCapabilities.rules';
	import {
		loadCapabilities,
		saveCapabilities
	} from '$lib/features/forms/shared/stores/capabilities.store';
	import type { Capabilities, FormType } from '$lib/features/forms/shared/types/capabilities.types';

	let {
		type,
		year,
		readonly = false,
		prefill = null
	}: {
		type: FormType;
		year: number;
		readonly?: boolean;
		prefill?: Capabilities | null;
	} = $props();

	let model = $state<Capabilities>(defaultCapabilities(type));
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let lastKey = '';

	$effect(() => {
		const nextKey = `${type}:${year}`;
		if (nextKey !== lastKey) {
			lastKey = nextKey;
			const existing = loadCapabilities(type, year);
			const next = readonly ? (prefill ?? defaultCapabilities(type)) : (existing ?? prefill ?? defaultCapabilities(type));
			model = next;
			if (!readonly && !existing && prefill) saveCapabilities(type, year, next);
		}
	});


	function queueSave(next: Capabilities) {
		if (readonly) return;
		const normalized = normalizeCapabilities(next);
		model = normalized;

		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => saveCapabilities(type, year, normalized), 300);
	}
</script>

<section class="flex flex-col">
	<UrbanOverviewForm bind:value={model} onChange={queueSave} {readonly} />
</section>
