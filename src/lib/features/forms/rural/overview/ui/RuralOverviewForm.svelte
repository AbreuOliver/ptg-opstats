<script lang="ts">
import CollapsibleSection from '$lib/components/molecules/CollapsibleSection.svelte';
import Checkbox from '$lib/components/atoms/Checkbox.svelte';
import DirtyIndicator from '$lib/components/forms/DirtyIndicator.svelte';
import ModeDirtyIndicator from '$lib/components/forms/ModeDirtyIndicator.svelte';
import { setFormDraftSnapshot } from '$lib/features/forms/persistence/formDraftRegistry';
import { usePersistedOpen } from '$lib/stores/preferenceState.store.svelte';
import { RURAL_MODES } from '$lib/shared/rules/modes.rules';
import type { Capabilities, DaySlug } from '$lib/features/forms/shared/types/capabilities.types';

	let {
		value = $bindable(),
		readonly = false,
		snapshotKey = null,
		onChange
	}: {
		value: Capabilities;
		readonly?: boolean;
		snapshotKey?: string | null;
		onChange?: (next: Capabilities) => void;
	} = $props();

	const { open: sections } = usePersistedOpen({
		system: true,
		serviceArea: true,
		modes: true,
		hours: true,
		ptContractor: true,
		outOfService: true,
		coordination: true,
		fares: true,
		advanceReservation: true
	});

	const inputClass =
		'rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--theme-color)] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400';
	const labelClass = 'self-center pr-8 text-right text-sm font-medium text-[var(--text)] dark:text-zinc-300';
	const routeTypeOptions = [
		{ value: 'fixed_route', label: 'Fixed Route' },
		{ value: 'deviated_fixed_route', label: 'Deviated Fixed Route' },
		{ value: 'both', label: 'Both' }
	] as const;
	let mbRouteTypes = $state<Record<'mb_do' | 'mb_pt', (typeof routeTypeOptions)[number]['value']>>({
		mb_do: 'both',
		mb_pt: 'both'
	});

	function notifyChange() {
		if (snapshotKey) setFormDraftSnapshot(snapshotKey, value);
		onChange?.(value);
	}

	function defaultRural(): NonNullable<Capabilities['rural']> {
		return {
			serviceArea: { multiCounty: false, counties: '' },
			ptContractor: { name: '', contractStart: '', contractEnd: '' },
			outOfServiceArea: { enabled: false, destinations: '' },
			coordination: { enabled: false, systems: '' },
			fares: { demandResponse: '', fixedRoute: '', microtransit: '' },
			advanceReservation: { hours: '', explanation: '' }
		};
	}

	function ensureRural(): NonNullable<Capabilities['rural']> {
		const rural = value.rural ?? defaultRural();
		rural.fares ??= { demandResponse: '', fixedRoute: '', microtransit: '' };
		rural.advanceReservation ??= { hours: '', explanation: '' };
		return rural;
	}

	$effect(() => {
		if (!value.rural || !value.rural.fares || !value.rural.advanceReservation) {
			const next = {
				...value,
				rural: {
					...defaultRural(),
					...(value.rural ?? {}),
					fares: value.rural?.fares ?? { demandResponse: '', fixedRoute: '', microtransit: '' },
					advanceReservation: value.rural?.advanceReservation ?? { hours: '', explanation: '' }
				}
			};
			value = next;
			onChange?.(next);
		}
	});

	function updateRural(nextRural: NonNullable<Capabilities['rural']>) {
		const next = { ...value, rural: nextRural };
		value = next;
		if (snapshotKey) setFormDraftSnapshot(snapshotKey, next);
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

	function updateFares(patch: Partial<NonNullable<NonNullable<Capabilities['rural']>['fares']>>) {
		const rural = ensureRural();
		updateRural({ ...rural, fares: { ...rural.fares!, ...patch } });
	}

	function updateAdvanceReservation(
		patch: Partial<NonNullable<NonNullable<Capabilities['rural']>['advanceReservation']>>
	) {
		const rural = ensureRural();
		updateRural({
			...rural,
			advanceReservation: { ...rural.advanceReservation!, ...patch }
		});
	}

	function setMode(id: string, checked: boolean) {
		const nextSelected = new Set(value.selectedModes ?? []);
		if (checked) nextSelected.add(id);
		else nextSelected.delete(id);
		const next = { ...value, selectedModes: Array.from(nextSelected) };
		value = next;
		if (snapshotKey) setFormDraftSnapshot(snapshotKey, next);
		onChange?.(next);
	}

	function setDay(day: DaySlug, field: 'start' | 'end', nextValue: string) {
		value.days[day][field] = nextValue;
		if (snapshotKey) setFormDraftSnapshot(snapshotKey, value);
		notifyChange();
	}

	function setDayOffered(day: 'saturday' | 'sunday', offered: boolean) {
		value.days[day].offered = offered;
		if (!offered) {
			value.days[day].start = '';
			value.days[day].end = '';
			value.days[day].peakRoutes = 0;
		}
		if (snapshotKey) setFormDraftSnapshot(snapshotKey, value);
		notifyChange();
	}
</script>

<form
	class="mx-auto mb-12 flex min-h-full w-full flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
	oninput={notifyChange}
	onchange={notifyChange}
>
	<fieldset disabled={readonly} class="contents">
		<CollapsibleSection title="System Information" bind:open={sections.system}>
			<div class="grid w-full grid-cols-4 items-center gap-y-3 px-4 pt-2 pb-5">
				<label for="ctpGranteeLegalName" class={labelClass}>
					CTP Grantee's Legal Name
				</label>
				<input
					id="ctpGranteeLegalName"
					bind:value={value.ctpGranteeLegalName}
					required
					type="text"
					readonly
					class="col-span-3 w-2/3 {inputClass} opacity-90"
					placeholder="Transit agency"
				/>

				<label for="contactFirstName" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Transit Contact Person
						<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['contactFirstName']} />
					</span>
				</label>
				<div class="col-span-3 grid grid-cols-3 gap-2">
					<input
						id="contactFirstName"
						bind:value={value.contactFirstName}
						required
						type="text"
						placeholder="First name"
						class="w-full {inputClass}"
					/>
					<input
						id="contactMiddleInitial"
						bind:value={value.contactMiddleInitial}
						type="text"
						placeholder="Middle initial"
						class="w-full {inputClass}"
					/>
					<input
						id="contactLastName"
						bind:value={value.contactLastName}
						required
						type="text"
						placeholder="Last name"
						class="w-full {inputClass}"
					/>
				</div>

				<label for="email" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Contact Email
						<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['email']} />
					</span>
				</label>
				<input
					id="email"
					bind:value={value.email}
					required
					type="email"
					class="col-span-3 w-2/3 {inputClass}"
					placeholder="manager@transit.co"
				/>

				<label for="website" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Transit Website Address
						<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['website']} />
					</span>
				</label>
				<input
					id="website"
					bind:value={value.website}
					type="url"
					class="col-span-3 w-2/3 {inputClass}"
					placeholder="https://"
				/>

				<label for="phone" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Transit Telephone Number
						<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['phone']} />
					</span>
				</label>
				<input
					id="phone"
					bind:value={value.phone}
					required
					type="tel"
					class="col-span-3 w-1/3 {inputClass}"
					placeholder="Phone"
				/>
			</div>
		</CollapsibleSection>

		<CollapsibleSection title="Service Area" bind:open={sections.serviceArea}>
			<div class="grid w-full grid-cols-4 items-center gap-y-3 py-4 pr-4">
				<label for="serviceAreaType" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Select service area
						<DirtyIndicator
							snapshotKey={snapshotKey ?? ''}
							path={['rural', 'serviceArea', 'multiCounty']}
						/>
					</span>
				</label>
				<select
					id="serviceAreaType"
					class="col-span-3 w-1/3 {inputClass}"
					value={ensureRural().serviceArea.multiCounty ? 'multi' : 'single'}
					onchange={(e) =>
						updateServiceArea({
							multiCounty: (e.currentTarget as HTMLSelectElement).value === 'multi'
						})}
				>
					<option value="single">Single County</option>
					<option value="multi">Multi-County</option>
				</select>

				<label for="serviceAreaCounties" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						List counties in system
						<DirtyIndicator
							snapshotKey={snapshotKey ?? ''}
							path={['rural', 'serviceArea', 'counties']}
						/>
					</span>
				</label>
				<input
					id="serviceAreaCounties"
					type="text"
					value={ensureRural().serviceArea.counties}
					oninput={(e) =>
						updateServiceArea({ counties: (e.currentTarget as HTMLInputElement).value })}
					class="col-span-3 w-2/3 {inputClass}"
					placeholder="Enter counties"
				/>
			</div>
		</CollapsibleSection>

		<CollapsibleSection title="Operating Modes" bind:open={sections.modes}>
			<div class="grid w-full grid-cols-5 gap-y-3 py-4 pr-4">
				{#each RURAL_MODES as { id, label }}
					{@const showRouteType = (id === 'mb_do' || id === 'mb_pt') && value.selectedModes?.includes(id)}
					<div
						class={`col-span-3 col-start-2 ${
							id === 'mb_do' || id === 'mb_pt'
								? 'grid grid-cols-[minmax(0,1fr)_12rem] items-center gap-4'
								: 'flex items-center gap-2'
						}`}
					>
						<div class="flex items-center gap-2">
							<Checkbox
								label={label}
								checked={value.selectedModes?.includes(id)}
								onchange={(e) => setMode(id, (e.currentTarget as HTMLInputElement).checked)}
							/>
							<ModeDirtyIndicator snapshotKey={snapshotKey ?? ''} modeId={id} />
						</div>
						{#if showRouteType}
							<select
								class="w-full {inputClass}"
								value={mbRouteTypes[id]}
								onchange={(e) =>
									(mbRouteTypes[id] = (e.currentTarget as HTMLSelectElement).value as
										| 'fixed_route'
										| 'deviated_fixed_route'
										| 'both')}
							>
								{#each routeTypeOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						{/if}
					</div>
				{/each}
			</div>
		</CollapsibleSection>

		<CollapsibleSection title="Operating Hours" bind:open={sections.hours}>
			<div class="grid w-full grid-cols-4 items-start gap-y-6 py-4 pr-4">
				<div class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Weekday
						<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['days', 'weekday', 'start']} />
					</span>
				</div>
				<div class="col-span-2 grid grid-cols-1 gap-4">
					<div class="flex flex-col">
						<label for="ruralWeekdayStart" class="mb-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
							Begin Time
							<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['days', 'weekday', 'start']} />
						</label>
						<input
							id="ruralWeekdayStart"
							type="text"
							value={value.days.weekday.start}
							placeholder="hh:mm AM/PM"
							class={inputClass}
							oninput={(e) =>
								setDay('weekday', 'start', (e.currentTarget as HTMLInputElement).value)}
						/>
					</div>
					<div class="flex flex-col">
						<label for="ruralWeekdayEnd" class="mb-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
							End Time
							<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['days', 'weekday', 'end']} />
						</label>
						<input
							id="ruralWeekdayEnd"
							type="text"
							value={value.days.weekday.end}
							placeholder="hh:mm AM/PM"
							class={inputClass}
							oninput={(e) => setDay('weekday', 'end', (e.currentTarget as HTMLInputElement).value)}
						/>
					</div>
				</div>

				<div class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Saturday
						<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['days', 'saturday', 'offered']} />
					</span>
				</div>
				<div class="col-span-3 space-y-3">
					<div class="flex items-center gap-2">
						<Checkbox
							label="Offers Saturday Service"
							checked={value.days.saturday.offered}
							onchange={(e) =>
								setDayOffered('saturday', (e.currentTarget as HTMLInputElement).checked)}
						/>
						<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['days', 'saturday', 'offered']} />
					</div>
					{#if value.days.saturday.offered}
						<div class="grid grid-cols-2 gap-4">
							<div class="flex flex-col">
								<label for="ruralSaturdayStart" class="mb-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
									Begin Time
									<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['days', 'saturday', 'start']} />
								</label>
								<input
									id="ruralSaturdayStart"
									type="text"
									value={value.days.saturday.start}
									placeholder="hh:mm AM/PM"
									class={inputClass}
									oninput={(e) =>
										setDay('saturday', 'start', (e.currentTarget as HTMLInputElement).value)}
								/>
							</div>
							<div class="flex flex-col">
								<label for="ruralSaturdayEnd" class="mb-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
									End Time
									<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['days', 'saturday', 'end']} />
								</label>
								<input
									id="ruralSaturdayEnd"
									type="text"
									value={value.days.saturday.end}
									placeholder="hh:mm AM/PM"
									class={inputClass}
									oninput={(e) =>
										setDay('saturday', 'end', (e.currentTarget as HTMLInputElement).value)}
								/>
							</div>
						</div>
					{/if}
				</div>

				<div class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Sunday
						<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['days', 'sunday', 'offered']} />
					</span>
				</div>
				<div class="col-span-3 space-y-3">
					<div class="flex items-center gap-2">
						<Checkbox
							label="Offers Sunday Service"
							checked={value.days.sunday.offered}
							onchange={(e) => setDayOffered('sunday', (e.currentTarget as HTMLInputElement).checked)}
						/>
						<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['days', 'sunday', 'offered']} />
					</div>
					{#if value.days.sunday.offered}
						<div class="grid grid-cols-2 gap-4">
							<div class="flex flex-col">
								<label for="ruralSundayStart" class="mb-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
									Begin Time
									<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['days', 'sunday', 'start']} />
								</label>
								<input
									id="ruralSundayStart"
									type="text"
									value={value.days.sunday.start}
									placeholder="hh:mm AM/PM"
									class={inputClass}
									oninput={(e) =>
										setDay('sunday', 'start', (e.currentTarget as HTMLInputElement).value)}
								/>
							</div>
							<div class="flex flex-col">
								<label for="ruralSundayEnd" class="mb-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
									End Time
									<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['days', 'sunday', 'end']} />
								</label>
								<input
									id="ruralSundayEnd"
									type="text"
									value={value.days.sunday.end}
									placeholder="hh:mm AM/PM"
									class={inputClass}
									oninput={(e) =>
										setDay('sunday', 'end', (e.currentTarget as HTMLInputElement).value)}
								/>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</CollapsibleSection>

		<CollapsibleSection
			title="Management/Operations Contractor (For PT Mode Only)"
			bind:open={sections.ptContractor}
		>
			<div class="grid w-full grid-cols-4 items-center gap-y-3 py-4 pr-4">
				<label for="ptContractorName" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Contractor Name
						<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['rural', 'ptContractor', 'name']} />
					</span>
				</label>
				<input
					id="ptContractorName"
					type="text"
					value={ensureRural().ptContractor.name}
					oninput={(e) => updatePtContractor({ name: (e.currentTarget as HTMLInputElement).value })}
					class="col-span-3 w-2/3 {inputClass}"
					placeholder="Contractor name"
				/>

				<label for="ptContractStart" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Contract Start Date
						<DirtyIndicator
							snapshotKey={snapshotKey ?? ''}
							path={['rural', 'ptContractor', 'contractStart']}
						/>
					</span>
				</label>
				<input
					id="ptContractStart"
					type="date"
					value={ensureRural().ptContractor.contractStart}
					oninput={(e) =>
						updatePtContractor({ contractStart: (e.currentTarget as HTMLInputElement).value })}
					class="col-span-3 w-1/3 {inputClass}"
				/>

				<label for="ptContractEnd" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Contract End Date
						<DirtyIndicator
							snapshotKey={snapshotKey ?? ''}
							path={['rural', 'ptContractor', 'contractEnd']}
						/>
					</span>
				</label>
				<input
					id="ptContractEnd"
					type="date"
					value={ensureRural().ptContractor.contractEnd}
					oninput={(e) =>
						updatePtContractor({ contractEnd: (e.currentTarget as HTMLInputElement).value })}
					class="col-span-3 w-1/3 {inputClass}"
				/>
			</div>
		</CollapsibleSection>

		<CollapsibleSection title="Out of Service Area Operations" bind:open={sections.outOfService}>
			<div class="grid w-full grid-cols-4 items-start gap-y-3 py-4 pr-4">
				<div class="col-span-1"></div>
				<div class="col-span-3">
					<div class="flex items-center gap-2">
						<Checkbox
							label="Provide trips to out of service area destinations"
							checked={ensureRural().outOfServiceArea.enabled}
							onchange={(e) =>
								updateOutOfService({ enabled: (e.currentTarget as HTMLInputElement).checked })}
						/>
						<DirtyIndicator
							snapshotKey={snapshotKey ?? ''}
							path={['rural', 'outOfServiceArea', 'enabled']}
						/>
					</div>
				</div>

				<label for="outOfServiceDestinations" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Destinations
						<DirtyIndicator
							snapshotKey={snapshotKey ?? ''}
							path={['rural', 'outOfServiceArea', 'destinations']}
						/>
					</span>
				</label>
				<textarea
					id="outOfServiceDestinations"
					rows={3}
					value={ensureRural().outOfServiceArea.destinations}
					oninput={(e) =>
						updateOutOfService({ destinations: (e.currentTarget as HTMLTextAreaElement).value })}
					class="col-span-3 w-2/3 {inputClass}"
					placeholder="List out of service area destinations"
				></textarea>
			</div>
		</CollapsibleSection>

		<CollapsibleSection title="Coordination" bind:open={sections.coordination}>
			<div class="grid w-full grid-cols-4 items-start gap-y-3 py-4 pr-4">
				<div class="col-span-1"></div>
				<div class="col-span-3">
					<div class="flex items-center gap-2">
						<Checkbox
							label="Coordinate with other Community Transportation systems"
							checked={ensureRural().coordination.enabled}
							onchange={(e) =>
								updateCoordination({ enabled: (e.currentTarget as HTMLInputElement).checked })}
						/>
						<DirtyIndicator
							snapshotKey={snapshotKey ?? ''}
							path={['rural', 'coordination', 'enabled']}
						/>
					</div>
				</div>

				<label for="coordinationSystems" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Systems
						<DirtyIndicator
							snapshotKey={snapshotKey ?? ''}
							path={['rural', 'coordination', 'systems']}
						/>
					</span>
				</label>
				<textarea
					id="coordinationSystems"
					rows={3}
					value={ensureRural().coordination.systems}
					oninput={(e) =>
						updateCoordination({ systems: (e.currentTarget as HTMLTextAreaElement).value })}
					class="col-span-3 w-2/3 {inputClass}"
					placeholder="List Community Transportation systems"
				></textarea>
			</div>
		</CollapsibleSection>

		<CollapsibleSection title="Fares" bind:open={sections.fares}>
			<div class="grid w-full grid-cols-4 items-center gap-y-3 py-4 pr-4">
				<label for="fareDemandResponse" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Demand Response
						<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['rural', 'fares', 'demandResponse']} />
					</span>
				</label>
				<input
					id="fareDemandResponse"
					type="text"
					value={ensureRural().fares?.demandResponse ?? ''}
					oninput={(e) => updateFares({ demandResponse: (e.currentTarget as HTMLInputElement).value })}
					class="col-span-3 w-1/3 {inputClass}"
				/>

				<label for="fareFixedRoute" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Fixed Route
						<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['rural', 'fares', 'fixedRoute']} />
					</span>
				</label>
				<input
					id="fareFixedRoute"
					type="text"
					value={ensureRural().fares?.fixedRoute ?? ''}
					oninput={(e) => updateFares({ fixedRoute: (e.currentTarget as HTMLInputElement).value })}
					class="col-span-3 w-1/3 {inputClass}"
				/>

				<label for="fareMicrotransit" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Microtransit
						<DirtyIndicator snapshotKey={snapshotKey ?? ''} path={['rural', 'fares', 'microtransit']} />
					</span>
				</label>
				<input
					id="fareMicrotransit"
					type="text"
					value={ensureRural().fares?.microtransit ?? ''}
					oninput={(e) => updateFares({ microtransit: (e.currentTarget as HTMLInputElement).value })}
					class="col-span-3 w-1/3 {inputClass}"
				/>
			</div>
		</CollapsibleSection>

		<CollapsibleSection
			title="Minimum Advanced Reservation Time (Hours)"
			bind:open={sections.advanceReservation}
		>
			<div class="grid w-full grid-cols-4 items-start gap-y-3 py-4 pr-4 pb-4">
				<label for="advanceReservationHours" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Time
						<DirtyIndicator
							snapshotKey={snapshotKey ?? ''}
							path={['rural', 'advanceReservation', 'hours']}
						/>
					</span>
				</label>
				<input
					id="advanceReservationHours"
					type="text"
					value={ensureRural().advanceReservation?.hours ?? ''}
					oninput={(e) =>
						updateAdvanceReservation({ hours: (e.currentTarget as HTMLInputElement).value })}
					class="col-span-3 w-1/3 {inputClass}"
				/>

				<label for="advanceReservationExplanation" class={labelClass}>
					<span class="inline-flex items-center gap-2">
						Explanation
						<DirtyIndicator
							snapshotKey={snapshotKey ?? ''}
							path={['rural', 'advanceReservation', 'explanation']}
						/>
					</span>
				</label>
				<textarea
					id="advanceReservationExplanation"
					rows={3}
					value={ensureRural().advanceReservation?.explanation ?? ''}
					oninput={(e) =>
						updateAdvanceReservation({
							explanation: (e.currentTarget as HTMLTextAreaElement).value
						})}
					class="col-span-3 w-2/3 {inputClass}"
				></textarea>
			</div>
		</CollapsibleSection>
	</fieldset>
</form>
