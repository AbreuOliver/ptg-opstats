<script lang="ts">
	import { Popover } from '@skeletonlabs/skeleton-svelte';
	import CollapsibleSection from '$lib/components/molecules/CollapsibleSection.svelte';
	import OperatingHours from '$lib/components/sections/OperatingHours.svelte';
	import Checkbox from '$lib/components/atoms/Checkbox.svelte';
	import { usePersistedOpen } from '$lib/stores/preferenceState.store.svelte';
	import { RURAL_MODES } from '$lib/shared/rules/modes.rules';
	import type { Capabilities } from '$lib/features/forms/shared/types/capabilities.types';

	let {
		value = $bindable(),
		onChange
	}: {
		value: Capabilities;
		onChange?: (next: Capabilities) => void;
	} = $props();

	const openStates = $state<Record<string, boolean>>({});
	for (const mode of RURAL_MODES) openStates[mode.id] = false;

	function closePopover(id: string) {
		openStates[id] = false;
	}

	const { open: sections } = usePersistedOpen({
		system: true,
		modes: false,
		hours: false,
		serviceArea: false,
		ptContractor: false,
		outOfService: false,
		coordination: false,
		contractor: false
	});

	function notifyChange() {
		onChange?.(value);
	}

	function ensureRural() {
		return value.rural!;
	}

	$effect(() => {
		if (!value.rural) {
			const nextRural = {
				serviceArea: { multiCounty: false, counties: '' },
				ptContractor: { name: '', contractStart: '', contractEnd: '' },
				outOfServiceArea: { enabled: false, destinations: '' },
				coordination: { enabled: false, systems: '' }
			};

			const next = { ...value, rural: nextRural };
			value = next;
			onChange?.(next);
		}
	});

	function updateRural(nextRural: Capabilities['rural']) {
		const next = { ...value, rural: nextRural };
		value = next;
		onChange?.(next);
	}

	function updateServiceArea(patch: Partial<NonNullable<Capabilities['rural']>['serviceArea']>) {
		const rural = ensureRural();
		updateRural({ ...rural, serviceArea: { ...rural.serviceArea, ...patch } });
	}

	function updatePtContractor(patch: Partial<NonNullable<Capabilities['rural']>['ptContractor']>) {
		const rural = ensureRural();
		updateRural({ ...rural, ptContractor: { ...rural.ptContractor, ...patch } });
	}

	function updateOutOfService(
		patch: Partial<NonNullable<Capabilities['rural']>['outOfServiceArea']>
	) {
		const rural = ensureRural();
		updateRural({ ...rural, outOfServiceArea: { ...rural.outOfServiceArea, ...patch } });
	}

	function updateCoordination(patch: Partial<NonNullable<Capabilities['rural']>['coordination']>) {
		const rural = ensureRural();
		updateRural({ ...rural, coordination: { ...rural.coordination, ...patch } });
	}

	const hasPtMode = $derived((value.selectedModes ?? []).some((id) => id.endsWith('_pt')));
</script>

<form
	class="mx-auto mb-12 flex min-h-full w-full flex-col rounded-lg bg-zinc-300 shadow-none dark:bg-zinc-900"
	oninput={notifyChange}
	onchange={notifyChange}
