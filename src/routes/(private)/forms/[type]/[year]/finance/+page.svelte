<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onDestroy, onMount } from 'svelte';
	import { URBAN_MODES, RURAL_MODES } from '$lib/shared/rules/modes.rules';
	import { loadCapabilities } from '$lib/features/forms/shared/stores/capabilities.store';

	type RowType = 'section' | 'input' | 'sum' | 'formula';
	type ModeValues = (number | null)[];
	type DraftStore = Record<string, ModeValues>;

	type FinanceRow = {
		id: string;
		label: string;
		type: RowType;
		sumOf?: string[];
		description?: string;
		highlightLabel?: boolean;
		editableCols?: number[];
	};

	const URBAN_COLUMNS = URBAN_MODES.map((m) => ({ id: m.id, label: m.label }));
	const URBAN_COLS = URBAN_COLUMNS.length;

	const URBAN_ROWS: FinanceRow[] = [
		{ id: 'section_expenses', label: 'Operating Expenses', type: 'section' },
		{ id: 'total_system_expenses', label: 'Total System Expenses', type: 'input' },

		{ id: 'section_revenues', label: 'Operating Revenues', type: 'section' },
		{ id: 'passenger_fares', label: 'Passenger Fares (Farebox)', type: 'input' },
		{ id: 'special_transit_fares', label: 'Special Transit Fares', type: 'input' },
		{ id: 'other_transport_revenue', label: 'Other Transportation Revenues', type: 'input' },
		{ id: 'non_transport_revenue', label: 'Non-Transportation Revenues', type: 'input' },
		{
			id: 'total_revenue',
			label: 'Total Revenue',
			type: 'sum',
			sumOf: [
				'passenger_fares',
				'special_transit_fares',
				'other_transport_revenue',
				'non_transport_revenue'
			]
		},

		{ id: 'section_assistance', label: 'Operating Assistance', type: 'section' },
		{ id: 'federal_assistance', label: 'Federal Assistance', type: 'input' },
		{ id: 'state_assistance', label: 'State Assistance', type: 'input' },
		{ id: 'local_gov_assistance', label: 'Local Government Assistance', type: 'input' },
		{ id: 'other_assistance', label: 'Other Assistance', type: 'input' },
		{
			id: 'total_operating_assistance',
			label: 'Total Operating Assistance',
			type: 'sum',
			sumOf: ['federal_assistance', 'state_assistance', 'local_gov_assistance', 'other_assistance']
		}
	];

	const RURAL_MODE_COLUMNS = RURAL_MODES.map((m) => ({
		id: m.id,
		label: m.id.replace('_', ' ').toUpperCase()
	}));
	const RURAL_GROUP_COLS = RURAL_MODE_COLUMNS.length;
	const RURAL_VALUE_COLS = RURAL_GROUP_COLS * 2;
	const RURAL_OP_EDIT_COLS = Array.from({ length: RURAL_GROUP_COLS }, (_, i) => i);
	const RURAL_CAP_EDIT_COLS = Array.from({ length: RURAL_GROUP_COLS }, (_, i) => RURAL_GROUP_COLS + i);
	const RURAL_BOTH_EDIT_COLS = [...RURAL_OP_EDIT_COLS, ...RURAL_CAP_EDIT_COLS];
	const RURAL_OP_EDIT_COLS_NO_DR_DO = RURAL_OP_EDIT_COLS.filter((i) => i !== 0);

	const RURAL_ROWS: FinanceRow[] = [
		{ id: 'resources_admin', label: 'Administrative', type: 'section' },
		{
			id: 'personal_salaries_fringes',
			label: 'Personnel Salaries & Fringes - CTP Object Codes G121-189',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'advertising_promotion',
			label: 'Advertising and Promotion - CTP Object Codes G371-373',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'employee_development',
			label: 'Employee Development - CTP Object Code G395',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'vehicle_insurance_premiums',
			label: 'Vehicle Insurance Premiums - CTP Object Code G452',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'admin_indirect_services',
			label: 'Indirect Services - CTP Object Code G481',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'admin_ctp_codes',
			label: 'CTP Codes G190-359; 380-394; 396-451; 454-480; 482-491',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'other_admin_expense',
			label: 'Other Admin Expense (describe to the right)',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'total_administrative_expenses',
			label: 'Total Administrative Expenses',
			type: 'sum',
			sumOf: [
				'personal_salaries_fringes',
				'advertising_promotion',
				'employee_development',
				'vehicle_insurance_premiums',
				'admin_indirect_services',
				'admin_ctp_codes',
				'other_admin_expense'
			]
		},

		{ id: 'resources_operating', label: 'Operating', type: 'section' },
		{
			id: 'driver_salaries_fringes',
			label: 'Driver Salaries & Fringes',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'other_operating_staff',
			label: 'Other Operating Staff Salaries & Fringes',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'mechanics_salaries_fringes',
			label: 'Mechanics Salaries & Fringes',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'operating_indirect_services',
			label: 'Indirect Services',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{ id: 'fuel', label: 'Fuel', type: 'input', editableCols: RURAL_OP_EDIT_COLS },
		{
			id: 'vehicle_maintenance',
			label: 'Vehicle Maintenance',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'insurance_deductible',
			label: 'Payment of Insurance Deductible(s)',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'disposal_of_vehicle',
			label: 'Disposal of Vehicle(s)',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'management_operation_services',
			label: 'Management/Operation Services',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS_NO_DR_DO
		},
		{
			id: 'volunteer_reimbursement',
			label: 'Volunteer Reimbursement',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'other_transit_provider_services',
			label: 'Other Transit Provider Services',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS_NO_DR_DO
		},
		{
			id: 'other_operating_expense',
			label: 'Other (describe to the right)',
			type: 'input',
			editableCols: RURAL_OP_EDIT_COLS
		},
		{
			id: 'total_operating_expenses',
			label: 'Total Operating Expenses',
			type: 'sum',
			sumOf: [
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
			]
		},
		{
			id: 'total_system_expenses',
			label: 'Total Admin/Operating Expenses',
			type: 'sum',
			sumOf: ['total_administrative_expenses', 'total_operating_expenses']
		},

		{ id: 'resources_capital', label: 'Capital', type: 'section' },
		{ id: 'capital_purchases', label: 'Capital Purchases', type: 'input', editableCols: RURAL_CAP_EDIT_COLS },
		{ id: 'body_work', label: 'Body Work on Wrecked Vehicle', type: 'input', editableCols: RURAL_CAP_EDIT_COLS },
		{ id: 'facility_renovation', label: 'Facility Renovation or Construction', type: 'input', editableCols: RURAL_CAP_EDIT_COLS },
		{ id: 'advanced_technology_purchases', label: 'Advanced Technology Purchases', type: 'input', editableCols: RURAL_CAP_EDIT_COLS },
		{ id: 'other_capital_expense', label: 'Other (describe to the right)', type: 'input', editableCols: RURAL_CAP_EDIT_COLS },
		{
			id: 'total_capital_expenses',
			label: 'Total Capital Expenses',
			type: 'sum',
			sumOf: [
				'capital_purchases',
				'body_work',
				'facility_renovation',
				'advanced_technology_purchases',
				'other_capital_expense'
			]
		},
		{
			id: 'total_expenses',
			label: 'Total Expenses',
			type: 'sum',
			sumOf: ['total_system_expenses', 'total_capital_expenses']
		},

		{ id: 'revenues_federal', label: 'Federal', type: 'section' },
		{
			id: 'federal_assistance',
			label: 'Urbanized Area Formula Funding - Section 5307',
			type: 'input',
			editableCols: RURAL_BOTH_EDIT_COLS
		},
		{ id: 'federal_cares_5307', label: 'CARES Act - Section 5307', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_crrsa_5307', label: 'CRRSA Act - Section 5307', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_arp_5307', label: 'ARP Act - Section 5307', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_capital_5309', label: 'FTA Capital Program Funds - Section 5309', type: 'input', editableCols: RURAL_CAP_EDIT_COLS },
		{ id: 'federal_elderly_5310', label: 'Elderly and Disabled - Section 5310', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_ca_ops_5310', label: 'Capital Assistance Spent on Operations - Section 5310', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_cares_5310', label: 'CARES Act - Section 5310', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_crrsa_5310', label: 'CRRSA Act - Section 5310', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_arp_5310', label: 'ARP Act - Section 5310', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_ctp_admin_cap_5311', label: 'CTP Funds - Administrative/Capital - Section 5311', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_ctp_operating_5311', label: 'CTP Funds - Operating - Section 5311', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_ca_ops_5311', label: 'Capital Assistance Spent on Operations - Section 5311', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_appalachian_5311', label: 'Appalachian - Section 5311', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_tribal_5311', label: 'Tribal Federal Assistance - Section 5311', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_arra_5311', label: 'ARRA Assistance - Section 5311', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_arra_tribal_5311', label: 'ARRA Tribal Assistance - Section 5311', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_cares_5311', label: 'CARES Act - Section 5311', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_crrsa_5311', label: 'CRRSA Act - Section 5311', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_arp_5311', label: 'ARP Act - Section 5311', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_jarc_5316', label: 'JARC Funds - Section 5316', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_new_freedom_5317', label: 'New Freedom Funds - Section 5317', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_bus_facilities_5339', label: 'Bus and Bus Facilities 5339', type: 'input', editableCols: RURAL_CAP_EDIT_COLS },
		{ id: 'federal_other_fta', label: 'Other FTA Revenues (describe to the right)', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{ id: 'federal_other_non_fta', label: 'Other Federal Non-FTA Revenues (describe to the right)', type: 'input', editableCols: RURAL_BOTH_EDIT_COLS },
		{
			id: 'federal_total',
			label: 'Federal Total',
			type: 'sum',
			sumOf: [
				'federal_assistance',
				'federal_cares_5307',
				'federal_crrsa_5307',
				'federal_arp_5307',
				'federal_capital_5309',
				'federal_elderly_5310',
				'federal_ca_ops_5310',
				'federal_cares_5310',
				'federal_crrsa_5310',
				'federal_arp_5310',
				'federal_ctp_admin_cap_5311',
				'federal_ctp_operating_5311',
				'federal_ca_ops_5311',
				'federal_appalachian_5311',
				'federal_tribal_5311',
				'federal_arra_5311',
				'federal_arra_tribal_5311',
				'federal_cares_5311',
				'federal_crrsa_5311',
				'federal_arp_5311',
				'federal_jarc_5316',
				'federal_new_freedom_5317',
				'federal_bus_facilities_5339',
				'federal_other_fta',
				'federal_other_non_fta'
			]
		},

		{ id: 'revenues_state', label: 'State', type: 'section' },
		{ id: 'state_assistance', label: 'CTP Funds - Administrative', type: 'input', editableCols: RURAL_OP_EDIT_COLS },
		{ id: 'roap_suballocated', label: 'ROAP Funds - Suballocated to the Transit System', type: 'input', editableCols: RURAL_OP_EDIT_COLS },
		{ id: 'state_vehicles_capital', label: 'Vehicles & Other Capital Revenues', type: 'input', editableCols: RURAL_CAP_EDIT_COLS },
		{ id: 'state_facility', label: 'Facility', type: 'input', editableCols: RURAL_CAP_EDIT_COLS },
		{ id: 'state_advanced_tech', label: 'Advanced Technology', type: 'input', editableCols: RURAL_CAP_EDIT_COLS },
		{ id: 'state_other_revenue', label: 'Other (describe to the right)', type: 'input', editableCols: RURAL_OP_EDIT_COLS_NO_DR_DO },
		{
			id: 'state_total',
			label: 'State Total',
			type: 'sum',
			sumOf: [
				'state_assistance',
				'roap_suballocated',
				'state_vehicles_capital',
				'state_facility',
				'state_advanced_tech',
				'state_other_revenue'
			]
		},

		{ id: 'revenues_local', label: 'Local', type: 'section' },
		{ id: 'local_gov_assistance', label: 'Government Funds', type: 'input', editableCols: RURAL_OP_EDIT_COLS },
		{ id: 'medicaid_revenue', label: 'Medicaid Revenue', type: 'input', editableCols: RURAL_OP_EDIT_COLS },
		{ id: 'brokered_medicaid_revenue', label: 'Brokered Medicaid Revenue', type: 'input', editableCols: RURAL_OP_EDIT_COLS, highlightLabel: true },
		{ id: 'contract_revenue_full_cost', label: 'Contract Revenue: Full Cost', type: 'input', editableCols: RURAL_OP_EDIT_COLS },
		{ id: 'other_directly_generated_revenue', label: 'Other Directly Generated Revenue', type: 'input', editableCols: RURAL_OP_EDIT_COLS },
		{ id: 'passenger_fares', label: 'Fares from Passengers', type: 'input', editableCols: RURAL_OP_EDIT_COLS },
		{ id: 'donations', label: 'Donations', type: 'input', editableCols: RURAL_OP_EDIT_COLS },
		{ id: 'interest_income', label: 'Interest Income', type: 'input', editableCols: RURAL_OP_EDIT_COLS },
		{ id: 'advertising_revenue', label: 'Advertising Revenue', type: 'input', editableCols: RURAL_OP_EDIT_COLS },
		{ id: 'insurance_proceeds', label: 'Insurance Proceeds from Accident', type: 'input', editableCols: RURAL_OP_EDIT_COLS },
		{ id: 'vehicle_sale_proceeds', label: 'Proceeds from Sale of Vehicle (used for capital only)', type: 'input', editableCols: RURAL_CAP_EDIT_COLS },
		{ id: 'other_local_revenue', label: 'Other Revenue (describe to the right)', type: 'input', editableCols: RURAL_OP_EDIT_COLS },
		{
			id: 'local_total',
			label: 'Local Total',
			type: 'sum',
			sumOf: [
				'local_gov_assistance',
				'medicaid_revenue',
				'brokered_medicaid_revenue',
				'contract_revenue_full_cost',
				'other_directly_generated_revenue',
				'passenger_fares',
				'donations',
				'interest_income',
				'advertising_revenue',
				'insurance_proceeds',
				'vehicle_sale_proceeds',
				'other_local_revenue'
			]
		},
		{
			id: 'total_revenue',
			label: 'Total Revenue',
			type: 'sum',
			sumOf: ['federal_total', 'state_total', 'local_total']
		},
		{
			id: 'total_operating_assistance',
			label: 'Total Operating Assistance',
			type: 'sum',
			sumOf: [
				'federal_assistance',
				'federal_ca_ops_5310',
				'federal_ctp_operating_5311',
				'federal_ca_ops_5311',
				'state_assistance',
				'local_gov_assistance'
			]
		},
		{ id: 'surplus_deficit', label: 'Surplus / (Deficit) = Total Revenue - Total Expenses', type: 'formula' }
	];

	function createEmptyDraft(rows: FinanceRow[], cols: number): DraftStore {
		const entries: [string, ModeValues][] = rows
			.filter((r) => r.type === 'input')
			.map((r) => [r.id, Array.from({ length: cols }, () => null)]);
		return Object.fromEntries(entries);
	}

	let urbanDraft = $state<DraftStore>(createEmptyDraft(URBAN_ROWS, URBAN_COLS));
	let ruralDraft = $state<DraftStore>(createEmptyDraft(RURAL_ROWS, RURAL_VALUE_COLS));
	let ruralDescriptions = $state<Record<string, string>>({});
	let urbanActiveRow = $state<number | null>(null);
	let ruralActiveRow = $state<number | null>(null);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let hasLoadedDraft = $state(false);
	let lastLoadedKey = $state('');
	const nf = new Intl.NumberFormat('en-US');

	const urbanSectionStarts = URBAN_ROWS.map((row, index) => (row.type === 'section' ? index : -1)).filter(
		(index) => index >= 0
	);
	const urbanSectionStartSet = new Set(urbanSectionStarts);
	const urbanSectionEndSet = new Set(
		urbanSectionStarts.map((start, i) =>
			i + 1 < urbanSectionStarts.length ? urbanSectionStarts[i + 1] - 1 : URBAN_ROWS.length - 1
		)
	);

	const type = $derived(page.params.type as 'urban' | 'rural');
	const year = $derived(Number(page.params.year));
	const isUrban = $derived(type === 'urban');
	const draftKey = $derived(`finance:${type}:${year}:urban-financial`);
	const descriptionKey = $derived(`finance:${type}:${year}:rural-financial:descriptions`);
	const capabilities = $derived(loadCapabilities(type, year));
	const selectedRuralModes = $derived(new Set((capabilities?.selectedModes ?? []).map((m) => m.toLowerCase())));

	function normalizeDraft(parsed: unknown, rows: FinanceRow[], cols: number): DraftStore {
		const empty = createEmptyDraft(rows, cols);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return empty;

		const record = parsed as Record<string, unknown>;
		for (const row of rows) {
			if (row.type !== 'input') continue;
			const maybeRow = record[row.id];
			if (!Array.isArray(maybeRow)) continue;
			empty[row.id] = Array.from({ length: cols }, (_, i) => {
				const cell = maybeRow[i];
				return typeof cell === 'number' || cell === null ? cell : null;
			});
		}
		return empty;
	}

	function persistDraftNow() {
		if (!browser || !hasLoadedDraft) return;
		const payload = isUrban ? urbanDraft : ruralDraft;
		localStorage.setItem(draftKey, JSON.stringify(payload));
		if (!isUrban) localStorage.setItem(descriptionKey, JSON.stringify(ruralDescriptions));
	}

	onMount(() => {
		if (!browser) return;
	});

	onDestroy(() => {
		if (saveTimer) clearTimeout(saveTimer);
		persistDraftNow();
	});

	$effect(() => {
		if (!browser) {
			hasLoadedDraft = false;
			lastLoadedKey = '';
			urbanDraft = createEmptyDraft(URBAN_ROWS, URBAN_COLS);
			ruralDraft = createEmptyDraft(RURAL_ROWS, RURAL_VALUE_COLS);
			ruralDescriptions = {};
			return;
		}

		const key = draftKey;
		if (key === lastLoadedKey) return;
		lastLoadedKey = key;

		try {
			const raw = localStorage.getItem(key);
			if (isUrban) {
				urbanDraft = raw
					? normalizeDraft(JSON.parse(raw), URBAN_ROWS, URBAN_COLS)
					: createEmptyDraft(URBAN_ROWS, URBAN_COLS);
			} else {
				ruralDraft = raw
					? normalizeDraft(JSON.parse(raw), RURAL_ROWS, RURAL_VALUE_COLS)
					: createEmptyDraft(RURAL_ROWS, RURAL_VALUE_COLS);
				try {
					const rawDescriptions = localStorage.getItem(descriptionKey);
					const parsedDescriptions = rawDescriptions ? JSON.parse(rawDescriptions) : {};
					ruralDescriptions =
						parsedDescriptions &&
						typeof parsedDescriptions === 'object' &&
						!Array.isArray(parsedDescriptions)
							? (parsedDescriptions as Record<string, string>)
							: {};
				} catch {
					ruralDescriptions = {};
				}
			}
		} catch {
			urbanDraft = createEmptyDraft(URBAN_ROWS, URBAN_COLS);
			ruralDraft = createEmptyDraft(RURAL_ROWS, RURAL_VALUE_COLS);
			ruralDescriptions = {};
		}
		hasLoadedDraft = true;
	});

	$effect(() => {
		if (!browser || !hasLoadedDraft) return;
		draftKey;
		descriptionKey;
		urbanDraft;
		ruralDraft;
		ruralDescriptions;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			persistDraftNow();
		}, 250);
	});

	function parseCell(raw: string): number | null {
		const trimmed = raw.trim().replace(/,/g, '');
		if (trimmed === '') return null;
		if (!/^\d+$/.test(trimmed)) return null;
		const n = Number(trimmed);
		return Number.isInteger(n) && n >= 0 ? n : null;
	}

	function setUrbanInputCell(rowId: string, colIndex: number, raw: string) {
		const parsed = parseCell(raw);
		if (parsed === null && raw.trim() !== '') return;
		urbanDraft[rowId][colIndex] = parsed;
	}

	function setRuralInputCell(rowId: string, colIndex: number, raw: string) {
		const parsed = parseCell(raw);
		if (parsed === null && raw.trim() !== '') return;
		ruralDraft[rowId][colIndex] = parsed;
	}

	function setRuralDescription(rowId: string, value: string) {
		ruralDescriptions[rowId] = value;
	}

	function getUrbanModeValue(row: FinanceRow, colIndex: number): number | null {
		if (row.type === 'section') return null;
		if (row.type === 'input') return urbanDraft[row.id]?.[colIndex] ?? null;

		let sum = 0;
		let hasAny = false;
		for (const sourceId of row.sumOf ?? []) {
			const value = urbanDraft[sourceId]?.[colIndex];
			if (typeof value === 'number') {
				sum += value;
				hasAny = true;
			}
		}
		return hasAny ? sum : null;
	}

	function getUrbanRowTotal(row: FinanceRow): number | null {
		if (row.type === 'section') return null;
		let sum = 0;
		let hasAny = false;
		for (let c = 0; c < URBAN_COLS; c++) {
			const value = getUrbanModeValue(row, c);
			if (typeof value === 'number') {
				sum += value;
				hasAny = true;
			}
		}
		return hasAny ? sum : null;
	}

	function getRuralRow(id: string): FinanceRow | undefined {
		return RURAL_ROWS.find((r) => r.id === id);
	}

	function getRuralModeValue(row: FinanceRow, colIndex: number): number | null {
		if (row.type === 'section') return null;
		if (row.type === 'input') return ruralDraft[row.id]?.[colIndex] ?? null;
		if (row.type === 'formula') {
			const revenueRow = getRuralRow('total_revenue');
			const expenseRow = getRuralRow('total_expenses');
			const revenue = revenueRow ? getRuralModeValue(revenueRow, colIndex) : null;
			const expense = expenseRow ? getRuralModeValue(expenseRow, colIndex) : null;
			if (revenue == null && expense == null) return null;
			return (revenue ?? 0) - (expense ?? 0);
		}

		let sum = 0;
		let hasAny = false;
		for (const sourceId of row.sumOf ?? []) {
			const sourceRow = getRuralRow(sourceId);
			if (!sourceRow) continue;
			const value = getRuralModeValue(sourceRow, colIndex);
			if (typeof value === 'number') {
				sum += value;
				hasAny = true;
			}
		}
		return hasAny ? sum : null;
	}

	function getRuralGroupTotal(row: FinanceRow, start: number): number | null {
		if (row.type === 'section') return null;
		let sum = 0;
		let hasAny = false;
		for (let c = start; c < start + RURAL_GROUP_COLS; c++) {
			const value = getRuralModeValue(row, c);
			if (typeof value === 'number') {
				sum += value;
				hasAny = true;
			}
		}
		return hasAny ? sum : null;
	}

	function fmt(n: number | null): string {
		return n == null ? '' : nf.format(n);
	}

	function fmtTotal(n: number | null): string {
		return nf.format(n ?? 0);
	}

	function canEditUrbanRow(rowIndex: number): boolean {
		return URBAN_ROWS[rowIndex]?.type === 'input';
	}

	function canEditRuralCell(row: FinanceRow, colIndex: number): boolean {
		if (row.type !== 'input') return false;
		if (!(row.editableCols?.includes(colIndex) ?? false)) return false;
		const modeIndex = colIndex % RURAL_GROUP_COLS;
		const modeId = RURAL_MODE_COLUMNS[modeIndex]?.id;
		return modeId ? selectedRuralModes.has(modeId) : false;
	}

	function canEditRuralDescription(row: FinanceRow): boolean {
		return row.type === 'input' && /describe to the right/i.test(row.label);
	}

	function moveUrbanFocus(r: number, c: number) {
		const next = document.querySelector<HTMLInputElement>(`input[data-ur="${r}"][data-uc="${c}"]`);
		if (next) next.focus();
	}

	function moveRuralFocus(r: number, c: number) {
		const next = document.querySelector<HTMLInputElement>(`input[data-rr="${r}"][data-rc="${c}"]`);
		if (next) next.focus();
	}

	function handleUrbanKey(event: KeyboardEvent, r: number, c: number) {
		let nr = r;
		let nc = c;
		const navKey = event.key === 'Enter' ? 'ArrowDown' : event.key;

		if (navKey === 'ArrowUp') nr = Math.max(0, r - 1);
		else if (navKey === 'ArrowDown') nr = Math.min(URBAN_ROWS.length - 1, r + 1);
		else if (navKey === 'ArrowLeft') nc = Math.max(0, c - 1);
		else if (navKey === 'ArrowRight') nc = Math.min(URBAN_COLS - 1, c + 1);
		else return;

		event.preventDefault();
		let guard = 0;
		while (!canEditUrbanRow(nr) && guard < 1000) {
			guard++;
			if (navKey === 'ArrowUp') nr = Math.max(0, nr - 1);
			else if (navKey === 'ArrowDown') nr = Math.min(URBAN_ROWS.length - 1, nr + 1);
			else return;
		}
		if (canEditUrbanRow(nr)) moveUrbanFocus(nr, nc);
	}

	function handleRuralKey(event: KeyboardEvent, r: number, c: number) {
		let nr = r;
		let nc = c;
		const navKey = event.key === 'Enter' ? 'ArrowDown' : event.key;

		if (navKey === 'ArrowUp') nr = Math.max(0, r - 1);
		else if (navKey === 'ArrowDown') nr = Math.min(RURAL_ROWS.length - 1, r + 1);
		else if (navKey === 'ArrowLeft') nc = Math.max(0, c - 1);
		else if (navKey === 'ArrowRight') nc = Math.min(RURAL_VALUE_COLS - 1, c + 1);
		else return;

		event.preventDefault();
		let guard = 0;
		while (guard < 1500) {
			guard++;
			const row = RURAL_ROWS[nr];
			if (row && canEditRuralCell(row, nc)) {
				moveRuralFocus(nr, nc);
				return;
			}
			if (navKey === 'ArrowUp') nr = Math.max(0, nr - 1);
			else if (navKey === 'ArrowDown') nr = Math.min(RURAL_ROWS.length - 1, nr + 1);
			else if (navKey === 'ArrowLeft') nc = Math.max(0, nc - 1);
			else if (navKey === 'ArrowRight') nc = Math.min(RURAL_VALUE_COLS - 1, nc + 1);
		}
	}

	function handleUrbanGridFocusIn(event: FocusEvent) {
		const target = event.target as HTMLElement | null;
		const input = target?.closest('input[data-ur][data-uc]') as HTMLInputElement | null;
		if (!input) return;
		const row = Number(input.dataset.ur);
		urbanActiveRow = Number.isNaN(row) ? null : row;
	}

	function handleUrbanGridFocusOut() {
		queueMicrotask(() => {
			const active = document.activeElement as HTMLElement | null;
			const input = active?.closest('input[data-ur][data-uc]') as HTMLInputElement | null;
			if (!input) {
				urbanActiveRow = null;
				return;
			}
			const row = Number(input.dataset.ur);
			urbanActiveRow = Number.isNaN(row) ? null : row;
		});
	}

	function handleRuralGridFocusIn(event: FocusEvent) {
		const target = event.target as HTMLElement | null;
		const input = target?.closest('input[data-rr][data-rc]') as HTMLInputElement | null;
		if (!input) return;
		const row = Number(input.dataset.rr);
		ruralActiveRow = Number.isNaN(row) ? null : row;
	}

	function handleRuralGridFocusOut() {
		queueMicrotask(() => {
			const active = document.activeElement as HTMLElement | null;
			const input = active?.closest('input[data-rr][data-rc]') as HTMLInputElement | null;
			if (!input) {
				ruralActiveRow = null;
				return;
			}
			const row = Number(input.dataset.rr);
			ruralActiveRow = Number.isNaN(row) ? null : row;
		});
	}
</script>

<section class="flex flex-col gap-3">
	{#if isUrban}
		<div
			class="max-h-[87vh] overflow-auto rounded-sm bg-white"
			onfocusin={handleUrbanGridFocusIn}
			onfocusout={handleUrbanGridFocusOut}
		>
			<table class="w-full border-separate h-[70vh] border-spacing-0">
				<thead
					class="sticky top-0 z-30 border-b border-[#b7b7b7] bg-[#1f1f1f] text-xs tracking-wide text-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
				>
					<tr>
						<th
							class="sticky left-0 z-20 min-w-[370px] border-r border-[#7d7d7d] bg-[#111111] p-2 text-right font-semibold dark:border-zinc-700 dark:bg-zinc-900"
						>
							Line Item
						</th>

						{#each URBAN_COLUMNS as col}
							<th
								class="min-w-[130px] border-r border-[#7d7d7d] p-2 text-center font-semibold uppercase dark:border-zinc-700"
							>
								{col.label}
							</th>
						{/each}

						<th
							class="min-w-[130px] border-r border-[#7d7d7d] p-2 text-center font-semibold uppercase dark:border-zinc-700"
						>
							Total
						</th>
					</tr>
				</thead>

				<tbody class="text-sm">
					{#each URBAN_ROWS as row, r}
						{@const isSectionStart = urbanSectionStartSet.has(r)}
						{@const isSectionEnd = urbanSectionEndSet.has(r)}
						{#if isSectionStart && r !== urbanSectionStarts[0]}
							<tr aria-hidden="true">
								<td colspan={URBAN_COLS + 2} class="h-2 border-0 bg-transparent p-0"></td>
							</tr>
						{/if}
						{#if row.type === 'section'}
							<tr class="cursor-default border-y border-[#8b8b8b] bg-[#f0f0f0] dark:border-zinc-700 dark:bg-zinc-800">
								<td colspan={URBAN_COLS + 2} class="overflow-hidden rounded-t-lg border border-[#8b8b8b] bg-[#f0f0f0] p-2.5 text-[1.05rem] font-bold text-zinc-900 uppercase dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
									{row.label}
								</td>
							</tr>
						{:else}
							<tr class="group border-b border-[#d6d6d6] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:border-zinc-700 dark:hover:bg-zinc-800/40 {isSectionStart ? 'border-t-2 border-[#8b8b8b] dark:border-zinc-700' : ''} {isSectionEnd ? 'border-b-2 border-[#8b8b8b] dark:border-zinc-700' : ''}">
								<td class="sticky left-0 z-20 overflow-hidden border border-[#d6d6d6] border-l-[#8b8b8b] p-2 text-right font-medium dark:border-zinc-700 dark:border-l-zinc-700 {urbanActiveRow === r ? 'bg-[color-mix(in_srgb,var(--theme-color)_15%,white)] dark:bg-[color-mix(in_srgb,var(--theme-color)_30%,black)]' : 'bg-[#f3f3f3] group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:bg-zinc-900 dark:group-hover:bg-zinc-800/40'} {isSectionStart ? 'rounded-tl-lg' : ''} {isSectionEnd ? 'rounded-bl-lg' : ''}">
									{row.label}
								</td>

								{#each URBAN_COLUMNS as _, c}
									<td class="border-r border-b border-[#d6d6d6] p-0 group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:border-zinc-700 dark:group-hover:bg-zinc-800/40">
										{#if row.type === 'input'}
											<input
												type="text"
												inputmode="numeric"
												data-ur={r}
												data-uc={c}
												autocomplete="off"
												autocapitalize="off"
												spellcheck="false"
												class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(7rem-0.5rem)] rounded-md border-0 bg-[color-mix(in_srgb,var(--theme-color)_18%,var(--surface-1))] px-2 py-1.5 text-center font-mono text-sm text-zinc-900 ring-0 transition outline-none group-hover:bg-[color-mix(in_srgb,var(--theme-color)_22%,var(--surface-1))] focus:bg-[color-mix(in_srgb,var(--theme-color)_26%,var(--surface-1))] focus:shadow-[inset_0_0_0_2px_var(--theme-color)] dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:text-zinc-100 dark:group-hover:bg-[color-mix(in_srgb,var(--theme-color)_34%,black)] dark:focus:bg-[color-mix(in_srgb,var(--theme-color)_40%,black)]"
												value={fmt(getUrbanModeValue(row, c))}
												oninput={(e) => {
													const el = e.currentTarget as HTMLInputElement;
													setUrbanInputCell(row.id, c, el.value);
												}}
												onblur={(e) => {
													const el = e.currentTarget as HTMLInputElement;
													el.value = fmt(getUrbanModeValue(row, c));
												}}
												onkeydown={(e) => handleUrbanKey(e, r, c)}
											/>
										{:else}
											<div class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(7rem-0.5rem)] cursor-not-allowed rounded-md bg-[color-mix(in_srgb,var(--accent-color)_14%,var(--surface-1))] px-2 py-2 text-center font-mono font-semibold text-zinc-800 dark:bg-[color-mix(in_srgb,var(--accent-color)_20%,black)] dark:text-zinc-100">
												{fmt(getUrbanModeValue(row, c))}
											</div>
										{/if}
									</td>
								{/each}

								<td class="overflow-hidden border-r border-b border-[#d6d6d6] bg-white p-0 dark:border-zinc-700 dark:bg-zinc-950 {isSectionStart ? 'rounded-tr-lg border-r-[#8b8b8b] dark:border-r-zinc-700' : ''} {isSectionEnd ? 'rounded-br-lg border-r-[#8b8b8b] dark:border-r-zinc-700' : ''}">
									<div class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(7rem-0.5rem)] cursor-not-allowed rounded-md bg-[color-mix(in_srgb,var(--accent-color)_14%,var(--surface-1))] px-2 py-2 text-center font-mono font-semibold text-zinc-800 dark:bg-[color-mix(in_srgb,var(--accent-color)_20%,black)] dark:text-zinc-100">
										{fmt(getUrbanRowTotal(row))}
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="max-h-[87vh] overflow-auto rounded-sm bg-white" onfocusin={handleRuralGridFocusIn} onfocusout={handleRuralGridFocusOut}>
			<table class="w-full border-separate border-spacing-0">
				<thead class="sticky top-0 z-30 border-b border-[#b7b7b7] bg-[#1f1f1f] text-xs tracking-wide text-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
					<tr>
						<th class="sticky left-0 z-30 min-w-[420px] border-r border-[#7d7d7d] bg-[#111111] p-2 text-right font-semibold" rowspan="2">Resource</th>
						<th class="border-r border-[#7d7d7d] p-2 text-center font-semibold uppercase" colspan={RURAL_GROUP_COLS + 1}>Admin/Operating</th>
						<th class="border-r border-[#7d7d7d] p-2 text-center font-semibold uppercase" colspan={RURAL_GROUP_COLS + 1}>Capital</th>
						<th class="min-w-[220px] border-r border-[#7d7d7d] p-2 text-center font-semibold uppercase" rowspan="2">Description</th>
					</tr>
					<tr>
						{#each RURAL_MODE_COLUMNS as col}
							<th class="min-w-[94px] border-r border-[#7d7d7d] p-2 text-center font-semibold">{col.label}</th>
						{/each}
						<th class="min-w-[94px] border-r border-[#7d7d7d] p-2 text-center font-semibold">TOTAL</th>
						{#each RURAL_MODE_COLUMNS as col}
							<th class="min-w-[94px] border-r border-[#7d7d7d] p-2 text-center font-semibold">{col.label}</th>
						{/each}
						<th class="min-w-[94px] border-r border-[#7d7d7d] p-2 text-center font-semibold">TOTAL</th>
					</tr>
				</thead>
				<tbody class="text-sm">
					{#each RURAL_ROWS as row, r}
						{#if row.type === 'section'}
							<tr class="border-y border-[#8b8b8b] bg-[#f0f0f0] dark:border-zinc-700 dark:bg-zinc-800">
								<td class="sticky left-0 z-20 border border-[#8b8b8b] border-l-[#8b8b8b] bg-[#f0f0f0] p-2.5 text-right text-[1.02rem] font-bold uppercase dark:border-zinc-700 dark:border-l-zinc-700 dark:bg-zinc-800">
									{row.label}
								</td>
								<td colspan={RURAL_GROUP_COLS * 2 + 3} class="border border-l-0 border-[#8b8b8b] bg-[#f0f0f0] p-0 dark:border-zinc-700 dark:bg-zinc-800"></td>
							</tr>
						{:else}
							<tr class="group border-b border-[#d6d6d6] dark:border-zinc-700">
								<td class="sticky left-0 z-20 border border-[#d6d6d6] border-l-[#8b8b8b] p-2 text-right font-medium dark:border-zinc-700 dark:border-l-zinc-700 {ruralActiveRow === r ? 'bg-[color-mix(in_srgb,var(--theme-color)_15%,white)] dark:bg-[color-mix(in_srgb,var(--theme-color)_30%,black)]' : 'bg-[#f3f3f3] group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:bg-zinc-900 dark:group-hover:bg-zinc-800/40'} {row.highlightLabel ? 'bg-yellow-200 dark:bg-yellow-900/50' : ''}">
									{row.label}
								</td>

								{#each Array(RURAL_GROUP_COLS) as _, c}
									<td class="border-r border-b border-[#d6d6d6] p-0 dark:border-zinc-700">
										{#if canEditRuralCell(row, c)}
											<input
												type="text"
												inputmode="numeric"
												data-rr={r}
												data-rc={c}
												autocomplete="off"
												autocapitalize="off"
												spellcheck="false"
												class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(6.5rem-0.5rem)] rounded-md border-0 bg-[color-mix(in_srgb,var(--theme-color)_18%,var(--surface-1))] px-2 py-1.5 text-center font-mono text-sm ring-0 transition outline-none focus:shadow-[inset_0_0_0_2px_var(--theme-color)] dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)]"
												value={fmt(getRuralModeValue(row, c))}
												oninput={(e) => setRuralInputCell(row.id, c, (e.currentTarget as HTMLInputElement).value)}
												onblur={(e) => ((e.currentTarget as HTMLInputElement).value = fmt(getRuralModeValue(row, c)))}
												onkeydown={(e) => handleRuralKey(e, r, c)}
											/>
										{:else if row.type === 'input'}
											<div class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(6.5rem-0.5rem)] cursor-not-allowed rounded-md bg-[#e5e7eb] px-2 py-2 text-center font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
												{fmt(getRuralModeValue(row, c))}
											</div>
										{:else}
											<div class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(6.5rem-0.5rem)] cursor-not-allowed rounded-md bg-[color-mix(in_srgb,var(--accent-color)_14%,var(--surface-1))] px-2 py-2 text-center font-mono font-semibold text-zinc-800 dark:bg-[color-mix(in_srgb,var(--accent-color)_20%,black)] dark:text-zinc-100">
												{fmtTotal(getRuralModeValue(row, c))}
											</div>
										{/if}
									</td>
								{/each}

								<td class="border-r border-b border-[#d6d6d6] p-0 dark:border-zinc-700">
									<div class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(6.5rem-0.5rem)] cursor-not-allowed rounded-md bg-[color-mix(in_srgb,var(--accent-color)_14%,var(--surface-1))] px-2 py-2 text-center font-mono font-semibold text-zinc-800 dark:bg-[color-mix(in_srgb,var(--accent-color)_20%,black)] dark:text-zinc-100">
										{fmtTotal(getRuralGroupTotal(row, 0))}
									</div>
								</td>

								{#each Array(RURAL_GROUP_COLS) as _, c}
									{@const col = RURAL_GROUP_COLS + c}
									<td class="border-r border-b border-[#d6d6d6] p-0 dark:border-zinc-700">
										{#if canEditRuralCell(row, col)}
											<input
												type="text"
												inputmode="numeric"
												data-rr={r}
												data-rc={col}
												autocomplete="off"
												autocapitalize="off"
												spellcheck="false"
												class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(6.5rem-0.5rem)] rounded-md border-0 bg-[color-mix(in_srgb,var(--theme-color)_18%,var(--surface-1))] px-2 py-1.5 text-center font-mono text-sm ring-0 transition outline-none focus:shadow-[inset_0_0_0_2px_var(--theme-color)] dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)]"
												value={fmt(getRuralModeValue(row, col))}
												oninput={(e) => setRuralInputCell(row.id, col, (e.currentTarget as HTMLInputElement).value)}
												onblur={(e) => ((e.currentTarget as HTMLInputElement).value = fmt(getRuralModeValue(row, col)))}
												onkeydown={(e) => handleRuralKey(e, r, col)}
											/>
										{:else if row.type === 'input'}
											<div class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(6.5rem-0.5rem)] cursor-not-allowed rounded-md bg-[#e5e7eb] px-2 py-2 text-center font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
												{fmt(getRuralModeValue(row, col))}
											</div>
										{:else}
											<div class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(6.5rem-0.5rem)] cursor-not-allowed rounded-md bg-[color-mix(in_srgb,var(--accent-color)_14%,var(--surface-1))] px-2 py-2 text-center font-mono font-semibold text-zinc-800 dark:bg-[color-mix(in_srgb,var(--accent-color)_20%,black)] dark:text-zinc-100">
												{fmtTotal(getRuralModeValue(row, col))}
											</div>
										{/if}
									</td>
								{/each}

								<td class="border-r border-b border-[#d6d6d6] p-0 dark:border-zinc-700">
									<div class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(6.5rem-0.5rem)] cursor-not-allowed rounded-md bg-[color-mix(in_srgb,var(--accent-color)_14%,var(--surface-1))] px-2 py-2 text-center font-mono font-semibold text-zinc-800 dark:bg-[color-mix(in_srgb,var(--accent-color)_20%,black)] dark:text-zinc-100">
										{fmtTotal(getRuralGroupTotal(row, RURAL_GROUP_COLS))}
									</div>
								</td>

								<td class="border-r border-b border-[#d6d6d6] bg-[#f7f7f7] p-0 dark:border-zinc-700 dark:bg-zinc-900">
									{#if canEditRuralDescription(row)}
										<input
											type="text"
											class="m-1 w-[calc(100%-0.5rem)] rounded-md border-0 bg-[color-mix(in_srgb,var(--theme-color)_18%,var(--surface-1))] px-2 py-1.5 text-xs text-zinc-800 ring-0 transition outline-none focus:shadow-[inset_0_0_0_2px_var(--theme-color)] dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:text-zinc-100"
											placeholder={row.description ?? ''}
											value={ruralDescriptions[row.id] ?? ''}
											oninput={(e) => setRuralDescription(row.id, (e.currentTarget as HTMLInputElement).value)}
										/>
									{:else if row.type === 'input'}
										<div class="m-1 w-[calc(100%-0.5rem)] cursor-not-allowed rounded-md bg-[#e5e7eb] px-2 py-1.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
											{ruralDescriptions[row.id] ?? ''}
										</div>
									{:else}
										<div class="px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400"></div>
									{/if}
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
