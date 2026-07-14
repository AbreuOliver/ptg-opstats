<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onDestroy, onMount } from 'svelte';
	import { loadCapabilities } from '$lib/features/forms/shared/stores/capabilities.store';
	import {
		loadResolvedFormDraftSnapshot,
		setFormDraftSnapshot
	} from '$lib/features/forms/persistence/formDraftRegistry';
	import { RURAL_MODES } from '$lib/shared/rules/modes.rules';
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
		budget?: 'operating' | 'capital';
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
		{
			label: 'Administrative Expenses',
			kind: 'finance',
			rowId: FINANCE_ROW_IDS.administrative,
			budget: 'operating'
		},
		{
			label: 'Operating Expenses',
			kind: 'finance',
			rowId: FINANCE_ROW_IDS.operating,
			budget: 'operating'
		},
		{
			label: 'Capital Expenses',
			kind: 'finance',
			rowId: FINANCE_ROW_IDS.capital,
			budget: 'capital'
		},
		{ label: 'Miles', kind: 'monthly', metric: 'miles' },
		{ label: 'Hours', kind: 'monthly', metric: 'hours' },
		{ label: 'Passenger Trips', kind: 'monthly', metric: 'trips' }
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
	const capabilities = $derived(
		loadCapabilities(type, year) ??
			((data as { overviewPrefill?: { selectedModes?: string[] } | null }).overviewPrefill ?? null)
	);
	const VITAL_ROWS = [
		'Fixed Route Weekly Passenger Trips/Hour',
		'Demand Response/Sub Weekly Passenger Trips/Hour',
		'Microtransit Weekly Passenger Trips/Hour',
		'Fixed Route Weekly Passenger Trips/Mile',
		'Demand Response/Sub Weekly Passenger Trips/Mile',
		'Microtransit Weekly Passenger Trips/Mile'
	] as const;

	function normalizeModeId(mode: string): string {
		return mode.trim().toLowerCase().replace(/-/g, '_');
	}
	const selectedModeColumns = $derived.by(() => {
		const activeModes = new Set(
			(capabilities?.selectedModes ?? RURAL_MODES.map((mode) => mode.id)).map(normalizeModeId)
		);
		return RURAL_MODES.map((mode, index) => ({
			id: mode.id,
			label: mode.label,
			serviceType: mode.id.replace(/_/g, ' ').toUpperCase(),
			index
		})).filter((mode) => activeModes.has(normalizeModeId(mode.id)));
	});

	const detailColumnWidth = $derived(
		selectedModeColumns.length > 0 ? 54 / (selectedModeColumns.length + 1) : 54
	);

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

	function financeCellValue(rowId: FinanceRowId, modeIndex: number, budget: 'operating' | 'capital') {
		const row = financeDraft[rowId] ?? [];
		const offset = budget === 'capital' ? 6 : 0;
		const value = row[offset + modeIndex];
		return typeof value === 'number' ? value : null;
	}

	function financeTotalValue(rowId: FinanceRowId, budget: 'operating' | 'capital') {
		let total = 0;
		let hasAny = false;
		for (const { index } of selectedModeColumns) {
			const value = financeCellValue(rowId, index, budget);
			if (typeof value === 'number') {
				total += value;
				hasAny = true;
			}
		}
		return hasAny ? total : null;
	}

	function selectedModeColumn(modeIndex: number) {
		return selectedModeColumns.find((mode) => mode.index === modeIndex) ?? null;
	}

	function monthlyModeValue(metric: 'hours' | 'miles' | 'trips', serviceType: string): number | null {
		const normalized = serviceType.trim().toUpperCase();
		let sum = 0;
		let hasAny = false;
		for (const row of remoteMonthlyRows) {
			if (row.serviceType.trim().toUpperCase() !== normalized) continue;
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

	function monthlyTotalValue(metric: 'hours' | 'miles' | 'trips') {
		let total = 0;
		let hasAny = false;
		for (const { serviceType } of selectedModeColumns) {
			const value = monthlyModeValue(metric, serviceType);
			if (typeof value === 'number') {
				total += value;
				hasAny = true;
			}
		}
		return hasAny ? total : null;
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

	function fmtSummaryCell(row: SummaryRow, modeIndex: number | 'total'): string {
		if (row.kind === 'finance') {
			const rowId = row.rowId ?? FINANCE_ROW_IDS.operating;
			const budget = row.budget ?? 'operating';
			const value =
				modeIndex === 'total' ? financeTotalValue(rowId, budget) : financeCellValue(rowId, modeIndex, budget);
			return fmtMoney(value);
		}

		const metric = row.metric ?? 'hours';
		const value =
			modeIndex === 'total'
				? monthlyTotalValue(metric)
				: monthlyModeValue(metric, selectedModeColumn(modeIndex)?.serviceType ?? '');
		return fmtNumber(value);
	}

	function fmtVitalCell(label: string, serviceType: string, modeIndex: number | 'total'): string {
		if (label.includes('Trips/Hour')) {
			const trips =
				modeIndex === 'total'
					? monthlyTotalValue('trips')
					: monthlyModeValue('trips', serviceType);
			const hours =
				modeIndex === 'total'
					? monthlyTotalValue('hours')
					: monthlyModeValue('hours', serviceType);
			return fmtRate(ratio(trips, hours));
		}

		if (label.includes('Trips/Mile')) {
			const trips =
				modeIndex === 'total'
					? monthlyTotalValue('trips')
					: monthlyModeValue('trips', serviceType);
			const miles =
				modeIndex === 'total'
					? monthlyTotalValue('miles')
					: monthlyModeValue('miles', serviceType);
			return fmtRate(ratio(trips, miles));
		}

		const operatingExpense =
			modeIndex === 'total'
				? financeTotalValue(FINANCE_ROW_IDS.operating, 'operating')
				: financeCellValue(FINANCE_ROW_IDS.operating, modeIndex, 'operating');
		const trips =
			modeIndex === 'total'
				? monthlyTotalValue('trips')
				: monthlyModeValue('trips', serviceType);
		return fmtMoney2(ratio(operatingExpense, trips));
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
						{#each selectedModeColumns as _mode}
							<col style={`width: ${detailColumnWidth}%`} />
						{/each}
						<col style={`width: ${detailColumnWidth}%`} />
					</colgroup>
					<thead>
						<tr class="bg-black text-white">
							<th class="border-r border-black px-3 py-1.5 text-left text-[1rem] font-semibold">Summary</th>
							{#each selectedModeColumns as mode}
								<th
									class="border-r border-black px-3 py-1.5 text-center text-[1rem] font-semibold leading-tight"
									title={mode.label}
								>
									{mode.serviceType}
								</th>
							{/each}
							<th class="px-3 py-1.5 text-center text-[1rem] font-semibold">Total</th>
						</tr>
					</thead>
					<tbody>
						{#each SUMMARY_ROWS as row}
							<tr class="border-b border-black/40">
								<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
									{row.label}
								</th>
								{#each selectedModeColumns as mode}
									<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
										{fmtSummaryCell(row, mode.index)}
									</td>
								{/each}
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
						{#each selectedModeColumns as _mode}
							<col style={`width: ${detailColumnWidth}%`} />
						{/each}
						<col style={`width: ${detailColumnWidth}%`} />
					</colgroup>
					<thead>
						<tr class="bg-black text-white">
							<th class="border-r border-black px-3 py-1.5 text-left text-[1rem] font-semibold">Vital Signs</th>
							{#each selectedModeColumns as mode}
								<th
									class="border-r border-black px-3 py-1.5 text-center text-[1rem] font-semibold leading-tight"
									title={mode.label}
								>
									{mode.serviceType}
								</th>
							{/each}
							<th class="px-3 py-1.5 text-center text-[1rem] font-semibold">Total</th>
						</tr>
					</thead>
					<tbody>
						{#each VITAL_ROWS as row}
							<tr class="border-b border-black/40">
								<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
									{row}
								</th>
								{#each selectedModeColumns as mode}
									<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
										{fmtVitalCell(row, mode.serviceType, mode.index)}
									</td>
								{/each}
								<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
									{fmtVitalCell(row, '', 'total')}
								</td>
							</tr>
						{/each}
						<tr class="border-b border-black/40">
							<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
								Operating Cost per Passenger Trips
							</th>
							{#each selectedModeColumns as mode}
								<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
									{fmtMoney2(
										ratio(
											financeCellValue(FINANCE_ROW_IDS.operating, mode.index, 'operating'),
											monthlyModeValue('trips', mode.serviceType)
										)
									)}
								</td>
							{/each}
							<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
								{fmtMoney2(
									ratio(financeTotalValue(FINANCE_ROW_IDS.operating, 'operating'), monthlyTotalValue('trips'))
								)}
							</td>
						</tr>
						<tr class="border-b border-black/40">
							<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
								Operating Cost per Hour
							</th>
							{#each selectedModeColumns as mode}
								<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
									{fmtMoney2(
										ratio(
											financeCellValue(FINANCE_ROW_IDS.operating, mode.index, 'operating'),
											monthlyModeValue('hours', mode.serviceType)
										)
									)}
								</td>
							{/each}
							<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
								{fmtMoney2(
									ratio(financeTotalValue(FINANCE_ROW_IDS.operating, 'operating'), monthlyTotalValue('hours'))
								)}
							</td>
						</tr>
						<tr class="border-b border-black/40">
							<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
								Operating Cost per Mile
							</th>
							{#each selectedModeColumns as mode}
								<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
									{fmtMoney2(
										ratio(
											financeCellValue(FINANCE_ROW_IDS.operating, mode.index, 'operating'),
											monthlyModeValue('miles', mode.serviceType)
										)
									)}
								</td>
							{/each}
							<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
								{fmtMoney2(
									ratio(financeTotalValue(FINANCE_ROW_IDS.operating, 'operating'), monthlyTotalValue('miles'))
								)}
							</td>
						</tr>
						<tr>
							<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
								Transit Trips per Driver FTE
							</th>
							{#each selectedModeColumns as _mode}
								<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">—</td>
							{/each}
							<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
								{fmtRate(ratio(monthlyTotalValue('trips'), driverFte()))}
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
								How much money was in the Operating Reserve at the end of the year?
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
							After reviewing the system's vital signs, what has the system been doing well?
						</div>
						<textarea
							class="min-h-[4.5rem] w-full rounded-[2px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--theme-color)_18%,white)] px-3 py-2 text-[15px] text-black/80 focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:text-white"
							bind:value={completion.surplusExplain}
						></textarea>
					</div>

					<div class="grid gap-2">
						<div class="text-[15px] font-semibold text-[var(--theme-color)] underline decoration-[var(--theme-color)] decoration-1 underline-offset-2">
							After reviewing the system's vital signs, what should the system do to improve it's performance?
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

					<!-- <div class="space-y-1">
						<div class="text-[15px] font-semibold text-black">ITRE Comments about the data</div>
						<div class="min-h-[4.5rem] w-full border border-[var(--border)] bg-white px-3 py-2 text-[15px] text-black/70 dark:border-zinc-700 dark:bg-zinc-950">
							Not currently captured in the database.
						</div>
					</div> -->

					<!-- <div class="text-xs font-medium text-red-600">
						Upload the original excel file and scanned version of the signed completion tab to partner connect
					</div> -->
				</div>
			</div>
		</div>
	{/if}
</section>