>
	<CollapsibleSection title="System Information" bind:open={sections.system}>
		<div class="px-4 pt-2 pb-5">
			<div class="grid w-full grid-cols-4 items-center gap-y-3 pr-4 pb-4">
				<label
					for="ctpGranteeLegalName"
					class="text-md col-span-1 self-center pr-8 text-right text-xl font-medium text-zinc-700 dark:text-zinc-300"
				>
					CTP Grantee's Legal Name
				</label>
				<input
					id="ctpGranteeLegalName"
					bind:value={value.ctpGranteeLegalName}
					required
					type="text"
					class="col-span-3 w-2/3 rounded-xl border-2 border-zinc-300 bg-zinc-700
                    px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600 focus:outline-none dark:border-zinc-700"
					placeholder="Jenny Slate"
				/>

				<label
					for="contactName"
					class="col-span-1 self-center pr-8 text-right text-xl font-medium text-zinc-700 dark:text-zinc-300"
				>
					Contact Name
				</label>
				<div class="col-span-3 grid grid-cols-3 gap-2">
					<input
						id="contactFirstName"
						bind:value={value.contactFirstName}
						required
						type="text"
						placeholder="First"
						class="w-full rounded-xl border-2 border-zinc-300 bg-zinc-700 px-3 py-2 focus:border-transparent
                      focus:ring-2 focus:ring-red-600 focus:outline-none dark:border-zinc-700"
					/>
					<input
						id="contactMiddleInitial"
						bind:value={value.contactMiddleInitial}
						type="text"
						placeholder="Middle"
						class="w-full rounded-xl border-2 border-zinc-300 bg-zinc-700 px-3 py-2 focus:border-transparent
                      focus:ring-2 focus:ring-red-600 focus:outline-none dark:border-zinc-700"
					/>
					<input
						id="contactLastName"
						bind:value={value.contactLastName}
						required
						type="text"
						placeholder="Last"
						class="w-full rounded-xl border-2 border-zinc-300 bg-zinc-700 px-3 py-2 focus:border-transparent
                      focus:ring-2 focus:ring-red-600 focus:outline-none dark:border-zinc-700"
					/>
				</div>

				<label
					for="email"
					class="col-span-1 self-center pr-8 text-right text-xl font-medium text-zinc-700 dark:text-zinc-300"
				>
					Email
				</label>
				<input
					id="email"
					bind:value={value.email}
					required
					type="email"
					class="col-span-3 w-2/3 rounded-xl border-2 border-zinc-300 bg-zinc-700
                    px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600 focus:outline-none dark:border-zinc-700"
					placeholder="manager@transit.co"
				/>

				<label
					for="phone"
					class="col-span-1 self-center pr-8 text-right text-xl font-medium text-zinc-700 dark:text-zinc-300"
				>
					Phone
				</label>
				<input
					id="phone"
					bind:value={value.phone}
					required
					type="tel"
					class="col-span-3 w-1/3 rounded-xl border-2 border-zinc-300 bg-zinc-700
                    px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600 focus:outline-none dark:border-zinc-700"
				/>

				<label
					for="fax"
					class="col-span-1 self-center pr-8 text-right text-xl font-medium text-zinc-700 dark:text-zinc-300"
				>
					Fax
				</label>
				<input
					id="fax"
					bind:value={value.fax}
					type="tel"
					class="col-span-3 w-1/3 rounded-xl border-2 border-zinc-300 bg-zinc-700
                    px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600 focus:outline-none dark:border-zinc-700"
				/>

				<label
					for="date"
					class="col-span-1 self-center pr-8 text-right text-xl font-medium text-zinc-700 dark:text-zinc-300"
				>
					Date
				</label>
				<input
					id="date"
					bind:value={value.date}
					required
					type="date"
					class="col-span-3 w-1/3 rounded-xl border-2 border-zinc-300 bg-zinc-700
                    px-3 py-2 placeholder-zinc-500 focus:border-transparent focus:ring-2
                    focus:ring-red-600 focus:outline-none dark:border-zinc-700"
				/>
			</div>
		</div>
	</CollapsibleSection>

	<CollapsibleSection title="Operating Modes" bind:open={sections.modes}>
		<div class="grid w-full grid-cols-4 gap-y-3 py-4 pr-4">
			{#each RURAL_MODES as { id, label }}
				<div class="col-span-3 col-start-2 flex items-center gap-2">
					<label
						for={`mode-${id}`}
						class="relative flex cursor-pointer items-center gap-2 select-none"
					>
						<input
							id={`mode-${id}`}
							type="checkbox"
							checked={value.selectedModes?.includes(id)}
							onchange={(e) => {
								const checked = (e.currentTarget as HTMLInputElement).checked;

								const nextSelected = new Set(value.selectedModes ?? []);
								if (checked) nextSelected.add(id);
								else nextSelected.delete(id);

								const next = {
									...value,
									selectedModes: Array.from(nextSelected)
								};

								value = next;
								onChange?.(next);
							}}
							class="peer h-6 w-6 appearance-none rounded-md border-2 border-zinc-300 bg-white checked:border-transparent checked:bg-red-600 focus:ring-2 focus:ring-red-600 focus:outline-none"
						/>

						<svg
							class="pointer-events-none absolute left-1 h-4 w-4 fill-white opacity-0 peer-checked:opacity-100"
							viewBox="0 0 512 512"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M17.47 250.9C88.82 328.1 158 397.6 224.5 485.5c72.3-143.8 146.3-288.1 268.4-444.37L460 26.06C356.9 135.4 276.8 238.9 207.2 361.9c-48.4-43.6-126.62-105.3-174.38-137z"
							/>
						</svg>
						<span class="px-2 text-xl">{label}</span>
					</label>

					<Popover
						open={openStates[id]}
						onOpenChange={(e) => (openStates[id] = e.open)}
						positioning={{ placement: 'right' }}
						triggerBase="btn btn-sm preset-tonal"
						contentBase="card bg-surface-200-800 p-4 space-y-4 max-w-[320px] z-50 border-2 rounded-xl border-neutral-200"
						arrow
						arrowBackground="bg-surface-200 dark:!bg-surface-800"
					>
						{#snippet trigger()}
							<button
								type="button"
								class="my-auto flex h-8 w-8 cursor-auto items-center justify-center text-zinc-700"
								aria-label="Show description"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-5 w-5">
									<g fill="none">
										<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
										<path
											stroke="currentColor"
											stroke-linecap="round"
											stroke-width="1.5"
											d="M10.125 8.875a1.875 1.875 0 1 1 2.828 1.615c-.475.281-.953.708-.953 1.26V13"
										/>
										<circle cx="12" cy="16" r="1" fill="currentColor" />
									</g>
								</svg>
							</button>
						{/snippet}

						{#snippet content()}
							<header class="flex items-center justify-between">
								<p class="text-lg font-semibold">{label}</p>
								<button
									type="button"
									class="btn btn-sm btn-ghost"
									onclick={() => closePopover(id)}
									aria-label="Close"
								>
									×
								</button>
							</header>
							<p class="opacity-70">{label}</p>
						{/snippet}
					</Popover>
				</div>
			{/each}
		</div>
	</CollapsibleSection>

	<OperatingHours bind:open={sections.hours} days={value.days} />

	<CollapsibleSection title="Service Area" bind:open={sections.serviceArea}>
		<div class="grid w-full grid-cols-4 items-center gap-y-3 py-4 pr-4">
			<div class="col-span-1"></div>
			<div class="col-span-3 flex items-center gap-3">
				<Checkbox
					label="Multi-County Service Area"
					checked={ensureRural().serviceArea.multiCounty}
					on:change={(e) =>
						updateServiceArea({ multiCounty: (e.currentTarget as HTMLInputElement).checked })}
				/>
			</div>
			<label
				for="serviceAreaCounties"
				class="col-span-1 self-center pr-8 text-right text-xl font-medium text-zinc-700 dark:text-zinc-300"
			>
				Counties
			</label>
			<input
				id="serviceAreaCounties"
				type="text"
				value={ensureRural().serviceArea.counties}
				oninput={(e) =>
					updateServiceArea({ counties: (e.currentTarget as HTMLInputElement).value })}
				class="col-span-3 w-2/3 rounded-xl border-2 border-zinc-300 bg-zinc-700
                    px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600 focus:outline-none dark:border-zinc-700"
				placeholder="Enter counties"
			/>
		</div>
	</CollapsibleSection>

	{#if hasPtMode}
		<CollapsibleSection
			title="Management/Operations Contractor (For PT Mode Only)"
			bind:open={sections.ptContractor}
		>
			<div class="grid w-full grid-cols-4 items-center gap-y-3 py-4 pr-4">
				<label
					for="ptContractorName"
					class="col-span-1 self-center pr-8 text-right text-xl font-medium text-zinc-700 dark:text-zinc-300"
				>
					Contractor Name
				</label>
				<input
					id="ptContractorName"
					type="text"
					value={ensureRural().ptContractor.name}
					oninput={(e) => updatePtContractor({ name: (e.currentTarget as HTMLInputElement).value })}
					class="col-span-3 w-2/3 rounded-xl border-2 border-zinc-300 bg-zinc-700
                    px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600 focus:outline-none dark:border-zinc-700"
					placeholder="Contractor name"
				/>

				<label
					for="ptContractStart"
					class="col-span-1 self-center pr-8 text-right text-xl font-medium text-zinc-700 dark:text-zinc-300"
				>
					Contract Start
				</label>
				<input
					id="ptContractStart"
					type="date"
					value={ensureRural().ptContractor.contractStart}
					oninput={(e) =>
						updatePtContractor({ contractStart: (e.currentTarget as HTMLInputElement).value })}
					class="col-span-3 w-1/3 rounded-xl border-2 border-zinc-300 bg-zinc-700
                    px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600 focus:outline-none dark:border-zinc-700"
				/>

				<label
					for="ptContractEnd"
					class="col-span-1 self-center pr-8 text-right text-xl font-medium text-zinc-700 dark:text-zinc-300"
				>
					Contract End
				</label>
				<input
					id="ptContractEnd"
					type="date"
					value={ensureRural().ptContractor.contractEnd}
					oninput={(e) =>
						updatePtContractor({ contractEnd: (e.currentTarget as HTMLInputElement).value })}
					class="col-span-3 w-1/3 rounded-xl border-2 border-zinc-300 bg-zinc-700
                    px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600 focus:outline-none dark:border-zinc-700"
				/>
			</div>
		</CollapsibleSection>
	{/if}

	<CollapsibleSection title="Out of Service Area Operations" bind:open={sections.outOfService}>
		<div class="grid w-full grid-cols-4 items-start gap-y-3 py-4 pr-4">
			<div class="col-span-1" />
			<div class="col-span-3 flex items-center gap-3">
				<Checkbox
					label="Yes"
					checked={ensureRural().outOfServiceArea.enabled}
					on:change={(e) =>
						updateOutOfService({ enabled: (e.currentTarget as HTMLInputElement).checked })}
				/>
			</div>
			<label
				for="outOfServiceDestinations"
				class="col-span-1 self-center pr-8 text-right text-xl font-medium text-zinc-700 dark:text-zinc-300"
			>
				Destinations
			</label>
			<textarea
				id="outOfServiceDestinations"
				rows={3}
				value={ensureRural().outOfServiceArea.destinations}
				oninput={(e) =>
					updateOutOfService({ destinations: (e.currentTarget as HTMLTextAreaElement).value })}
				class="col-span-3 w-2/3 rounded-xl border-2 border-zinc-300 bg-zinc-700
                    px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600 focus:outline-none dark:border-zinc-700"
				placeholder="Enter destinations"
			></textarea>
		</div>
	</CollapsibleSection>

	<CollapsibleSection title="Coordination" bind:open={sections.coordination}>
		<div class="grid w-full grid-cols-4 items-start gap-y-3 py-4 pr-4">
			<div class="col-span-1" />
			<div class="col-span-3 flex items-center gap-3">
				<Checkbox
					label="Yes"
					checked={ensureRural().coordination.enabled}
					on:change={(e) =>
						updateCoordination({ enabled: (e.currentTarget as HTMLInputElement).checked })}
				/>
			</div>
			<label
				for="coordinationSystems"
				class="col-span-1 self-center pr-8 text-right text-xl font-medium text-zinc-700 dark:text-zinc-300"
			>
				Systems
			</label>
			<textarea
				id="coordinationSystems"
				rows={3}
				value={ensureRural().coordination.systems}
				oninput={(e) =>
					updateCoordination({ systems: (e.currentTarget as HTMLTextAreaElement).value })}
				class="col-span-3 w-2/3 rounded-xl border-2 border-zinc-300 bg-zinc-700
                    px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600 focus:outline-none dark:border-zinc-700"
				placeholder="Describe coordination systems"
			></textarea>
		</div>
	</CollapsibleSection>

	<CollapsibleSection title="Contractor Information" bind:open={sections.contractor}>
		<div class="grid w-full grid-cols-4 items-center gap-y-3 py-4 pr-4 pb-4">
			<label
				for="contractor"
				class="col-span-1 self-center pr-8 text-right text-xl font-medium text-zinc-700 dark:text-zinc-300"
			>
				Contractor Name
			</label>
			<input
				id="contractor"
				bind:value={value.contractor}
				required
				type="text"
				class="col-span-3 w-2/3 rounded-xl border-2 border-zinc-300 bg-zinc-700 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-600 focus:outline-none dark:border-zinc-700"
				placeholder="Contractor name"
			/>
		</div>
	</CollapsibleSection>
</form>
