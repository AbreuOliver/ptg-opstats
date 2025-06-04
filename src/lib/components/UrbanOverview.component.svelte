<script lang="ts">
	import Text from './atoms/Text.svelte';
	import { Popover } from '@skeletonlabs/skeleton-svelte';

	type FormData = {
		ctpGranteeLegalName: string;
		contactFirstName: string;
		contactMiddleInitial: string;
		contactLastName: string;
		email: string;
		phone: string;
		fax?: string;
		date: string;
		selectedModes: string[];
		weekdayStart: string;
		weekdayEnd: string;
		weekdayPeakRoutes: number;
		saturdayStart?: string;
		saturdayEnd?: string;
		saturdayPeakRoutes?: number;
		sundayStart?: string;
		sundayEnd?: string;
		sundayPeakRoutes?: number;
		contractor?: string;
	};

	let formData: FormData = {
		ctpGranteeLegalName: '',
		contactFirstName: '',
		contactMiddleInitial: '',
		contactLastName: '',
		email: '',
		phone: '',
		fax: '',
		date: '',
		selectedModes: [],
		weekdayStart: '',
		weekdayEnd: '',
		weekdayPeakRoutes: 0,
		saturdayStart: '',
		saturdayEnd: '',
		saturdayPeakRoutes: 0,
		sundayStart: '',
		sundayEnd: '',
		sundayPeakRoutes: 0,
		contractor: ''
	};

	$effect(() => console.log(formData));

	const modes = [
		{
			id: 'fixed-route',
			label: 'Fixed Route',
			description: 'Operates on a fixed schedule and route.'
		},
		{
			id: 'dial-a-ride',
			label: 'Dial-A-Ride',
			description: 'Demand-responsive service with door-to-door scheduling.'
		},
		{
			id: 'light-rail',
			label: 'Light Rail',
			description: 'Rail service operating on a dedicated track.'
		},
		{
			id: 'street-car',
			label: 'Street Car',
			description: 'Urban rail service typically sharing the road.'
		},
		{
			id: 'vanpool',
			label: 'Vanpool',
			description: 'Shared commuting using a van for long-distance riders.'
		},
		{
			id: 'microtransit',
			label: 'Microtransit',
			description: 'Flexible, small-scale public transit with on-demand routing.'
		}
	];

	const openStates = $state<Record<string, boolean>>({});
	for (const mode of modes) openStates[mode.id] = false;

	function closePopover(id: string) {
		openStates[id] = false;
	}
</script>

<form
	class="mx-auto min-h-full w-full max-w-7xl min-w-[80vw] rounded-md border border-neutral-300 bg-white shadow-none"
