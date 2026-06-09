<script lang="ts">
	import IconArrowLeft from '@tabler/icons-svelte/icons/arrow-left';
	import IconArrowRight from '@tabler/icons-svelte/icons/arrow-right';

	type CalendarEvent = {
		id: string;
		title: string;
		date: string;
		time?: string;
		tone: 'theme' | 'blue' | 'green' | 'orange' | 'purple';
	};

	const today = new Date();
	const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const currentFiscalYear = today.getMonth() >= 6 ? today.getFullYear() + 1 : today.getFullYear();
	const fiscalYearStart = new Date(currentFiscalYear - 1, 6, 1);
	const fiscalYearEnd = new Date(currentFiscalYear, 5, 1);
	const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const monthYearFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
	const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});

	let viewedMonth = $state(new Date(today.getFullYear(), today.getMonth(), 1));

	const viewedMonthLongLabel = $derived(monthYearFormatter.format(viewedMonth));
	const isViewingCurrentMonth = $derived(isSameMonth(viewedMonth, todayStart));
	const canGoPrevious = $derived(viewedMonth.getTime() > fiscalYearStart.getTime());
	const canGoNext = $derived(viewedMonth.getTime() < fiscalYearEnd.getTime());
	const calendarDays = $derived.by(() => {
		const firstDay = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth(), 1);
		const gridStart = new Date(firstDay);
		gridStart.setDate(firstDay.getDate() - firstDay.getDay());

		return Array.from({ length: 42 }, (_, index) => {
			const date = new Date(gridStart);
			date.setDate(gridStart.getDate() + index);
			return date;
		});
	});

	const events: CalendarEvent[] = [
		{
			id: 'fy-start',
			title: `FY${currentFiscalYear} begins`,
			date: dateKey(fiscalYearStart),
			time: 'Fiscal year'
		},
		{
			id: 'today',
			title: 'Today',
			date: dateKey(todayStart),
			time: fullDateFormatter.format(todayStart),
			tone: 'theme'
		}
	].map((event) => ({ tone: 'theme', ...event }));

	function dateKey(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function isSameMonth(left: Date, right: Date): boolean {
		return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
	}

	function isSameDay(left: Date, right: Date): boolean {
		return dateKey(left) === dateKey(right);
	}

	function eventsForDate(date: Date): CalendarEvent[] {
		return events.filter((event) => event.date === dateKey(date));
	}

	function goToToday() {
		viewedMonth = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
	}

	function shiftViewedMonth(offset: number) {
		const nextMonth = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + offset, 1);
		if (
			nextMonth.getTime() < fiscalYearStart.getTime() ||
			nextMonth.getTime() > fiscalYearEnd.getTime()
		) {
			return;
		}
		viewedMonth = nextMonth;
	}
</script>

<section
	class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-1)]"
>
	<header
		class="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface-1)] px-4 py-3"
	>
		<div class="flex items-center gap-3">
			<!-- <button
				type="button"
				class="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--surface-2)] text-xl font-semibold text-[var(--text)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--surface-2)]"
				aria-label="View previous month"
				disabled={!canGoPrevious}
				onclick={() => shiftViewedMonth(-1)}
			>
				‹
			</button> -->
			<h2 class="min-w-36 text-2xl font-bold text-[var(--text)]">{viewedMonthLongLabel}</h2>
			<!-- <button
				type="button"
				class="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--surface-2)] text-xl font-semibold text-[var(--text)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--surface-2)]"
				aria-label="View next month"
				disabled={!canGoNext}
				onclick={() => shiftViewedMonth(1)}
			>
				›
			</button> -->
		</div>
		<div class="item-center flex">
			<button
				type="button"
				class="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--surface-2)] text-xl font-semibold text-[var(--text)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--surface-2)]"
				aria-label="View previous month"
				disabled={!canGoPrevious}
				onclick={() => shiftViewedMonth(-1)}
			>
				<IconArrowLeft size={20} stroke={2.5} />
			</button>
			<button
				type="button"
				class="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--surface-2)] text-xl font-semibold text-[var(--text)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--surface-2)]"
				aria-label="View next month"
				disabled={!canGoNext}
				onclick={() => shiftViewedMonth(1)}
			>
				<IconArrowRight size={20} stroke={2.5} />
			</button>
			{#if !isViewingCurrentMonth}
				<div class="ml-2 flex items-center gap-3">
					<button
						type="button"
						class="inline-flex h-9 min-w-28 items-center justify-center rounded-sm bg-[var(--theme-color)] px-3 text-sm font-semibold text-white transition hover:bg-[color-mix(in_srgb,var(--theme-color)_88%,black_12%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)]"
						onclick={goToToday}
					>
						Go to Today
					</button>
				</div>
			{/if}
		</div>
	</header>

	<div class="shrink-0 overflow-auto">
		<div class="grid min-w-[720px] grid-cols-7 border-b border-[#393939] bg-[#161616]">
			{#each weekdayLabels as day}
				<div
					class="border-r border-[#393939] px-3 py-3 text-center text-[11px] font-semibold tracking-[0.04em] text-[#f4f4f4] uppercase last:border-r-0"
				>
					{day}
				</div>
			{/each}
		</div>

		<div class="grid min-w-[720px] grid-cols-7">
			{#each calendarDays as date}
				{@const inViewedMonth = isSameMonth(date, viewedMonth)}
				{@const dayEvents = eventsForDate(date)}
				<div
					class="min-h-[7.5rem] border-r border-b border-[#d0d0d0] bg-[var(--surface-1)] p-3 last:border-r-0 {inViewedMonth
						? ''
						: 'bg-[repeating-linear-gradient(-45deg,#f4f4f4_0px,#f4f4f4_6px,#e8e8e8_6px,#e8e8e8_12px)] text-[var(--text-muted)]'}"
				>
					<div class="mb-2 flex items-center justify-between">
						<span
							class="inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold {isSameDay(
								date,
								todayStart
							)
								? 'bg-[var(--theme-color)] text-white'
								: inViewedMonth
									? 'text-[var(--text)]'
									: 'text-[var(--text-muted)]'}"
						>
							{date.getDate()}
						</span>
					</div>
					<div class="flex flex-col gap-1">
						{#each dayEvents as event}
							<div
								class="rounded-sm border-l-2 border-[var(--theme-color)] bg-[var(--accent-soft)] px-2 py-1 text-xs text-[var(--text)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--theme-color)_14%,transparent)]"
							>
								<div class="font-semibold">{event.title}</div>
								{#if event.time}
									<div class="mt-0.5 text-[0.68rem] text-[var(--text-muted)]">{event.time}</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<footer
		class="flex min-h-12 flex-1 items-center border-t border-[var(--border)] bg-[var(--surface-1)] px-3 py-3 text-sm"
	>
		<span class="font-semibold text-[var(--text)]">Fiscal Year {currentFiscalYear}</span>
		<span class="ml-2 font-medium text-[var(--text-muted)]"
			>July {currentFiscalYear - 1} - June {currentFiscalYear}</span
		>
	</footer>
</section>
