<!-- src/lib/components/OperatingHoursSection.svelte -->
<script lang="ts">
	/// <reference types="svelte" />
	import CollapsibleSection from '../molecules/CollapsibleSection.svelte';
	import Checkbox from '../atoms/Checkbox.svelte';

	import type { DayService, DaySlug } from '$lib/features/forms/shared/types/capabilities.types';

	type Days = Record<DaySlug, DayService>;

	// BINDABLE SO PARENT CAN `bind:open`
	let {
		title = 'Operating Hours',
		open = $bindable(false),
		days
	}: {
		title?: string;
		open: boolean;
		days: Days;
	} = $props();

	// TOGGLES INIT FROM EXISTING DATA
	//   let hasSaturday = $state(false);
	let hasSaturday = $state(days.saturday.offered);
	let hasSunday = $state(days.sunday.offered);

	// CLEAR FIELDS WHEN DISABLED
	$effect(() => {
		days.saturday.offered = hasSaturday;
		if (!hasSaturday) {
			days.saturday.start = '';
			days.saturday.end = '';
			days.saturday.peakRoutes = 0;
		}
	});
	$effect(() => {
		days.sunday.offered = hasSunday;
		if (!hasSunday) {
			days.sunday.start = '';
			days.sunday.end = '';
			days.sunday.peakRoutes = 0;
		}
	});

	const inputCls =
		'w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 ' +
		'placeholder:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] ' +
		'focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400';

	const timePattern = '^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$';
	const timePlaceholder = 'hh:mm AM/PM';

	function pad2(n: number): string {
		return String(n).padStart(2, '0');
	}

	function toTwelveHour(hour24: number, minute: number): string {
		const suffix = hour24 < 12 ? 'AM' : 'PM';
		const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
		return `${pad2(hour12)}:${pad2(minute)} ${suffix}`;
	}

	function parseTime(raw: string): { hour24: number; minute: number } | null {
		const value = raw.trim().toUpperCase().replace(/\s+/g, ' ');
		if (!value) return null;

		// 12-hour format with optional space before AM/PM
		let m = value.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
		if (m) {
			let hour = Number(m[1]);
			const minute = Number(m[2]);
			const suffix = m[3];
			if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
			if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
			if (suffix === 'AM') {
				hour = hour === 12 ? 0 : hour;
			} else {
				hour = hour === 12 ? 12 : hour + 12;
			}
			return { hour24: hour, minute };
		}

		// 24-hour with colon
		m = value.match(/^(\d{1,2}):(\d{2})$/);
		if (m) {
			const hour = Number(m[1]);
			const minute = Number(m[2]);
			if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
			if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
			return { hour24: hour, minute };
		}

		// Digits-only input (e.g. 600, 0630, 1830)
		if (/^\d{1,4}$/.test(value)) {
			const compact = value.padStart(4, '0');
			const hour = Number(compact.slice(0, 2));
			const minute = Number(compact.slice(2, 4));
			if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
			return { hour24: hour, minute };
		}

		return null;
	}

	function normalizeTimeString(raw: string): string {
		const parsed = parseTime(raw);
		if (!parsed) return raw.trim();
		return toTwelveHour(parsed.hour24, parsed.minute);
	}

	function onTimeBlur(day: DaySlug, field: 'start' | 'end', event: Event) {
		const el = event.currentTarget as HTMLInputElement;
		const formatted = normalizeTimeString(el.value);
		days[day][field] = formatted;
		el.value = formatted;
	}
</script>