>
	<!-- SECTION: SYSTEM INFORMATION -->
	<section class="flex w-full flex-col items-start">
		<Text
			variant="body"
			text="System Information"
			color="primary"
			className="font-semibold pl-4 py-2"
		/>
		<hr class="mb-8 w-full border-t border-neutral-300" />

		<div class="grid w-full grid-cols-4 items-center gap-y-3 pr-4 pb-4">
			<!-- CTP NAME -->
			<label
				for="ctpGranteeLegalName"
				class="col-span-1 self-center pr-2 text-right text-sm font-medium text-neutral-700"
			>
				CTP Grantee's Legal Name
			</label>
			<input
				id="ctpGranteeLegalName"
				bind:value={formData.ctpGranteeLegalName}
				required
				type="text"
				class="col-span-3 w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none"
				placeholder="Jenny Slate"
			/>

			<!-- CONTACT NAME -->
			<label
				for="contactName"
				class="col-span-1 self-center pr-2 text-right text-sm font-medium text-neutral-700"
			>
				Contact Name
			</label>
			<div class="col-span-3 grid grid-cols-3 gap-2">
				<input
					id="contactFirstName"
					bind:value={formData.contactFirstName}
					required
					type="text"
					placeholder="First"
					class="w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none"
				/>
				<input
					id="contactMiddleInitial"
					bind:value={formData.contactMiddleInitial}
					type="text"
					placeholder="Middle"
					class="w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none"
				/>
				<input
					id="contactLastName"
					bind:value={formData.contactLastName}
					required
					type="text"
					placeholder="Last"
					class="w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none"
				/>
			</div>

			<!-- EMAIL -->
			<label
				for="email"
				class="col-span-1 self-center pr-2 text-right text-sm font-medium text-neutral-700"
			>
				Email
			</label>
			<input
				id="email"
				bind:value={formData.email}
				required
				type="email"
				class="col-span-3 w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none"
				placeholder="manager@transit.co"
			/>

			<!-- PHONE -->
			<label
				for="phone"
				class="col-span-1 self-center pr-2 text-right text-sm font-medium text-neutral-700"
			>
				Phone
			</label>
			<input
				id="phone"
				bind:value={formData.phone}
				required
				type="tel"
				class="col-span-3 w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none"
			/>

			<!-- FAX -->
			<label
				for="fax"
				class="col-span-1 self-center pr-2 text-right text-sm font-medium text-neutral-700"
			>
				Fax
			</label>
			<input
				id="fax"
				bind:value={formData.fax}
				type="tel"
				class="col-span-3 w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none"
			/>

			<!-- DATE -->
			<label
				for="date"
				class="col-span-1 self-center pr-2 text-right text-sm font-medium text-neutral-700"
			>
				Date
			</label>
			<input
				id="date"
				bind:value={formData.date}
				required
				type="date"
				class="col-span-3 w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder-neutral-500"
			/>
			
		</div>
	</section>

	<!-- SECTION: OPERATING MODES -->
	<section class="flex w-full flex-col items-start">
		<hr class="mt-6 w-full border-t border-neutral-300" />
		<Text
			variant="body"
			text="Operating Modes"
			color="primary"
			className="font-semibold pl-4 py-2"
		/>
		<hr class="mb-4 w-full border-t border-neutral-300" />

		<div class="grid w-full grid-cols-4 gap-y-3 py-4 pr-4">
			{#each modes as { id, label, description }}
				<div class="col-span-3 col-start-2 flex items-center gap-2">
					<label class="relative flex cursor-pointer items-center gap-2 select-none">
						<input
							type="checkbox"
							
							class="peer h-6 w-6 appearance-none rounded-md border-2 border-neutral-300 bg-white checked:border-transparent checked:bg-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
						/>
						<svg
							class="pointer-events-none absolute left-0 h-6 w-6 fill-white opacity-0 peer-checked:opacity-100"
							viewBox="0 0 512 512"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M17.47 250.9C88.82 328.1 158 397.6 224.5 485.5c72.3-143.8 146.3-288.1 268.4-444.37L460 26.06C356.9 135.4 276.8 238.9 207.2 361.9c-48.4-43.6-126.62-105.3-174.38-137z"
							/>
						</svg>
						<span class="px-2">{label}</span>
					</label>

					<Popover
						open={openStates[id]}
						onOpenChange={(e) => (openStates[id] = e.open)}
						positioning={{ placement: 'top' }}
						triggerBase="btn btn-sm preset-tonal"
						contentBase="card bg-surface-200-800 p-4 space-y-4 max-w-[320px] z-50"
						arrow
						arrowBackground="!bg-surface-200 dark:!bg-surface-800"
					>
						{#snippet trigger()}
							<button
								type="button"
								class="my-auto flex h-8 w-8 cursor-auto items-center justify-center text-neutral-700"
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
							<p class="opacity-70">{description}</p>
						{/snippet}
					</Popover>
				</div>
			{/each}
		</div>
	</section>

	<!-- SECTION: OPERATING HOURS -->
	<section class="flex w-full flex-col items-start">
		<hr class="mt-6 w-full border-t border-neutral-300" />
		<Text
			variant="body"
			text="Operating Hours"
			color="primary"
			className="font-semibold pl-4 py-2"
		/>
		<hr class="mb-4 w-full border-t border-neutral-300" />

		<div class="grid w-full grid-cols-4 items-center gap-y-3 py-4 pr-4">
			<!-- WEEKDAY -->
			<label
				for="weekday"
				class="col-span-1 self-center pr-2 text-right text-sm font-medium text-neutral-700"
			>
				Weekday
			</label>
			<div class="col-span-3 grid grid-cols-3 gap-2">
				<input
					id="weekdayStart"
					type="time"
					bind:value={formData.weekdayStart}
					required
					class="w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-neutral-500 "
				/>
				<input
					type="time"
					id="weekdayEnd"
					required
					bind:value={formData.weekdayEnd}
					class="w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-neutral-500 "
				/>
				<input
					type="number"
					id="weekdayPeakRoutes"
					min="0"
					bind:value={formData.weekdayPeakRoutes}
					required
					placeholder="# peak routes"
					class="w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-neutral-500 "
				/>
			</div>

			<!-- SATURDAY -->
			<label
				for="saturday"
				class="col-span-1 self-center pr-2 text-right text-sm font-medium text-neutral-700"
			>
				Saturday
			</label>
			<div class="col-span-3 grid grid-cols-3 gap-2">
				<input
					type="time"
					id="saturdayStart"
					bind:value={formData.saturdayStart}
					class="w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-neutral-500 "
				/>
				<input
					type="time"
					id="saturdayEnd"
					bind:value={formData.saturdayEnd}
					class="w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-neutral-500 "
				/>
				<input
					type="number"
					id="saturdayPeakRoutes"
					min="0"
					bind:value={formData.saturdayPeakRoutes}
					placeholder="# peak routes"
					class="w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-neutral-500 "
				/>
			</div>

			<!-- SUNDAY -->
			<label
				for="Sunday"
				class="col-span-1 self-center pr-2 text-right text-sm font-medium text-neutral-700"
			>
				Sunday
			</label>
			<div class="col-span-3 grid grid-cols-3 gap-2">
				<input
					type="time"
					id="sundayStart"
					bind:value={formData.sundayStart}
					class="w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-neutral-500 "
				/>
				<input
					type="time"
					id="sundayEnd"
					bind:value={formData.sundayEnd}
					class="w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-neutral-500"
				/>
				<input
					type="number"
					id="sundayPeakRoutes"
					min="0"
					bind:value={formData.sundayPeakRoutes}
					placeholder="# peak routes"
					class="w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder:text-neutral-500"
				/>
			</div>
		</div>
	</section>

	<!-- SECTION: CONTRACTOR -->
	<section class="flex w-full flex-col items-start">
		<hr class="mt-6 w-full border-t border-neutral-300" />
		<Text
			variant="body"
			text="Management/Operations Contractor"
			color="primary"
			className="font-semibold pl-4 py-2"
		/>
		<hr class="mb-4 w-full border-t border-neutral-300" />

		<div class="grid w-full grid-cols-4 items-center gap-y-3 py-4 pr-4 pb-4">
			<label
				for="contractor"
				class="col-span-1 self-center pr-2 text-right text-sm font-medium text-neutral-700"
			>
				Contractor Name
			</label>
			<input
				id="contractor"
				bind:value={formData.contractor}
				required
				type="text"
				class="col-span-3 w-full rounded-xl border-2 border-neutral-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-600 focus:outline-none"
				placeholder="MV Transporation"
			/>
		</div>
	</section>
</form>
