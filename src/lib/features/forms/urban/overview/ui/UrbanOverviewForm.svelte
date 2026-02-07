<script lang="ts">
	import { Popover } from '@skeletonlabs/skeleton-svelte';
	import CollapsibleSection from '$lib/components/molecules/CollapsibleSection.svelte';
	import OperatingHours from '$lib/components/sections/OperatingHours.svelte';
	import { usePersistedOpen } from '$lib/stores/preferenceState.store.svelte';
	import type { Capabilities } from '$lib/features/forms/shared/types/capabilities.types';

	let {
		value = $bindable(),
		onChange
	}: {
		value: Capabilities;
		onChange?: (next: Capabilities) => void;
	} = $props();

	import { URBAN_MODES } from '$lib/shared/rules/modes.rules';

	const openStates = $state<Record<string, boolean>>({});
	for (const mode of URBAN_MODES) openStates[mode.id] = false;

	function closePopover(id: string) {
		openStates[id] = false;
	}

	const { open: sections } = usePersistedOpen({
		system: true,
		modes: false,
		hours: false,
		contractor: false
	});

	function notifyChange() {
		onChange?.(value);
	}

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
			{#each URBAN_MODES as { id, label }}
				<div class="col-span-3 col-start-2 flex items-center gap-2">
					<!-- <label class="relative flex cursor-pointer items-center gap-2 select-none">
						<input
							type="checkbox"
							value={id}
							bind:group={value.selectedModes}
							class="peer h-6 w-6 appearance-none rounded-md border-2 border-zinc-300 bg-white checked:border-transparent checked:bg-red-600 focus:ring-2 focus:ring-red-600 focus:outline-none"
						/> -->
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

								// update local prop value if you're using $bindable
								value = next;

								// notify parent with a NEW reference
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
				placeholder="MV Transporation"
			/>
		</div>
	</CollapsibleSection>
</form>