<CollapsibleSection {title} bind:open>
	<div class="grid w-full grid-cols-4 items-start gap-y-6 py-4 pr-4">
		<!-- WEEKDAY -->
		<div class="col-span-1 pr-8 text-right text-sm font-medium text-[var(--text)] dark:text-zinc-300">
			Weekday
		</div>
		<div class="col-span-3 grid grid-cols-3 gap-4">
			<div class="flex flex-col">
				<label for="weekdayStart" class="mb-1 text-sm text-[var(--text-muted)]">Begin Time</label>
				<input
					id="weekdayStart"
					type="text"
					inputmode="numeric"
					placeholder={timePlaceholder}
					pattern={timePattern}
					bind:value={days.weekday.start}
					required
					class={inputCls}
					onblur={(e) => onTimeBlur('weekday', 'start', e)}
				/>
			</div>
			<div class="flex flex-col">
				<label for="weekdayEnd" class="mb-1 text-sm text-[var(--text-muted)]">End Time</label>
				<input
					id="weekdayEnd"
					type="text"
					inputmode="numeric"
					placeholder={timePlaceholder}
					pattern={timePattern}
					bind:value={days.weekday.end}
					required
					class={inputCls}
					onblur={(e) => onTimeBlur('weekday', 'end', e)}
				/>
			</div>
			<div class="flex flex-col">
				<label for="weekdayPeakRoutes" class="mb-1 text-sm text-[var(--text-muted)]"
					># of Peak Period Routes</label
				>
				<!-- Option A: manual numeric coercion -->
				<input
					id="weekdayPeakRoutes"
					type="number"
					min="0"
					class={inputCls}
					value={days.weekday.peakRoutes ?? ''}
					oninput={(e) => {
						const el = e.currentTarget as HTMLInputElement;
						days.weekday.peakRoutes = Number.isNaN(el.valueAsNumber) ? 0 : el.valueAsNumber;
					}}
				/>
			</div>
		</div>

		<!-- SATURDAY -->
		<div class="col-span-1 pr-8 text-right text-sm font-medium text-[var(--text)] dark:text-zinc-300">
			Saturday
		</div>
		<div class="col-span-3 space-y-3">
			<Checkbox label="Offers Saturday Service" bind:checked={hasSaturday} />
			{#if hasSaturday}
				<div class="grid grid-cols-3 gap-4">
					<div class="flex flex-col">
						<label for="saturdayStart" class="mb-1 text-sm text-[var(--text-muted)]"
							>Begin Time</label
						>
						<input
							id="saturdayStart"
							type="text"
							inputmode="numeric"
							placeholder={timePlaceholder}
							pattern={timePattern}
							bind:value={days.saturday.start}
							class={inputCls}
							onblur={(e) => onTimeBlur('saturday', 'start', e)}
						/>
					</div>
					<div class="flex flex-col">
						<label for="saturdayEnd" class="mb-1 text-sm text-[var(--text-muted)]">End Time</label>
						<input
							id="saturdayEnd"
							type="text"
							inputmode="numeric"
							placeholder={timePlaceholder}
							pattern={timePattern}
							bind:value={days.saturday.end}
							class={inputCls}
							onblur={(e) => onTimeBlur('saturday', 'end', e)}
						/>
					</div>
					<div class="flex flex-col">
						<label for="saturdayPeakRoutes" class="mb-1 text-sm text-[var(--text-muted)]"
							># of Peak Period Routes</label
						>
						<input
							id="saturdayPeakRoutes"
							type="number"
							min="0"
							class={inputCls}
							value={days.saturday.peakRoutes ?? ''}
							oninput={(e) => {
								const el = e.currentTarget as HTMLInputElement;
								days.saturday.peakRoutes = Number.isNaN(el.valueAsNumber) ? 0 : el.valueAsNumber;
							}}
						/>
					</div>
				</div>
			{/if}
		</div>

		<!-- SUNDAY -->
		<div class="col-span-1 pr-8 text-right text-sm font-medium text-[var(--text)] dark:text-zinc-300">
			Sunday
		</div>
		<div class="col-span-3 space-y-3">
			<Checkbox label="Offers Sunday Service" bind:checked={hasSunday} />
			{#if hasSunday}
				<div class="grid grid-cols-3 gap-4">
					<div class="flex flex-col">
						<label for="sundayStart" class="mb-1 text-sm text-[var(--text-muted)]">Begin Time</label
						>
						<input
							id="sundayStart"
							type="text"
							inputmode="numeric"
							placeholder={timePlaceholder}
							pattern={timePattern}
							bind:value={days.sunday.start}
							class={inputCls}
							onblur={(e) => onTimeBlur('sunday', 'start', e)}
						/>
					</div>
					<div class="flex flex-col">
						<label for="sundayEnd" class="mb-1 text-sm text-[var(--text-muted)]">End Time</label>
						<input
							id="sundayEnd"
							type="text"
							inputmode="numeric"
							placeholder={timePlaceholder}
							pattern={timePattern}
							bind:value={days.sunday.end}
							class={inputCls}
							onblur={(e) => onTimeBlur('sunday', 'end', e)}
						/>
					</div>
					<div class="flex flex-col">
						<label for="sundayPeakRoutes" class="mb-1 text-sm text-[var(--text-muted)]"
							># of Peak Period Routes</label
						>
						<input
							id="sundayPeakRoutes"
							type="number"
							min="0"
							class={inputCls}
							value={days.sunday.peakRoutes ?? ''}
							oninput={(e) => {
								const el = e.currentTarget as HTMLInputElement;
								days.sunday.peakRoutes = Number.isNaN(el.valueAsNumber) ? 0 : el.valueAsNumber;
							}}
						/>
					</div>
				</div>
			{/if}
		</div>
	</div>
</CollapsibleSection>
