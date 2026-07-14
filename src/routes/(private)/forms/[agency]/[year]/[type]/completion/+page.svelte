<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onDestroy, onMount } from 'svelte';
	import {
		loadResolvedFormDraftSnapshot,
		setFormDraftSnapshot
	} from '$lib/features/forms/persistence/formDraftRegistry';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type DraftStore = Record<string, (number | null)[]>;
	type MonthlyRow = {
		serviceType: string;
		operatingDays: number | null;
		hours: number | null;
		miles: number | null;
		passTripsNonCon: number | null;
		passTripsMedCon: number | null;
		passTripsNonMedCon: number | null;
		passTripsBroMedCon?: number | null;
	};
	type CompletionDraft = {
		surplusTransitAccount: number | null;
		surplusOtherPurpose: number | null;
		surplusExplain: string;
		deficitDrawDownTransitAccount: number | null;
		deficitLocalGovernmentFunds: number | null;
		deficitOther: number | null;
		deficitExplain: string;
		authorizedOfficial: string;
		authorizedDate: string;
		financialManager: string;
		financialDate: string;
	};
	type AnnualStatisticsDraft = {
		employees: {
			driver: {
				ftPayHours: number | null;
				ptPayHours: number | null;
			};
		};
	};
	type SummaryRow = {
		label: string;
		kind: 'finance' | 'monthly';
		rowId?: FinanceRowId;
		metric?: 'hours' | 'miles' | 'trips';
	};

	type FinanceRowId = (typeof FINANCE_ROW_IDS)[keyof typeof FINANCE_ROW_IDS];

	const FINANCE_ROW_IDS = {
		administrative: 'total_administrative_expenses',
		operating: 'total_operating_expenses',
		capital: 'total_capital_expenses'
	} as const;

	const SUMMARY_ROWS: SummaryRow[] = [
		{ label: 'Administrative Expenses', kind: 'finance', rowId: FINANCE_ROW_IDS.administrative },
		{ label: 'Operating Expenses', kind: 'finance', rowId: FINANCE_ROW_IDS.operating },
		{ label: 'Capital Expenses', kind: 'finance', rowId: FINANCE_ROW_IDS.capital },
		{ label: 'Miles', kind: 'monthly', metric: 'miles' },
		{ label: 'Hours', kind: 'monthly', metric: 'hours' },
		{ label: 'Passenger Trips', kind: 'monthly', metric: 'trips' }
	];

	const VITAL_ROWS: Array<{ label: string; prefix: 'MB' | 'DR' | 'MT'; kind: 'rate' }> = [
		{ label: 'Fixed Route Weekly Passenger Trips/Hour', prefix: 'MB', kind: 'rate' },
		{ label: 'Demand Response/Sub Weekly Passenger Trips/Hour', prefix: 'DR', kind: 'rate' },
		{ label: 'Microtransit Weekday Passenger Trips/Hour', prefix: 'MT', kind: 'rate' },
		{ label: 'Fixed Route Weekly Passenger Trips/Mile', prefix: 'MB', kind: 'rate' },
		{ label: 'Demand Response/Sub Weekly Passenger Trips/Mile', prefix: 'DR', kind: 'rate' },
		{ label: 'Microtransit Weekly Passenger Trips/Mile', prefix: 'MT', kind: 'rate' }
	];

	const type = $derived(page.params.type as 'urban' | 'rural');
	const year = $derived(Number(page.params.year));
	const agencyName = $derived(
		(data as { agency?: string | null }).agency ?? page.params.agency ?? 'Transit Agency'
	);
	const financeKey = $derived(`finance:${type}:${year}:urban-financial`);
	const completionKey = $derived(`completion:${type}:${year}:rural`);
	const remoteFinanceDraft = $derived(
		(data as { remoteFinanceDraft?: DraftStore | null }).remoteFinanceDraft ?? null
	);
	const remoteAnnualStatisticsDraft = $derived(
		(data as { remoteAnnualStatisticsDraft?: AnnualStatisticsDraft | null }).remoteAnnualStatisticsDraft ??
			null
	);
	const remoteMonthlyRows = $derived(
		(data as { remoteMonthlyRows?: MonthlyRow[] | null }).remoteMonthlyRows ?? []
	);
	const remoteCompletionDraft = $derived(
		(data as { remoteDraft?: Partial<CompletionDraft> | null }).remoteDraft ?? null
	);

	const DO_INDICES = [0, 2, 4, 6, 8, 10];
	const PT_INDICES = [1, 3, 5, 7, 9, 11];

	const currency0 = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});
	const currency2 = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
	const integerFormat = new Intl.NumberFormat('en-US');
	const rateFormat = new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});

	const emptyCompletionDraft = (): CompletionDraft => ({
		surplusTransitAccount: null,
		surplusOtherPurpose: null,
		surplusExplain: '',
		deficitDrawDownTransitAccount: null,
		deficitLocalGovernmentFunds: null,
		deficitOther: null,
		deficitExplain: '',
		authorizedOfficial: '',
		authorizedDate: '',
		financialManager: '',
		financialDate: ''
	});

	const emptyAnnualStatisticsDraft = (): AnnualStatisticsDraft => ({
		employees: {
			driver: {
				ftPayHours: null,
				ptPayHours: null
			}
		}
	});

	let completion = $state<CompletionDraft>(emptyCompletionDraft());
	let financeDraft = $state<DraftStore>({});
	let annualStatistics = $state<AnnualStatisticsDraft>(emptyAnnualStatisticsDraft());
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	function isPlainObject(value: unknown): value is Record<string, unknown> {
		return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
	}

	function normalizeCompletionDraft(value: unknown): CompletionDraft {
		return {
			...emptyCompletionDraft(),
			...(isPlainObject(value) ? (value as Partial<CompletionDraft>) : {})
		};
	}

	function normalizeFinanceDraft(value: unknown): DraftStore {
		if (!isPlainObject(value)) return {};
		return value as DraftStore;
	}

	function normalizeAnnualStatisticsDraft(value: unknown): AnnualStatisticsDraft {
		if (!isPlainObject(value)) return emptyAnnualStatisticsDraft();
		const employees = isPlainObject(value.employees) ? value.employees : {};
		const driver = isPlainObject(employees.driver) ? employees.driver : {};
		return {
			employees: {
				driver: {
					ftPayHours: typeof driver.ftPayHours === 'number' ? driver.ftPayHours : null,
					ptPayHours: typeof driver.ptPayHours === 'number' ? driver.ptPayHours : null
				}
			}
		};
	}

	function loadFinanceDraft() {
		if (!browser) return;
		financeDraft = loadResolvedFormDraftSnapshot(
			financeKey,
			remoteFinanceDraft ?? {},
			normalizeFinanceDraft
		) as DraftStore;
	}

	function loadAnnualStatisticsDraft() {
		if (!browser) return;
		annualStatistics = normalizeAnnualStatisticsDraft(remoteAnnualStatisticsDraft);
	}

	function loadCompletionDraft() {
		if (!browser) return;
		completion = loadResolvedFormDraftSnapshot(
			completionKey,
			remoteCompletionDraft ?? emptyCompletionDraft(),
			normalizeCompletionDraft
		) as CompletionDraft;
	}

	onMount(() => {
		loadFinanceDraft();
		loadAnnualStatisticsDraft();
		loadCompletionDraft();
	});

	onDestroy(() => {
		if (saveTimer) clearTimeout(saveTimer);
	});

	$effect(() => {
		if (!browser) return;
		financeKey;
		remoteFinanceDraft;
		loadFinanceDraft();
	});

	$effect(() => {
		if (!browser) return;
		remoteAnnualStatisticsDraft;
		loadAnnualStatisticsDraft();
	});

	$effect(() => {
		if (!browser) return;
		completionKey;
		remoteCompletionDraft;
		loadCompletionDraft();
	});

	$effect(() => {
		if (!browser) return;
		completion;
		setFormDraftSnapshot(completionKey, completion);
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			localStorage.setItem(completionKey, JSON.stringify(completion));
		}, 250);
	});

	function cleanServiceType(serviceType: string): string {
		return serviceType.trim().toUpperCase();
	}

	function rowMatchesSide(serviceType: string, side: 'do' | 'pt'): boolean {
		const normalized = cleanServiceType(serviceType);
		if (normalized === 'ALL') return false;
		return side === 'do' ? normalized.endsWith(' DO') : normalized.endsWith(' PT');
	}

	function rowMatchesPrefix(serviceType: string, prefix: 'MB' | 'DR' | 'MT'): boolean {
		const normalized = cleanServiceType(serviceType);
		return normalized.startsWith(`${prefix} `);
	}

	function tripCount(row: MonthlyRow): number | null {
		let sum = 0;
		let hasAny = false;
		for (const value of [row.passTripsNonCon, row.passTripsMedCon, row.passTripsNonMedCon, row.passTripsBroMedCon]) {
			if (typeof value === 'number') {
				sum += value;
				hasAny = true;
			}
		}
		return hasAny ? sum : null;
	}

	function sumSelectedCells(values: (number | null)[] | undefined, indices: number[]): number | null {
		if (!Array.isArray(values)) return null;
		let sum = 0;
		let hasAny = false;
		for (const index of indices) {
			const value = values[index];
			if (typeof value === 'number') {
				sum += value;
				hasAny = true;
			}
		}
		return hasAny ? sum : null;
	}

	function financeSplit(rowId: FinanceRowId): { do: number | null; pt: number | null; total: number | null } {
		const row = financeDraft[rowId] ?? [];
		return {
			do: sumSelectedCells(row, DO_INDICES),
			pt: sumSelectedCells(row, PT_INDICES),
			total: sumSelectedCells(row, [...DO_INDICES, ...PT_INDICES])
		};
	}

	function monthlyTotal(
		metric: 'hours' | 'miles' | 'trips',
		options: { prefix?: 'MB' | 'DR' | 'MT'; side?: 'do' | 'pt' } = {}
	): number | null {
		let sum = 0;
		let hasAny = false;
		for (const row of remoteMonthlyRows) {
			const serviceType = cleanServiceType(row.serviceType);
			if (serviceType === 'ALL') continue;
			if (options.prefix && !rowMatchesPrefix(serviceType, options.prefix)) continue;
			if (options.side && !rowMatchesSide(serviceType, options.side)) continue;

			const value =
				metric === 'hours'
					? row.hours
					: metric === 'miles'
						? row.miles
						: tripCount(row);
			if (typeof value === 'number') {
				sum += value;
				hasAny = true;
			}
		}
		return hasAny ? sum : null;
	}

	function monthlySplit(metric: 'hours' | 'miles' | 'trips'): { do: number | null; pt: number | null; total: number | null } {
		return {
			do: monthlyTotal(metric, { side: 'do' }),
			pt: monthlyTotal(metric, { side: 'pt' }),
			total: monthlyTotal(metric)
		};
	}

	function prefixTotals(prefix: 'MB' | 'DR' | 'MT'): {
		do: { hours: number | null; miles: number | null; trips: number | null };
		pt: { hours: number | null; miles: number | null; trips: number | null };
		total: { hours: number | null; miles: number | null; trips: number | null };
	} {
		return {
			do: {
				hours: monthlyTotal('hours', { prefix, side: 'do' }),
				miles: monthlyTotal('miles', { prefix, side: 'do' }),
				trips: monthlyTotal('trips', { prefix, side: 'do' })
			},
			pt: {
				hours: monthlyTotal('hours', { prefix, side: 'pt' }),
				miles: monthlyTotal('miles', { prefix, side: 'pt' }),
				trips: monthlyTotal('trips', { prefix, side: 'pt' })
			},
			total: {
				hours: monthlyTotal('hours', { prefix }),
				miles: monthlyTotal('miles', { prefix }),
				trips: monthlyTotal('trips', { prefix })
			}
		};
	}

	function driverFte(): number | null {
		const hours =
			(annualStatistics.employees.driver.ftPayHours ?? 0) +
			(annualStatistics.employees.driver.ptPayHours ?? 0);
		if (
			annualStatistics.employees.driver.ftPayHours == null &&
			annualStatistics.employees.driver.ptPayHours == null
		) {
			return null;
		}
		return hours / 2080;
	}

	function ratio(numerator: number | null, denominator: number | null): number | null {
		if (numerator == null && denominator == null) return null;
		if (!denominator) return 0;
		return (numerator ?? 0) / denominator;
	}

	function fmtMoney(value: number | null): string {
		return value == null || value === 0 ? '—' : currency0.format(value);
	}

	function fmtMoney2(value: number | null): string {
		return value == null ? '—' : currency2.format(value);
	}

	function fmtNumber(value: number | null): string {
		return value == null ? '—' : integerFormat.format(value);
	}

	function fmtRate(value: number | null): string {
		return value == null ? '—' : rateFormat.format(value);
	}

	function fmtSummaryCell(row: SummaryRow, side: 'do' | 'pt' | 'total'): string {
		if (row.kind === 'finance') {
			const split = financeSplit(row.rowId ?? FINANCE_ROW_IDS.operating);
			return fmtMoney(side === 'do' ? split.do : side === 'pt' ? split.pt : split.total);
		}

		const split = monthlySplit(row.metric ?? 'hours');
		return fmtNumber(side === 'do' ? split.do : side === 'pt' ? split.pt : split.total);
	}

	function fmtVitalCell(
		row: { label: string; prefix: 'MB' | 'DR' | 'MT'; kind: 'rate' },
		side: 'do' | 'pt' | 'total'
	): string {
		const totals = prefixTotals(row.prefix);
		const operatingExpense = financeSplit(FINANCE_ROW_IDS.operating);

		if (row.label.includes('Trips/Hour')) {
			const value = ratio(
				side === 'do' ? totals.do.trips : side === 'pt' ? totals.pt.trips : totals.total.trips,
				side === 'do' ? totals.do.hours : side === 'pt' ? totals.pt.hours : totals.total.hours
			);
			return fmtRate(value);
		}

		if (row.label.includes('Trips/Mile')) {
			const value = ratio(
				side === 'do' ? totals.do.trips : side === 'pt' ? totals.pt.trips : totals.total.trips,
				side === 'do' ? totals.do.miles : side === 'pt' ? totals.pt.miles : totals.total.miles
			);
			return fmtRate(value);
		}

		const value = ratio(
			side === 'do'
				? operatingExpense.do
				: side === 'pt'
					? operatingExpense.pt
					: operatingExpense.total,
			side === 'do'
				? monthlySplit('trips').do
				: side === 'pt'
					? monthlySplit('trips').pt
					: monthlySplit('trips').total
		);
		return fmtMoney2(value);
	}

	function setMoneyField(
		field:
			| 'surplusTransitAccount'
			| 'surplusOtherPurpose'
			| 'deficitDrawDownTransitAccount'
			| 'deficitLocalGovernmentFunds'
			| 'deficitOther',
		raw: string
	) {
		const cleaned = raw.replace(/[$,\s]/g, '');
		if (cleaned === '') {
			completion[field] = null;
			return;
		}
		if (!/^-?\d+$/.test(cleaned)) return;
		const parsed = Number(cleaned);
		if (!Number.isFinite(parsed)) return;
		completion[field] = parsed;
	}

	function displayMoney(value: number | null): string {
		return value == null ? '' : currency0.format(value);
	}
