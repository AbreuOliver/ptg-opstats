<script lang="ts">
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
	const fiscalMonths = Array.from(
		{ length: 12 },
		(_, index) => new Date(fiscalYearStart.getFullYear(), fiscalYearStart.getMonth() + index, 1)
	);
	const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const monthYearFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
	const shortMonthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
	const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});

	let viewedMonth = $state(new Date(today.getFullYear(), today.getMonth(), 1));

	const viewedMonthLongLabel = $derived(monthYearFormatter.format(viewedMonth));
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

	function miniMonthDays(month: Date): (Date | null)[] {
		const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
		const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
		const blanks = Array.from({ length: firstDay.getDay() }, () => null);
		const days = Array.from(
			{ length: daysInMonth },
			(_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)
		);
		const cells = [...blanks, ...days];
		while (cells.length % 7 !== 0) cells.push(null);
		return cells;
	}

	function goToToday() {
		viewedMonth = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
	}
</script>

<section class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
	<header
		class="grid shrink-0 grid-cols-[14rem_1fr_auto] items-center gap-4 border-b border-[var(--border)] bg-[var(--surface-1)] px-4 py-3"
	>
		<h2 class="text-2xl font-bold text-[var(--text)]">{viewedMonthLongLabel}</h2>

		<div class="flex items-center gap-2 text-sm">
			<span class="font-semibold text-[var(--theme-color)]">Fiscal Year {currentFiscalYear}</span>
			<span class="font-medium text-[var(--text-muted)]">July {currentFiscalYear - 1} - June {currentFiscalYear}</span>
		</div>

		<div class="flex items-center gap-3">
			<div
				class="hidden overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--surface-2)] text-sm md:flex"
				aria-label="Calendar view"
			>
				<span class="px-3 py-2 text-[var(--text-muted)]">Day</span>
				<span class="border-x border-[var(--border)] px-3 py-2 text-[var(--text-muted)]">Week</span>
				<span class="bg-[var(--theme-color)] px-3 py-2 font-semibold text-white">Month</span>
			</div>
			<button
				type="button"
				class="inline-flex h-9 min-w-28 items-center justify-center rounded-sm bg-[var(--theme-color)] px-3 text-sm font-semibold text-white transition hover:bg-[color-mix(in_srgb,var(--theme-color)_88%,black_12%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)]"
				onclick={goToToday}
			>
				Go to Today
			</button>
		</div>
	</header>

	<div class="grid min-h-0 flex-1 grid-cols-[14rem_1fr]">
		<aside class="min-h-0 border-r border-[var(--border)] bg-[var(--surface-1)]">
			<div class="h-full overflow-y-auto p-3">
				<div class="mb-3 text-xs font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
					Fiscal Months
				</div>
				<div class="flex flex-col gap-3">
					{#each fiscalMonths as month}
						<button
							type="button"
							class="rounded-md border p-3 text-left transition {isSameMonth(month, viewedMonth)
								? 'border-[var(--theme-color)] bg-[var(--accent-soft)]'
								: 'border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]'}"
							onclick={() => (viewedMonth = new Date(month))}
						>
							<div class="mb-2 flex items-center justify-between">
								<span class="text-sm font-semibold text-[var(--text)]">{monthYearFormatter.format(month)}</span>
								{#if isSameMonth(month, todayStart)}
									<span class="rounded-full bg-[var(--theme-color)] px-2 py-0.5 text-[0.65rem] font-semibold text-white">Current</span>
								{/if}
							</div>
							<div class="grid grid-cols-7 gap-1 text-center text-[0.65rem] text-[var(--text-muted)]">
								{#each weekdayLabels as day}
									<span class="font-semibold">{day.slice(0, 1)}</span>
								{/each}
								{#each miniMonthDays(month) as date}
									<span
										class="flex h-5 items-center justify-center rounded-full {date && isSameDay(date, todayStart)
											? 'bg-[var(--theme-color)] font-semibold text-white'
											: date
												? 'text-[var(--text)]'
												: 'text-transparent'}"
									>
										{date ? date.getDate() : '0'}
									</span>
								{/each}
							</div>
						</button>
					{/each}
				</div>
			</div>
		</aside>

		<div class="min-w-0 overflow-auto">
			<div class="grid min-w-[720px] grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-2)]">
				{#each weekdayLabels as day}
					<div class="border-r border-[var(--border)] px-3 py-2 text-center text-xs font-semibold text-[var(--text-muted)] last:border-r-0">
						{day}
					</div>
				{/each}
			</div>

			<div class="grid min-w-[720px] grid-cols-7">
				{#each calendarDays as date}
					{@const inViewedMonth = isSameMonth(date, viewedMonth)}
					{@const dayEvents = eventsForDate(date)}
					<div
						class="min-h-[7.5rem] border-r border-b border-[var(--border)] bg-[var(--surface-1)] p-2 last:border-r-0 {inViewedMonth
							? ''
							: 'bg-[color-mix(in_srgb,var(--surface-2)_45%,white_55%)] text-[var(--text-muted)]'}"
					>
						<div class="mb-2 flex items-center justify-between">
							<span
								class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold {isSameDay(
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
									class="rounded-sm border-l-2 border-[var(--theme-color)] bg-[var(--accent-soft)] px-2 py-1 text-xs text-[var(--text)]"
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
	</div>
</section>
