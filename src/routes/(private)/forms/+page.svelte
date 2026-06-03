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
	const initialAgency = page.url.searchParams.get('agency') ?? '';
	let selectedAgency = $state(initialAgency);
	let searchQuery = $state(initialAgency);
	let comboboxOpen = $state(false);
	let activeOptionIndex = $state(0);
	const scopedAgency = $derived.by<string | null>(() => {
		const value = page.data?.rbac?.selectedAgency;
		return typeof value === 'string' && value.length > 0 ? value : null;
	});

	const filteredTransitSystemOptions = $derived.by<string[]>(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return transitSystemOptions;
		return transitSystemOptions.filter((system) => system.toLowerCase().includes(query));
	});

	$effect(() => {
		if (activeOptionIndex >= filteredTransitSystemOptions.length) {
			activeOptionIndex = Math.max(filteredTransitSystemOptions.length - 1, 0);
		}
	});

	async function setAgency(value: string) {
		selectedAgency = value;
		searchQuery = value;
		comboboxOpen = false;
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

	function handleSearchInput(value: string) {
		searchQuery = value;
		comboboxOpen = true;
		activeOptionIndex = 0;
		const exactMatch = transitSystemOptions.find(
			(system) => system.trim().toLowerCase() === value.trim().toLowerCase()
		);
		selectedAgency = exactMatch ?? '';
	}

	function handleComboboxKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			comboboxOpen = true;
			if (filteredTransitSystemOptions.length > 0) {
				activeOptionIndex = Math.min(
					activeOptionIndex + 1,
					filteredTransitSystemOptions.length - 1
				);
			}
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			comboboxOpen = true;
			if (filteredTransitSystemOptions.length > 0) {
				activeOptionIndex = Math.max(activeOptionIndex - 1, 0);
			}
			return;
		}

		if (event.key === 'Enter') {
			event.preventDefault();
			const activeOption = filteredTransitSystemOptions[activeOptionIndex];
			if (activeOption) void setAgency(activeOption);
			return;
		}

		if (event.key === 'Escape') {
			comboboxOpen = false;
		}
	}
</script>

<div class="grid h-full w-full grid-cols-1 place-content-center gap-6 p-8">
	{#if isSuperAdmin}
		<div class="mx-auto w-full max-w-xl">
			<label for="transit-system" class="mb-2 block text-sm font-semibold text-[var(--text-muted)]"
				>Transit system</label
			>
			<div class="relative">
				<input
					id="transit-system"
					type="text"
					role="combobox"
					aria-autocomplete="list"
					aria-expanded={comboboxOpen}
					aria-controls="transit-system-options"
					aria-activedescendant={comboboxOpen && filteredTransitSystemOptions[activeOptionIndex]
						? `transit-system-option-${activeOptionIndex}`
						: undefined}
					autocomplete="off"
					spellcheck="false"
					placeholder="Type to search transit systems..."
					class="h-11 w-full rounded-md border border-[var(--border)] bg-white px-3 pr-11 text-sm text-[var(--text)] shadow-sm transition outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--theme-color)] focus:ring-2 focus:ring-[var(--theme-color)]/60"
					bind:value={searchQuery}
					oninput={(e) => handleSearchInput((e.currentTarget as HTMLInputElement).value)}
					onfocus={() => (comboboxOpen = true)}
					onblur={() => (comboboxOpen = false)}
					onkeydown={handleComboboxKeydown}
				/>
				<span
					class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--text-muted)]"
					aria-hidden="true"
				>
					<svg
						viewBox="0 0 20 20"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						class="h-4 w-4 transition-transform {comboboxOpen ? 'rotate-180' : ''}"
					>
						<path d="M5 7.5 10 12l5-4.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</span>
				{#if comboboxOpen}
					<div
						id="transit-system-options"
						role="listbox"
						class="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-md border border-[var(--border)] bg-white py-2 text-sm shadow-xl ring-1 ring-black/5"
					>
						{#if filteredTransitSystemOptions.length > 0}
							{#each filteredTransitSystemOptions as system, index}
								<button
									id={`transit-system-option-${index}`}
									type="button"
									role="option"
									aria-selected={system === selectedAgency}
									class="block w-full px-3 py-2.5 text-left text-[var(--text)] transition {index ===
									activeOptionIndex
										? 'bg-[var(--theme-color)] text-white'
										: 'hover:bg-[var(--surface-2)]'}"
									onmousedown={(event) => event.preventDefault()}
									onclick={() => void setAgency(system)}
								>
									{system}
								</button>
							{/each}
						{:else}
							<div class="px-3 py-2 text-[var(--text-muted)]">No transit systems found.</div>
						{/if}
					</div>
				{/if}
			</div>
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