</script>

<section class="flex flex-col gap-4">
	{#if type !== 'rural'}
		<div class="rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
			Completion is only available for Rural forms.
		</div>
	{:else}
		<div class="mx-auto flex w-full max-w-[940px] flex-col gap-4 px-2 pb-10 pt-2">


			<div class="overflow-hidden border border-black bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
				<table class="w-full table-fixed border-separate border-spacing-0 text-[13px]">
					<colgroup>
						<col style="width: 46%" />
						<col style="width: 18%" />
						<col style="width: 18%" />
						<col style="width: 18%" />
					</colgroup>
					<thead>
						<tr class="bg-black text-white">
							<th class="border-r border-black px-3 py-1.5 text-left text-[1rem] font-semibold">Summary</th>
							<th class="border-r border-black px-3 py-1.5 text-center text-[1rem] font-semibold">DO</th>
							<th class="border-r border-black px-3 py-1.5 text-center text-[1rem] font-semibold">PT</th>
							<th class="px-3 py-1.5 text-center text-[1rem] font-semibold">Total</th>
						</tr>
					</thead>
					<tbody>
						{#each SUMMARY_ROWS as row}
							<tr class="border-b border-black/40">
								<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
									{row.label}
								</th>
								<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
									{fmtSummaryCell(row, 'do')}
								</td>
								<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
									{fmtSummaryCell(row, 'pt')}
								</td>
								<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
									{fmtSummaryCell(row, 'total')}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="overflow-hidden border border-black bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
				<table class="w-full table-fixed border-separate border-spacing-0 text-[13px]">
					<colgroup>
						<col style="width: 46%" />
						<col style="width: 18%" />
						<col style="width: 18%" />
						<col style="width: 18%" />
					</colgroup>
					<thead>
						<tr class="bg-black text-white">
							<th class="border-r border-black px-3 py-1.5 text-left text-[1rem] font-semibold">Vital Signs</th>
							<th class="border-r border-black px-3 py-1.5 text-center text-[1rem] font-semibold">DO</th>
							<th class="border-r border-black px-3 py-1.5 text-center text-[1rem] font-semibold">PT</th>
							<th class="px-3 py-1.5 text-center text-[1rem] font-semibold">Total</th>
						</tr>
					</thead>
					<tbody>
						{#each VITAL_ROWS as row}
							<tr class="border-b border-black/40">
								<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
									{row.label}
								</th>
								<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
									{fmtVitalCell(row, 'do')}
								</td>
								<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
									{fmtVitalCell(row, 'pt')}
								</td>
								<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
									{fmtVitalCell(row, 'total')}
								</td>
							</tr>
						{/each}
						<tr class="border-b border-black/40">
							<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
								Operating Cost per Passenger Trips
							</th>
							<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
								{fmtMoney2(ratio(financeSplit(FINANCE_ROW_IDS.operating).do, monthlySplit('trips').do))}
							</td>
							<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
								{fmtMoney2(ratio(financeSplit(FINANCE_ROW_IDS.operating).pt, monthlySplit('trips').pt))}
							</td>
							<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
								{fmtMoney2(ratio(financeSplit(FINANCE_ROW_IDS.operating).total, monthlySplit('trips').total))}
							</td>
						</tr>
						<tr class="border-b border-black/40">
							<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
								Operating Cost per Hour
							</th>
							<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
								{fmtMoney2(ratio(financeSplit(FINANCE_ROW_IDS.operating).do, monthlySplit('hours').do))}
							</td>
							<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
								{fmtMoney2(ratio(financeSplit(FINANCE_ROW_IDS.operating).pt, monthlySplit('hours').pt))}
							</td>
							<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
								{fmtMoney2(ratio(financeSplit(FINANCE_ROW_IDS.operating).total, monthlySplit('hours').total))}
							</td>
						</tr>
						<tr class="border-b border-black/40">
							<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
								Operating Cost per Mile
							</th>
							<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
								{fmtMoney2(ratio(financeSplit(FINANCE_ROW_IDS.operating).do, monthlySplit('miles').do))}
							</td>
							<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
								{fmtMoney2(ratio(financeSplit(FINANCE_ROW_IDS.operating).pt, monthlySplit('miles').pt))}
							</td>
							<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
								{fmtMoney2(ratio(financeSplit(FINANCE_ROW_IDS.operating).total, monthlySplit('miles').total))}
							</td>
						</tr>
						<tr>
							<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
								Transit Trips per Driver FTE
							</th>
							<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">—</td>
							<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">—</td>
							<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
								{fmtRate(ratio(monthlySplit('trips').total, driverFte()))}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="border border-black bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
				<div class="grid gap-4">
					<div class="grid gap-2 md:grid-cols-[1fr_240px] md:items-end">
						<div>
							<div class="text-[15px] font-semibold text-[var(--theme-color)] underline decoration-[var(--theme-color)] decoration-1 underline-offset-2">
								224 How much money was in the Operating Reserve at the end of the year?
							</div>
						</div>
						<input
							type="text"
							class="w-full rounded-[2px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--theme-color)_18%,white)] px-3 py-2 text-right font-mono text-[15px] text-black/80 focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:text-white"
							value={displayMoney(completion.surplusTransitAccount)}
							oninput={(e) =>
								setMoneyField('surplusTransitAccount', (e.currentTarget as HTMLInputElement).value)}
							onblur={(e) =>
								((e.currentTarget as HTMLInputElement).value = displayMoney(
									completion.surplusTransitAccount
								))}
						/>
					</div>

					<div class="grid gap-2">
						<div class="text-[15px] font-semibold text-[var(--theme-color)] underline decoration-[var(--theme-color)] decoration-1 underline-offset-2">
							225 After reviewing the system's vital signs, what has the system been doing well?
						</div>
						<textarea
							class="min-h-[4.5rem] w-full rounded-[2px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--theme-color)_18%,white)] px-3 py-2 text-[15px] text-black/80 focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:text-white"
							bind:value={completion.surplusExplain}
						></textarea>
					</div>

					<div class="grid gap-2">
						<div class="text-[15px] font-semibold text-[var(--theme-color)] underline decoration-[var(--theme-color)] decoration-1 underline-offset-2">
							226 After reviewing the system's vital signs, what should the system do to improve it's performance?
						</div>
						<textarea
							class="min-h-[4.5rem] w-full rounded-[2px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--theme-color)_18%,white)] px-3 py-2 text-[15px] text-black/80 focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:text-white"
							bind:value={completion.deficitExplain}
						></textarea>
					</div>

					<div class="text-[15px] font-semibold text-[black]">
						I hereby certify that, to the best of my knowledge, the information in this report is accurate and complete.
					</div>

					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-1">
							<label class="block text-[15px] font-semibold text-black" for="authorized-official">
								Signature of Authorized Official
							</label>
							<input
								id="authorized-official"
								type="text"
								class="w-full rounded-[2px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--theme-color)_18%,white)] px-3 py-2 text-[15px] text-black/80 focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:text-white"
								bind:value={completion.authorizedOfficial}
							/>
						</div>
						<div class="space-y-1">
							<label class="block text-[15px] font-semibold text-black" for="authorized-date">Date</label>
							<input
								id="authorized-date"
								type="text"
								placeholder="MM/DD/YYYY"
								class="w-full rounded-[2px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--theme-color)_18%,white)] px-3 py-2 text-[15px] text-black/80 focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:text-white"
								bind:value={completion.authorizedDate}
							/>
						</div>
						<div class="space-y-1">
							<label class="block text-[15px] font-semibold text-black" for="financial-manager">
								Signature of Financial Manager
							</label>
							<input
								id="financial-manager"
								type="text"
								class="w-full rounded-[2px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--theme-color)_18%,white)] px-3 py-2 text-[15px] text-black/80 focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:text-white"
								bind:value={completion.financialManager}
							/>
						</div>
						<div class="space-y-1">
							<label class="block text-[15px] font-semibold text-black" for="financial-date">Date</label>
							<input
								id="financial-date"
								type="text"
								placeholder="MM/DD/YYYY"
								class="w-full rounded-[2px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--theme-color)_18%,white)] px-3 py-2 text-[15px] text-black/80 focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:text-white"
								bind:value={completion.financialDate}
							/>
						</div>
					</div>

					<div class="space-y-1">
						<div class="text-[15px] font-semibold text-black">ITRE Comments about the data</div>
						<div class="min-h-[4.5rem] w-full border border-[var(--border)] bg-white px-3 py-2 text-[15px] text-black/70 dark:border-zinc-700 dark:bg-zinc-950">
							Not currently captured in the database.
						</div>
					</div>

					<!-- <div class="text-xs font-medium text-red-600">
						Upload the original excel file and scanned version of the signed completion tab to partner connect
					</div> -->
				</div>
			</div>
		</div>
	{/if}
</section>
