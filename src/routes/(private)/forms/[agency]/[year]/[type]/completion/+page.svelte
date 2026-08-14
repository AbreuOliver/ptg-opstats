<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onDestroy, onMount } from 'svelte';
	import {
		getFormDraftSnapshot,
		loadResolvedFormDraftSnapshot,
		setFormDraftSnapshot
	} from '$lib/features/forms/persistence/formDraftRegistry';
	import {
		capabilitiesRevision,
		loadCapabilities
	} from '$lib/features/forms/shared/stores/capabilities.store';
	import { buildWeekSatSunSchema } from '$lib/features/forms/grids/weekSatSun/rules/gridSchema.rules';
	import { buildGridValuesFromSnapshot } from '$lib/features/forms/grids/weekSatSun/rules/rdsMonthlyMapping.rules';
	import { gridDraftKey } from '$lib/features/forms/grids/weekSatSun/stores/gridDraft.store';
	import ReportCertificationSection from '$lib/components/forms/ReportCertificationSection.svelte';
	import { createColConfig, getFiscalMonths, recalcAll } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.logic';
	import type { GridValues, RowDef } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.types';
	import type { Capabilities, DaySlug } from '$lib/features/forms/shared/types/capabilities.types';
	import type { RdsDaySnapshot } from '$lib/features/forms/grids/weekSatSun/types/rdsSnapshot.types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type DraftStore = Record<string, (number | null)[]>;
	type MonthlyRow = {
		month: number;
		dayType: string;
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
	type CompletionColumn = {
		id: 'do' | 'pt';
		label: 'DO' | 'PT';
		serviceTypes: string[];
	};
	type RuralModeId = 'dr_do' | 'dr_pt' | 'mb_do' | 'mb_pt' | 'mt_do' | 'mt_pt';
	type VitalWeeklyModeSpec = {
		do: { modeId: RuralModeId; serviceType: string };
		pt: { modeId: RuralModeId; serviceType: string };
	};

	type FinanceRowId = (typeof FINANCE_ROW_IDS)[keyof typeof FINANCE_ROW_IDS];
	type RuralFinanceSourceRows = Record<FinanceRowId, readonly string[]>;

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
	const RURAL_COMPLETION_COLUMNS: CompletionColumn[] = [
		{
			id: 'do',
			label: 'DO',
			serviceTypes: ['DR DO', 'MB DO', 'MT DO']
		},
		{
			id: 'pt',
			label: 'PT',
			serviceTypes: ['DR PT', 'MB PT', 'MT PT']
		}
	];
	const RURAL_COMPLETION_SERVICE_TYPES = {
		do: RURAL_COMPLETION_COLUMNS[0].serviceTypes,
		pt: RURAL_COMPLETION_COLUMNS[1].serviceTypes
	} as const;
	const RURAL_COMPLETION_FINANCE_GROUPS = {
		do: RURAL_COMPLETION_SERVICE_TYPES.do,
		pt: RURAL_COMPLETION_SERVICE_TYPES.pt,
		total: ['DR DO', 'DR PT', 'MB DO', 'MB PT', 'MT DO', 'MT PT']
	} as const;
	const WEEKLY_TOTALS_ROW_IDS = {
		hours: 'transit_totals_hours',
		miles: 'transit_totals_miles',
		trips: 'transit_totals_all_modes'
	} as const;
	const WEEKLY_TOTALS_MODE_IDS_BY_SERVICE_TYPE: Record<string, RuralModeId> = {
		'DR DO': 'dr_do',
		'DR PT': 'dr_pt',
		'MB DO': 'mb_do',
		'MB PT': 'mb_pt',
		'MT DO': 'mt_do',
		'MT PT': 'mt_pt'
	} as const;
	const VITAL_WEEKLY_MODE_SPECS: Record<string, VitalWeeklyModeSpec> = {
		'Fixed Route': {
			do: { modeId: 'mb_do', serviceType: 'MB DO' },
			pt: { modeId: 'mb_pt', serviceType: 'MB PT' }
		},
		'Demand Response/Sub': {
			do: { modeId: 'dr_do', serviceType: 'DR DO' },
			pt: { modeId: 'dr_pt', serviceType: 'DR PT' }
		},
		Microtransit: {
			do: { modeId: 'mt_do', serviceType: 'MT DO' },
			pt: { modeId: 'mt_pt', serviceType: 'MT PT' }
		}
	} as const;
	const RURAL_FINANCE_SOURCE_ROWS: RuralFinanceSourceRows = {
		total_administrative_expenses: [
			'personal_salaries_fringes',
			'advertising_promotion',
			'employee_development',
			'vehicle_insurance_premiums',
			'admin_indirect_services',
			'admin_ctp_codes',
			'other_admin_expense'
		],
		total_operating_expenses: [
			'driver_salaries_fringes',
			'other_operating_staff',
			'mechanics_salaries_fringes',
			'operating_indirect_services',
			'fuel',
			'vehicle_maintenance',
			'insurance_deductible',
			'disposal_of_vehicle',
			'management_operation_services',
			'volunteer_reimbursement',
			'other_transit_provider_services',
			'other_operating_expense'
		],
		total_capital_expenses: [
			'capital_purchases',
			'body_work',
			'facility_renovation',
			'advanced_technology_purchases',
			'other_capital_expense'
		]
	} as const;

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
	const remoteOverviewPrefill = $derived(
		(data as { overviewPrefill?: Capabilities | null }).overviewPrefill ?? null
	);
	const remoteDaySnapshots = $derived(
		(data as { rdsSnapshots?: Partial<Record<DaySlug, RdsDaySnapshot | null>> | null }).rdsSnapshots ??
			null
	);
	const certification = $derived(
		(data as {
			certification?: {
				reportHash: string | null;
				signatures: unknown[];
				canSign: boolean;
				currentUser: { userId: number; email: string; displayName: string } | null;
			} | null;
		}).certification ?? null
	);
	const VITAL_ROWS = [
		'Fixed Route Weekly Passenger Trips/Hour',
		'Demand Response/Sub Weekly Passenger Trips/Hour',
		'Microtransit Weekly Passenger Trips/Hour',
		'Fixed Route Weekly Passenger Trips/Mile',
		'Demand Response/Sub Weekly Passenger Trips/Mile',
		'Microtransit Weekly Passenger Trips/Mile'
	] as const;
	const colConfig = createColConfig(getFiscalMonths().length);
	const { COL_MONTHS, COL_YTD, TOTAL_COLS } = colConfig;
	const storedCapabilities = $derived.by<Capabilities | null>(() => {
		$capabilitiesRevision;
		return browser ? loadCapabilities(type, year) : null;
	});
	const effectiveCapabilities = $derived<Capabilities | null>(
		storedCapabilities ?? remoteOverviewPrefill
	);
	const debugCompletionCalculations = browser && import.meta.env.DEV;

	const detailColumnWidth = $derived(54 / (RURAL_COMPLETION_COLUMNS.length + 1));

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

	let completion = $state<CompletionDraft>(normalizeCompletionDraft(remoteCompletionDraft ?? emptyCompletionDraft()));
	let financeDraft = $state<DraftStore>(normalizeFinanceDraft(remoteFinanceDraft ?? {}));
	let annualStatistics = $state<AnnualStatisticsDraft>(
		normalizeAnnualStatisticsDraft(remoteAnnualStatisticsDraft)
	);
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
		financeDraft = browser
			? (loadResolvedFormDraftSnapshot(
					financeKey,
					remoteFinanceDraft ?? {},
					normalizeFinanceDraft
				) as DraftStore)
			: normalizeFinanceDraft(remoteFinanceDraft ?? {});
	}

	function loadAnnualStatisticsDraft() {
		annualStatistics = normalizeAnnualStatisticsDraft(remoteAnnualStatisticsDraft);
	}

	function loadCompletionDraft() {
		completion = browser
			? (loadResolvedFormDraftSnapshot(
					completionKey,
					remoteCompletionDraft ?? emptyCompletionDraft(),
					normalizeCompletionDraft
				) as CompletionDraft)
			: normalizeCompletionDraft(remoteCompletionDraft ?? emptyCompletionDraft());
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
		void financeKey;
		void remoteFinanceDraft;
		loadFinanceDraft();
	});

	$effect(() => {
		if (!browser) return;
		void remoteAnnualStatisticsDraft;
		loadAnnualStatisticsDraft();
	});

	$effect(() => {
		if (!browser) return;
		void completionKey;
		void remoteCompletionDraft;
		loadCompletionDraft();
	});

	$effect(() => {
		if (!browser) return;
		void completion;
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

	function logCompletionCalculation(label: string, payload: unknown) {
		if (!debugCompletionCalculations) return;
		console.log(`[rural completion] ${label}`, payload);
	}

	function financeSourceRowValue(
		rowId: string,
		modeIndex: number,
		budget: 'operating' | 'capital'
	): number | null {
		const row = financeDraft[rowId] ?? [];
		const offset = budget === 'capital' ? 6 : 0;
		const value = row[offset + modeIndex];
		return typeof value === 'number' ? value : null;
	}

	function financeSourceGroupValue(
		rowIds: readonly string[],
		budget: 'operating' | 'capital',
		serviceTypes: readonly string[]
	): number | null {
		let total = 0;
		let hasAny = false;
		for (const serviceType of serviceTypes) {
			const modeIndex = serviceType === 'DR DO'
				? 0
				: serviceType === 'DR PT'
					? 1
					: serviceType === 'MB DO'
						? 2
						: serviceType === 'MB PT'
							? 3
							: serviceType === 'MT DO'
								? 4
								: 5;
			for (const rowId of rowIds) {
				const value = financeSourceRowValue(rowId, modeIndex, budget);
				if (typeof value === 'number') {
					total += value;
					hasAny = true;
				}
			}
		}
		const result = hasAny ? total : null;
		logCompletionCalculation('financeSourceGroupValue', {
			budget,
			rowIds,
			serviceTypes,
			result
		});
		return result;
	}

	function financeTotalValue(rowId: FinanceRowId, budget: 'operating' | 'capital') {
		const sourceRows = RURAL_FINANCE_SOURCE_ROWS[rowId] ?? [];
		return financeSourceGroupValue(sourceRows, budget, RURAL_COMPLETION_FINANCE_GROUPS.total);
	}

	function financeGroupValue(rowId: FinanceRowId, budget: 'operating' | 'capital', serviceTypes: string[]) {
		const sourceRows = RURAL_FINANCE_SOURCE_ROWS[rowId] ?? [];
		return financeSourceGroupValue(sourceRows, budget, serviceTypes);
	}

	function financeDoValue(rowId: FinanceRowId, budget: 'operating' | 'capital') {
		return financeGroupValue(rowId, budget, RURAL_COMPLETION_FINANCE_GROUPS.do);
	}

	function financePtValue(rowId: FinanceRowId, budget: 'operating' | 'capital') {
		return financeGroupValue(rowId, budget, RURAL_COMPLETION_FINANCE_GROUPS.pt);
	}

	function toDraftByRowId(rows: RowDef[], values: GridValues): Record<string, (number | null)[]> {
		const draft: Record<string, (number | null)[]> = {};
		for (let rowIndex = 0; rowIndex < Math.min(rows.length, values.length); rowIndex++) {
			draft[rows[rowIndex].id] = Array.isArray(values[rowIndex])
				? (values[rowIndex].slice() as (number | null)[])
				: [];
		}
		return draft;
	}

	function buildMonthlyRowsFromGridDraft(args: {
		daySlug: DaySlug;
		draft: Record<string, (number | null)[]>;
	}): MonthlyRow[] {
		const dayTypeBySlug: Record<DaySlug, string> = {
			weekday: 'Wk',
			saturday: 'SA',
			sunday: 'Su'
		};
		const serviceTypeByMode: Record<RuralModeId, string> = {
			dr_do: 'DR DO',
			dr_pt: 'DR PT',
			mb_do: 'MB DO',
			mb_pt: 'MB PT',
			mt_do: 'MT DO',
			mt_pt: 'MT PT'
		};
		const monthByColumn = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
		const monthlyFieldBySuffix: Record<
			string,
			keyof Pick<
				MonthlyRow,
				'operatingDays' | 'hours' | 'miles' | 'passTripsNonCon' | 'passTripsMedCon' | 'passTripsNonMedCon' | 'passTripsBroMedCon'
			>
		> = {
			hours: 'hours',
			vehicle_revenue_hours: 'hours',
			miles: 'miles',
			vehicle_revenue_miles: 'miles',
			pt_nc: 'passTripsNonCon',
			total_unlinked_passenger_trips: 'passTripsNonCon',
			medicaid: 'passTripsMedCon',
			nonmedicaid: 'passTripsNonMedCon',
			brokered_medicaid: 'passTripsBroMedCon'
		};
		const rowsByKey = new Map<string, MonthlyRow>();

		function getRow(month: number, serviceType: string): MonthlyRow {
			const key = `${month}:${dayTypeBySlug[args.daySlug]}:${serviceType}`;
			const existing = rowsByKey.get(key);
			if (existing) return existing;
			const next: MonthlyRow = {
				month,
				dayType: dayTypeBySlug[args.daySlug],
				serviceType,
				operatingDays: null,
				hours: null,
				miles: null,
				passTripsNonCon: null,
				passTripsMedCon: null,
				passTripsNonMedCon: null,
				passTripsBroMedCon: null
			};
			rowsByKey.set(key, next);
			return next;
		}

		for (const [rowId, rawValues] of Object.entries(args.draft)) {
			if (!Array.isArray(rawValues)) continue;
			if (rowId.endsWith('__section') || rowId.startsWith('transit_totals_')) continue;

			if (rowId === 'operating_days') {
				for (let columnIndex = 0; columnIndex < monthByColumn.length; columnIndex++) {
					const row = getRow(monthByColumn[columnIndex], 'ALL');
					row.operatingDays = typeof rawValues[columnIndex] === 'number' ? rawValues[columnIndex] : null;
				}
				continue;
			}

			const separatorIndex = rowId.indexOf('__');
			if (separatorIndex === -1) continue;
			const mode = rowId.slice(0, separatorIndex) as RuralModeId;
			const suffix = rowId.slice(separatorIndex + 2);
			const serviceType = serviceTypeByMode[mode];
			const field = monthlyFieldBySuffix[suffix];
			if (!serviceType || !field) continue;

			for (let columnIndex = 0; columnIndex < monthByColumn.length; columnIndex++) {
				const row = getRow(monthByColumn[columnIndex], serviceType);
				row[field] = typeof rawValues[columnIndex] === 'number' ? rawValues[columnIndex] : null;
			}
		}

		return Array.from(rowsByKey.values());
	}

	function loadLiveGridDraftSnapshot(
		rows: RowDef[],
		colCount: number,
		snapshot: unknown
	): GridValues | null {
		if (!snapshot || typeof snapshot !== 'object') return null;

		const empty: GridValues = Array.from({ length: rows.length }, () =>
			Array.from({ length: colCount }, () => null)
		);

		if (Array.isArray(snapshot)) {
			for (let rowIndex = 0; rowIndex < Math.min(rows.length, snapshot.length); rowIndex++) {
				const row = snapshot[rowIndex];
				if (!Array.isArray(row)) continue;
				empty[rowIndex] = Array.from({ length: colCount }, (_, colIndex) => {
					const value = row[colIndex];
					return typeof value === 'number' || value === null ? value : null;
				});
			}
			return empty;
		}

		const byRowId = snapshot as Record<string, unknown>;
		for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
			const rowValues = byRowId[rows[rowIndex].id];
			if (!Array.isArray(rowValues)) continue;
			empty[rowIndex] = Array.from({ length: colCount }, (_, colIndex) => {
				const value = rowValues[colIndex];
				return typeof value === 'number' || value === null ? value : null;
			});
		}
		return empty;
	}

	const liveMonthlyRows = $derived.by<MonthlyRow[]>(() => {
		$capabilitiesRevision;
		if (!browser) return remoteMonthlyRows;
		const capabilities = effectiveCapabilities;
		if (!capabilities) return remoteMonthlyRows;

		const rowsByKey = new Map<string, MonthlyRow>();
		for (const row of remoteMonthlyRows) {
			rowsByKey.set(`${row.month}:${row.dayType}:${row.serviceType}`, { ...row });
		}

		for (const slug of ['weekday', 'saturday', 'sunday'] as DaySlug[]) {
			if (capabilities.days[slug]?.offered === false) continue;
			const dayRows = buildWeekSatSunSchema({ type, slug, capabilities });
			const snapshot = remoteDaySnapshots?.[slug] ?? null;
			const remoteValues = buildGridValuesFromSnapshot(type, dayRows, TOTAL_COLS, snapshot);
			const draftValues =
				loadLiveGridDraftSnapshot(dayRows, TOTAL_COLS, getFormDraftSnapshot(gridDraftKey(type, year, slug))) ??
				remoteValues;
			const draft = toDraftByRowId(dayRows, draftValues);
			for (const row of buildMonthlyRowsFromGridDraft({ daySlug: slug, draft })) {
				rowsByKey.set(`${row.month}:${row.dayType}:${row.serviceType}`, row);
			}
		}

		return Array.from(rowsByKey.values());
	});

	const liveWeeklyTotalsGrid = $derived.by<{
		rows: RowDef[];
		values: GridValues;
	} | null>(() => {
		$capabilitiesRevision;
		if (!browser) return null;
		const capabilities = effectiveCapabilities;
		if (!capabilities) return null;

		const rows = buildWeekSatSunSchema({ type, slug: 'weekday', capabilities });
		const rowIndexById = new Map(rows.map((row, index) => [row.id, index]));
		const dayValuesBySlug: Partial<Record<DaySlug, { rows: RowDef[]; values: GridValues }>> = {};

		for (const slug of ['weekday', 'saturday', 'sunday'] as DaySlug[]) {
			if (capabilities.days[slug]?.offered === false) continue;
			const dayRows = buildWeekSatSunSchema({ type, slug, capabilities });
			const snapshot = remoteDaySnapshots?.[slug] ?? null;
			const remoteValues = buildGridValuesFromSnapshot(type, dayRows, TOTAL_COLS, snapshot);
			const draftValues =
				loadLiveGridDraftSnapshot(dayRows, TOTAL_COLS, getFormDraftSnapshot(gridDraftKey(type, year, slug))) ??
				remoteValues;
			dayValuesBySlug[slug] = { rows: dayRows, values: draftValues };
		}

		const totals: GridValues = Array.from({ length: rows.length }, () =>
			Array.from({ length: TOTAL_COLS }, () => null)
		);

		for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
			const targetRow = rows[rowIndex];
			if (targetRow?.type !== 'number') continue;

			for (let monthIndex = 0; monthIndex < COL_MONTHS; monthIndex++) {
				let sum = 0;
				let hasAny = false;

				for (const slug of ['weekday', 'saturday', 'sunday'] as DaySlug[]) {
					const day = dayValuesBySlug[slug];
					if (!day) continue;
					const sourceRowIndex = day.rows.findIndex((row) => row.id === targetRow.id);
					if (sourceRowIndex === -1) continue;
					const value = day.values[sourceRowIndex]?.[monthIndex];
					if (typeof value === 'number') {
						sum += value;
						hasAny = true;
					}
				}

				totals[rowIndex][monthIndex] = hasAny ? sum : null;
			}
		}

		recalcAll(rows, totals, colConfig, rowIndexById);
		return { rows, values: totals };
	});

	const rawWeeklyTotalsGrid = $derived.by<{
		rows: RowDef[];
		values: GridValues;
	} | null>(() => {
		$capabilitiesRevision;
		if (!browser) return null;
		const capabilities = effectiveCapabilities;
		if (!capabilities) return null;

		const rows = buildWeekSatSunSchema({ type, slug: 'weekday', capabilities });
		const rowIndexById = new Map(rows.map((row, index) => [row.id, index]));
		const dayValuesBySlug: Partial<Record<DaySlug, { rows: RowDef[]; values: GridValues }>> = {};

		for (const slug of ['weekday', 'saturday', 'sunday'] as DaySlug[]) {
			if (capabilities.days[slug]?.offered === false) continue;
			const dayRows = buildWeekSatSunSchema({ type, slug, capabilities });
			const snapshot = remoteDaySnapshots?.[slug] ?? null;
			const remoteValues = buildGridValuesFromSnapshot(type, dayRows, TOTAL_COLS, snapshot);
			const draftValues =
				loadLiveGridDraftSnapshot(dayRows, TOTAL_COLS, getFormDraftSnapshot(gridDraftKey(type, year, slug))) ??
				remoteValues;
			dayValuesBySlug[slug] = { rows: dayRows, values: draftValues };
		}

		const totals: GridValues = Array.from({ length: rows.length }, () =>
			Array.from({ length: TOTAL_COLS }, () => null)
		);

		for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
			const targetRow = rows[rowIndex];
			if (targetRow?.type !== 'number') continue;

			for (let monthIndex = 0; monthIndex < COL_MONTHS; monthIndex++) {
				let sum = 0;
				let hasAny = false;

				for (const slug of ['weekday', 'saturday', 'sunday'] as DaySlug[]) {
					const day = dayValuesBySlug[slug];
					if (!day) continue;
					const sourceRowIndex = day.rows.findIndex((row) => row.id === targetRow.id);
					if (sourceRowIndex === -1) continue;
					const value = day.values[sourceRowIndex]?.[monthIndex];
					if (typeof value === 'number') {
						sum += value;
						hasAny = true;
					}
				}

				totals[rowIndex][monthIndex] = hasAny ? sum : null;
			}
		}

		recalcAll(rows, totals, colConfig, rowIndexById);
		return { rows, values: totals };
	});

	function monthlyGroupValue(metric: 'hours' | 'miles' | 'trips', serviceTypes: string[]): number | null {
		const normalizedServiceTypes = new Set(serviceTypes.map((serviceType) => serviceType.trim().toUpperCase()));
		let sum = 0;
		let hasAny = false;
		for (const row of liveMonthlyRows) {
			if (!normalizedServiceTypes.has(row.serviceType.trim().toUpperCase())) continue;
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
		const result = hasAny ? sum : null;
		logCompletionCalculation('monthlyGroupValue', { metric, serviceTypes, result });
		return result;
	}

	function monthlyTotalValue(metric: 'hours' | 'miles' | 'trips') {
		let total = 0;
		let hasAny = false;
		for (const column of RURAL_COMPLETION_COLUMNS) {
			const value = monthlyGroupValue(metric, column.serviceTypes);
			if (typeof value === 'number') {
				total += value;
				hasAny = true;
			}
		}
		const result = hasAny ? total : null;
		logCompletionCalculation('monthlyTotalValue', { metric, result });
		return result;
	}

	function weeklyTripCount(serviceTypes: readonly string[]): number | null {
		const grid = rawWeeklyTotalsGrid;
		if (!grid) return null;

		let total = 0;
		let hasAny = false;
		for (const serviceType of serviceTypes) {
			const modeId = WEEKLY_TOTALS_MODE_IDS_BY_SERVICE_TYPE[serviceType.trim().toUpperCase()];
			if (!modeId) continue;
			const rowId = `${modeId}__total_trips`;
			const rowIndex = grid.rows.findIndex((row) => row.id === rowId);
			if (rowIndex === -1) continue;
			const value = grid.values[rowIndex]?.[COL_YTD];
			if (typeof value === 'number') {
				total += value;
				hasAny = true;
			}
		}

		const result = hasAny ? total : null;
		logCompletionCalculation('weeklyTripCount', { serviceTypes, result });
		return result;
	}

	function weeklySummaryValue(rowId: keyof typeof WEEKLY_TOTALS_ROW_IDS): number | null {
		const grid = rawWeeklyTotalsGrid;
		if (!grid) return null;
		const targetRowId = WEEKLY_TOTALS_ROW_IDS[rowId];
		const rowIndex = grid.rows.findIndex((row) => row.id === targetRowId);
		if (rowIndex === -1) return null;
		const value = grid.values[rowIndex]?.[COL_YTD];
		const result = typeof value === 'number' ? value : null;
		logCompletionCalculation('weeklySummaryValue', { rowId, result });
		return result;
	}

	function isRuralModeOffered(modeId: RuralModeId, serviceType: string): boolean {
		const selectedModes = effectiveCapabilities?.selectedModes;
		if (Array.isArray(selectedModes)) {
			return selectedModes.includes(modeId);
		}

		const normalizedServiceType = serviceType.trim().toUpperCase();
		return liveMonthlyRows.some((row) => row.serviceType.trim().toUpperCase() === normalizedServiceType);
	}

	function weeklyVitalServiceTypes(
		label: string,
		columnId: 'do' | 'pt' | 'total'
	): { serviceTypes: string[]; offered: boolean } | null {
		const modeLabel = label.startsWith('Fixed Route')
			? 'Fixed Route'
			: label.startsWith('Demand Response/Sub')
				? 'Demand Response/Sub'
				: label.startsWith('Microtransit')
					? 'Microtransit'
					: null;
		if (!modeLabel) return null;

		const spec = VITAL_WEEKLY_MODE_SPECS[modeLabel];
		const serviceTypes: string[] = [];

		if (columnId === 'do' || columnId === 'total') {
			if (isRuralModeOffered(spec.do.modeId, spec.do.serviceType)) {
				serviceTypes.push(spec.do.serviceType);
			}
		}
		if (columnId === 'pt' || columnId === 'total') {
			if (isRuralModeOffered(spec.pt.modeId, spec.pt.serviceType)) {
				serviceTypes.push(spec.pt.serviceType);
			}
		}

		return { serviceTypes, offered: serviceTypes.length > 0 };
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
		const result = hours / 2080;
		logCompletionCalculation('driverFte', {
			ftPayHours: annualStatistics.employees.driver.ftPayHours,
			ptPayHours: annualStatistics.employees.driver.ptPayHours,
			hours,
			result
		});
		return result;
	}

	function ratio(numerator: number | null, denominator: number | null): number | null {
		if (numerator == null && denominator == null) return null;
		if (!denominator) return 0;
		return (numerator ?? 0) / denominator;
	}

	function fmtMoney(value: number | null): string {
		return value == null ? '—' : currency0.format(value);
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

	function fmtSummaryCell(row: SummaryRow, columnId: 'do' | 'pt' | 'total'): string {
		if (row.kind === 'finance') {
			const rowId = row.rowId ?? FINANCE_ROW_IDS.operating;
			const budget = row.budget ?? 'operating';
			const value =
				columnId === 'total'
					? financeTotalValue(rowId, budget)
					: columnId === 'do'
						? financeDoValue(rowId, budget)
						: financePtValue(rowId, budget);
			const result = fmtMoney(value ?? 0);
			logCompletionCalculation('summary.finance', {
				label: row.label,
				columnId,
				rowId,
				budget,
				value,
				result
			});
			return result;
		}

		const metric = row.metric ?? 'hours';
		const value =
			metric === 'trips'
				? columnId === 'pt'
					? 0
					: weeklySummaryValue('trips')
				: metric === 'hours'
					? columnId === 'pt'
						? 0
						: weeklySummaryValue('hours')
					: metric === 'miles'
						? columnId === 'pt'
							? 0
							: weeklySummaryValue('miles')
						: columnId === 'total'
							? monthlyTotalValue(metric)
							: monthlyGroupValue(metric, RURAL_COMPLETION_COLUMNS[columnId === 'do' ? 0 : 1].serviceTypes);
		const result = fmtNumber(value ?? 0);
		logCompletionCalculation('summary.monthly', { label: row.label, columnId, metric, value, result });
		return result;
	}

	function fmtVitalCell(label: string, serviceTypes: string[], modeIndex: number | 'total'): string {
		if (label.includes('Trips/Hour')) {
			const weekly = weeklyVitalServiceTypes(
				label,
				modeIndex === 'total' ? 'total' : modeIndex === 0 ? 'do' : 'pt'
			);
			if (weekly) {
				if (!weekly.offered) return '0.00';
				const trips = weeklyTripCount(weekly.serviceTypes);
				const hours = monthlyGroupValue('hours', weekly.serviceTypes);
				const resultValue = ratio(trips ?? 0, hours ?? 0);
				const result = fmtRate(resultValue);
				logCompletionCalculation('vital.tripsPerHour', {
					label,
					columnId: modeIndex === 'total' ? 'total' : modeIndex === 0 ? 'do' : 'pt',
					serviceTypes: weekly.serviceTypes,
					trips,
					hours,
					resultValue,
					result
				});
				return result;
			}
			const trips =
				modeIndex === 'total'
					? weeklyTripCount(RURAL_COMPLETION_FINANCE_GROUPS.total)
					: weeklyTripCount(serviceTypes);
			const hours =
				modeIndex === 'total'
					? monthlyTotalValue('hours')
					: monthlyGroupValue('hours', serviceTypes);
			const resultValue = ratio(trips, hours);
			const result = fmtRate(resultValue);
			logCompletionCalculation('vital.tripsPerHour', {
				label,
				columnId: modeIndex === 'total' ? 'total' : modeIndex === 0 ? 'do' : 'pt',
				serviceTypes,
				trips,
				hours,
				resultValue,
				result
			});
			return result;
		}

		if (label.includes('Trips/Mile')) {
			const weekly = weeklyVitalServiceTypes(
				label,
				modeIndex === 'total' ? 'total' : modeIndex === 0 ? 'do' : 'pt'
			);
			if (weekly) {
				if (!weekly.offered) return '0.00';
				const trips = weeklyTripCount(weekly.serviceTypes);
				const miles = monthlyGroupValue('miles', weekly.serviceTypes);
				const resultValue = ratio(trips ?? 0, miles ?? 0);
				const result = fmtRate(resultValue);
				logCompletionCalculation('vital.tripsPerMile', {
					label,
					columnId: modeIndex === 'total' ? 'total' : modeIndex === 0 ? 'do' : 'pt',
					serviceTypes: weekly.serviceTypes,
					trips,
					miles,
					resultValue,
					result
				});
				return result;
			}
			const trips =
				modeIndex === 'total'
					? weeklyTripCount(RURAL_COMPLETION_FINANCE_GROUPS.total)
					: weeklyTripCount(serviceTypes);
			const miles =
				modeIndex === 'total'
					? monthlyTotalValue('miles')
					: monthlyGroupValue('miles', serviceTypes);
			const resultValue = ratio(trips, miles);
			const result = fmtRate(resultValue);
			logCompletionCalculation('vital.tripsPerMile', {
				label,
				columnId: modeIndex === 'total' ? 'total' : modeIndex === 0 ? 'do' : 'pt',
				serviceTypes,
				trips,
				miles,
				resultValue,
				result
			});
			return result;
		}

		const operatingExpense =
			modeIndex === 'total'
				? financeTotalValue(FINANCE_ROW_IDS.operating, 'operating')
				: financeGroupValue(
						FINANCE_ROW_IDS.operating,
						'operating',
						serviceTypes
					);
		const trips =
			modeIndex === 'total'
				? weeklyTripCount(RURAL_COMPLETION_FINANCE_GROUPS.total)
				: weeklyTripCount(serviceTypes);
		const resultValue = ratio(operatingExpense ?? 0, trips ?? 0);
		const result = fmtMoney2(resultValue);
		logCompletionCalculation('vital.operatingCostPerTrip', {
			label,
			columnId: modeIndex === 'total' ? 'total' : modeIndex === 0 ? 'do' : 'pt',
			serviceTypes,
			operatingExpense,
			trips,
			resultValue,
			result
		});
		return result;
	}

	function transitTripsPerDriverFte(columnId: 'do' | 'pt' | 'total'): number | null {
		const serviceTypes =
			columnId === 'do'
				? RURAL_COMPLETION_COLUMNS[0].serviceTypes
				: columnId === 'pt'
					? RURAL_COMPLETION_COLUMNS[1].serviceTypes
					: RURAL_COMPLETION_FINANCE_GROUPS.total;
		const trips = weeklyTripCount(serviceTypes) ?? 0;
		const fte = driverFte();
		const result = ratio(trips, fte);
		logCompletionCalculation('vital.transitTripsPerDriverFte', {
			columnId,
			serviceTypes,
			trips,
			driverFte: fte,
			result
		});
		return result;
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
						{#each RURAL_COMPLETION_COLUMNS as column}
							<col data-mode={column.id} style={`width: ${detailColumnWidth}%`} />
						{/each}
						<col style={`width: ${detailColumnWidth}%`} />
					</colgroup>
					<thead>
						<tr class="bg-black text-white">
							<th class="border-r border-black px-3 py-1.5 text-left text-[1rem] font-semibold">Summary</th>
							{#each RURAL_COMPLETION_COLUMNS as column}
								<th
									class="border-r border-black px-3 py-1.5 text-center text-[1rem] font-semibold leading-tight"
									title={column.label}
								>
									{column.label}
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
								{#each RURAL_COMPLETION_COLUMNS as column}
									<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
										{fmtSummaryCell(row, column.id)}
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
						{#each RURAL_COMPLETION_COLUMNS as column}
							<col data-mode={column.id} style={`width: ${detailColumnWidth}%`} />
						{/each}
						<col style={`width: ${detailColumnWidth}%`} />
					</colgroup>
					<thead>
						<tr class="bg-black text-white">
							<th class="border-r border-black px-3 py-1.5 text-left text-[1rem] font-semibold">Vital Signs</th>
							{#each RURAL_COMPLETION_COLUMNS as column}
								<th
									class="border-r border-black px-3 py-1.5 text-center text-[1rem] font-semibold leading-tight"
									title={column.label}
								>
									{column.label}
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
								{#each RURAL_COMPLETION_COLUMNS as column}
									<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
										{fmtVitalCell(row, column.serviceTypes, column.id === 'do' ? 0 : 1)}
									</td>
								{/each}
								<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
									{fmtVitalCell(row, [], 'total')}
								</td>
							</tr>
						{/each}
						<tr class="border-b border-black/40">
							<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
								Operating Cost per Passenger Trips
							</th>
							{#each RURAL_COMPLETION_COLUMNS as column}
								<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
									{fmtMoney2(
										ratio(
											financeGroupValue(FINANCE_ROW_IDS.operating, 'operating', column.serviceTypes) ?? 0,
											monthlyGroupValue('trips', column.serviceTypes) ?? 0
										)
									)}
								</td>
							{/each}
							<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
								{fmtMoney2(
									ratio(
										financeTotalValue(FINANCE_ROW_IDS.operating, 'operating') ?? 0,
										weeklyTripCount(RURAL_COMPLETION_FINANCE_GROUPS.total) ?? 0
									)
								)}
							</td>
						</tr>
						<tr class="border-b border-black/40">
							<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
								Operating Cost per Hour
							</th>
							{#each RURAL_COMPLETION_COLUMNS as column}
								<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
									{fmtMoney2(
										ratio(
											financeGroupValue(FINANCE_ROW_IDS.operating, 'operating', column.serviceTypes) ?? 0,
											monthlyGroupValue('hours', column.serviceTypes) ?? 0
										)
									)}
								</td>
							{/each}
							<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
								{fmtMoney2(
									ratio(
										financeTotalValue(FINANCE_ROW_IDS.operating, 'operating') ?? 0,
										monthlyTotalValue('hours') ?? 0
									)
								)}
							</td>
						</tr>
						<tr class="border-b border-black/40">
							<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
								Operating Cost per Mile
							</th>
							{#each RURAL_COMPLETION_COLUMNS as column}
								<td class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
									{fmtMoney2(
										ratio(
											financeGroupValue(FINANCE_ROW_IDS.operating, 'operating', column.serviceTypes) ?? 0,
											monthlyGroupValue('miles', column.serviceTypes) ?? 0
										)
									)}
								</td>
							{/each}
							<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
								{fmtMoney2(
									ratio(
										financeTotalValue(FINANCE_ROW_IDS.operating, 'operating') ?? 0,
										monthlyTotalValue('miles') ?? 0
									)
								)}
							</td>
						</tr>
						<tr>
							<th class="border-r border-black/40 px-3 py-1 text-right text-[15px] font-normal text-black/90">
								Transit Trips per Driver FTE
							</th>
							{#each RURAL_COMPLETION_COLUMNS as column}
								<td data-mode={column.id} class="border-r border-black/40 px-3 py-1 text-right text-[15px] text-black/90">
									{fmtRate(transitTripsPerDriverFte(column.id))}
								</td>
							{/each}
							<td class="px-3 py-1 text-right text-[15px] font-medium text-black/95">
								{fmtRate(transitTripsPerDriverFte('total'))}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="border border-black bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
				<div class="grid gap-4">
					<div class="grid gap-2 md:grid-cols-[1fr_240px] md:items-end">
						<div>
							<div class="text-[15px] font-semibold text-[var(--theme-color)] decoration-[var(--theme-color)] decoration-1-offset-2">
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
						<div class="text-[15px] font-semibold text-[var(--theme-color)] decoration-[var(--theme-color)] decoration-1-offset-2">
							After reviewing the system's vital signs, what has the system been doing well?
						</div>
						<textarea
							class="min-h-[4.5rem] w-full rounded-[2px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--theme-color)_18%,white)] px-3 py-2 text-[15px] text-black/80 focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:text-white"
							bind:value={completion.surplusExplain}
						></textarea>
					</div>

					<div class="grid gap-2">
						<div class="text-[15px] font-semibold text-[var(--theme-color)] decoration-[var(--theme-color)] decoration-1-offset-2">
							After reviewing the system's vital signs, what should the system do to improve it's performance?
						</div>
						<textarea
							class="min-h-[4.5rem] w-full rounded-[2px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--theme-color)_18%,white)] px-3 py-2 text-[15px] text-black/80 focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:text-white"
							bind:value={completion.deficitExplain}
						></textarea>
					</div>

					<ReportCertificationSection
						agency={agencyName}
						type={type}
						year={year}
						canSign={certification?.canSign ?? false}
						currentUser={certification?.currentUser ?? null}
						signatures={(certification?.signatures ?? []) as {
							reportKey: string;
							agency: string;
							type: 'urban' | 'rural';
							year: number;
							id: number;
							role: 'AUTHORIZED_OFFICIAL' | 'FINANCIAL_MANAGER' | 'TAB_CHAIRPERSON';
							signerName: string;
							signerEmail: string;
							signatureImage: string;
							signedAt: string;
							status: 'active' | 'revoked' | 'invalidated';
							revokedAt: string | null;
							invalidatedAt: string | null;
						}[]}
					/>

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
