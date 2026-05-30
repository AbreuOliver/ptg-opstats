<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { TRANSIT_SYSTEM_NAMES } from '$lib/data/transitSystems';
	import { toAgencyPathSegment } from '$lib/features/forms/persistence/agency';

	const isSuperAdmin = $derived(Boolean(page.data?.rbac?.isSuperAdmin));
	const allowedTransitSystems = $derived.by<string[]>(() => {
		const raw = page.data?.rbac?.allowedTransitSystems;
		return Array.isArray(raw) ? raw : [];
	});
	const transitSystemOptions = $derived.by<string[]>(() => {
		if (allowedTransitSystems.length === 0) return TRANSIT_SYSTEM_NAMES;
		const allowed = new Set(allowedTransitSystems.map((s) => s.trim().toUpperCase()));
		const filtered = TRANSIT_SYSTEM_NAMES.filter((name) => allowed.has(name.trim().toUpperCase()));
		return filtered.length > 0 ? filtered : TRANSIT_SYSTEM_NAMES;
	});
	let selectedAgency = $state(page.url.searchParams.get('agency') ?? '');
	const scopedAgency = $derived.by<string | null>(() => {
		const value = page.data?.rbac?.selectedAgency;
		return typeof value === 'string' && value.length > 0 ? value : null;
	});
	async function setAgency(value: string) {
		selectedAgency = value;
		const agency = value.trim();
		if (!agency) return;
		await goto(`/forms/${toAgencyPathSegment(agency)}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function continueToAgency() {
		const agency = (isSuperAdmin ? selectedAgency : (scopedAgency ?? '')).trim();
		if (!agency) return;
		void goto(`/forms/${toAgencyPathSegment(agency)}`);
	}
</script>

<div class="grid h-full w-full grid-cols-1 place-content-center gap-6 p-8">
	{#if isSuperAdmin}
		<div class="mx-auto w-full max-w-xl">
			<label for="transit-system" class="mb-2 block text-sm font-semibold text-[var(--text-muted)]"
				>Transit system</label
			>
			<select
				id="transit-system"
				class="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)]"
				value={selectedAgency}
				onchange={(e) => setAgency((e.currentTarget as HTMLSelectElement).value)}
			>
				<option value="">Select transit system...</option>
				{#each transitSystemOptions as system}
					<option value={system}>{system}</option>
				{/each}
			</select>
			<div class="mt-4 flex justify-end">
				<button
					type="button"
					class="rounded-md border border-[var(--theme-color)] bg-[var(--theme-color)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!selectedAgency.trim()}
					onclick={continueToAgency}
				>
					Continue
				</button>
			</div>
		</div>
	{:else}
		<div class="mx-auto w-full max-w-xl">
			<p class="mb-2 text-sm font-semibold text-[var(--text-muted)]">Transit system</p>
			<div
				class="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)]"
			>
				{scopedAgency ?? ''}
			</div>
			<div class="mt-4 flex justify-end">
				<button
					type="button"
					class="rounded-md border border-[var(--theme-color)] bg-[var(--theme-color)] px-4 py-2 text-sm font-semibold text-white"
					onclick={continueToAgency}
				>
					Continue
				</button>
			</div>
		</div>
	{/if}
</div>
