<script lang="ts">
	import UrbanOverviewForm from './UrbanOverviewForm.svelte';
	import { defaultCapabilities } from '$lib/features/forms/shared/rules/defaultCapabilities.rules';
	import { normalizeCapabilities } from '$lib/features/forms/shared/rules/normalizeCapabilities.rules';
	import { assertCapabilities } from '$lib/features/forms/shared/guards/capabilities.guard';
	import {
		loadCapabilities,
		saveCapabilities
	} from '$lib/features/forms/shared/stores/capabilities.store';
	import { capabilitiesKey } from '$lib/features/forms/shared/stores/capabilities.store';
	import {
		getFormDraftSnapshot,
		setFormDraftSnapshot,
		setFormRemoteSnapshot,
		resolveFormDraftSnapshot
	} from '$lib/features/forms/persistence/formDraftRegistry';
	import { normalizeAgencyName } from '$lib/features/forms/persistence/agency';
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

	function matchesPrefillAgency(existing: Capabilities | null): existing is Capabilities {
		if (!existing) return false;
		if (!prefill?.ctpGranteeLegalName) return true;
		return (
			normalizeAgencyName(existing.ctpGranteeLegalName) ===
			normalizeAgencyName(prefill.ctpGranteeLegalName)
		);
	}

	function readLiveCapabilities(key: string): Capabilities | null {
		try {
			return assertCapabilities(getFormDraftSnapshot(key));
		} catch {
			return null;
		}
	}

	$effect(() => {
		const nextKey = `${type}:${year}`;
		if (nextKey !== lastKey) {
			lastKey = nextKey;
			const liveExisting = readLiveCapabilities(capabilitiesKey(type, year));
			const existing = liveExisting ?? loadCapabilities(type, year);
			const existingForAgency = matchesPrefillAgency(existing) ? existing : null;
			const next = readonly
				? (prefill ?? defaultCapabilities(type))
				: (existingForAgency ?? prefill ?? defaultCapabilities(type));
			model = resolveFormDraftSnapshot(
				capabilitiesKey(type, year),
				prefill ?? defaultCapabilities(type),
				next
			) as Capabilities;
			if (!readonly && !existingForAgency && prefill) saveCapabilities(type, year, next);
			setFormDraftSnapshot(capabilitiesKey(type, year), model);
			setFormRemoteSnapshot(capabilitiesKey(type, year), prefill ?? defaultCapabilities(type));
		}
	});


	function queueSave(next: Capabilities) {
		if (readonly) return;
		const normalized = normalizeCapabilities(next);
		model = normalized;
		setFormDraftSnapshot(capabilitiesKey(type, year), normalized);

		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => saveCapabilities(type, year, normalized), 300);
	}
</script>

	<section class="flex flex-col">
	<UrbanOverviewForm
		bind:value={model}
		onChange={queueSave}
		{readonly}
		snapshotKey={capabilitiesKey(type, year)}
	/>
</section>
