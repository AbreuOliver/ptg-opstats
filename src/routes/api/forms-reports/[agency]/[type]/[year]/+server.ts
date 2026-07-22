import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidAgencyName, normalizeAgencyName } from '$lib/features/forms/persistence/agency';
import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';
import type { LocalFormSlices } from '$lib/features/forms/persistence/formsReport.types';
import { canAccessAgency } from '$lib/server/rbac';
import { assertCapabilities } from '$lib/features/forms/shared/guards/capabilities.guard';
import {
	getOpStatsRepository,
	type AnnualStatisticsDraft,
	type FinancialOutcomeDraft,
	type MonthlyPersistedRow,
	type MonthlyWriteRow,
	type OverviewRow
} from '$lib/server/opstats/repository';
import { getActivityRepository } from '$lib/server/activity/repository';

type DaySlug = 'weekday' | 'saturday' | 'sunday';
type MonthlyValueField = Exclude<
	keyof MonthlyWriteRow,
	'systemId' | 'year' | 'month' | 'dayType' | 'serviceType'
>;
type ActivityChange = {
	section?: string | null;
	field: string;
	from: unknown;
	to: unknown;
	context?: string | null;
	fromDisplay?: string;
	toDisplay?: string;
};

const DAY_TYPE_BY_SLUG: Record<DaySlug, string> = {
	weekday: 'Wk',
	saturday: 'SA',
	sunday: 'Su'
};

const MONTH_BY_COLUMN = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6] as const;
const MONTH_LABEL_BY_MONTH: Record<number, string> = {
	1: 'Jan',
	2: 'Feb',
	3: 'Mar',
	4: 'Apr',
	5: 'May',
	6: 'Jun',
	7: 'Jul',
	8: 'Aug',
	9: 'Sep',
	10: 'Oct',
	11: 'Nov',
	12: 'Dec'
};
const DAY_LABEL_BY_TYPE: Record<string, string> = {
	Wk: 'Weekday',
	SA: 'Saturday',
	Su: 'Sunday'
};
const SERVICE_LABEL_BY_TYPE: Record<string, string> = {
	ALL: 'All Service',
	FR: 'Fixed Route',
	DR: 'Dial-A-Ride',
	LR: 'Light Rail',
	SC: 'Street Car',
	VP: 'Vanpool',
	MT: 'Microtransit',
	'DR DO': 'Demand Response Directly Operated',
	'DR PT': 'Demand Response Purchased',
	'MB DO': 'Fixed Route Directly Operated',
	'MB PT': 'Fixed Route Purchased',
	'MT DO': 'Microtransit Directly Operated',
	'MT PT': 'Microtransit Purchased'
};

const URBAN_FINANCE_ROW_LABELS: Record<string, string> = {
	total_system_expenses: 'Total System Expenses',
	passenger_fares: 'Passenger Fares (Farebox)',
	special_transit_fares: 'Special Transit Fares',
	other_transport_revenue: 'Other Transportation Revenues',
	non_transport_revenue: 'Non-Transportation Revenues',
	federal_assistance: 'Federal Assistance',
	state_assistance: 'State Assistance',
	local_gov_assistance: 'Local Government Assistance',
	other_assistance: 'Other Assistance'
};

const URBAN_FINANCE_COLUMN_LABELS = [
	'Fixed Route',
	'Dial-A-Ride',
	'Light Rail',
	'Street Car',
	'Vanpool',
	'Microtransit'
] as const;

const RURAL_FINANCE_COLUMN_LABELS = ['DR DO', 'DR PT', 'MB DO', 'MB PT', 'MT DO', 'MT PT'] as const;

const URBAN_SERVICE_TYPE_BY_MODE: Record<string, string> = {
	fixed_route: 'FR',
	dial_a_ride: 'DR',
	light_rail: 'LR',
	street_car: 'SC',
	vanpool: 'VP',
	microtransit: 'MT'
};

const RURAL_SERVICE_TYPE_BY_MODE: Record<string, string> = {
	dr_do: 'DR DO',
	dr_pt: 'DR PT',
	mb_do: 'MB DO',
	mb_pt: 'MB PT',
	mt_do: 'MT DO',
	mt_pt: 'MT PT'
};

const MONTHLY_FIELD_BY_SUFFIX: Record<string, MonthlyValueField> = {
	hours: 'hours',
	vehicle_revenue_hours: 'hours',
	miles: 'miles',
	vehicle_revenue_miles: 'miles',
	pt_nc: 'passTripsNonCon',
	total_unlinked_passenger_trips: 'passTripsNonCon',
	medicaid: 'passTripsMedCon',
	nonmedicaid: 'passTripsNonMedCon',
	brokered_medicaid: 'passTripsBroMedCon',
	am_pm_peak_period_vehicles: 'peakVehAmPm',
	midday_vehicles: 'peakVehMidday'
};
const MONTHLY_FIELD_LABEL: Record<MonthlyValueField, string> = {
	operatingDays: 'Operating Days',
	hours: 'Hours',
	miles: 'Miles',
	passTripsNonCon: 'Passenger Trips: Non-Contract',
	passTripsMedCon: 'Passenger Trips: Medicaid Contract',
	passTripsNonMedCon: 'Passenger Trips: Non-Medicaid Contract',
	passTripsBroMedCon: 'Passenger Trips: Brokered Medicaid Contract',
	peakVehAmPm: 'AM/PM Peak Period Vehicles',
	peakVehMidday: 'Midday Vehicles'
};
const MONTHLY_VALUE_FIELDS = Object.keys(MONTHLY_FIELD_LABEL) as MonthlyValueField[];

function parseType(raw: string): FormType | null {
	if (raw === 'urban' || raw === 'rural') return raw;
	return null;
}

function parseYear(raw: string): number | null {
	const year = Number(raw);
	if (!Number.isInteger(year)) return null;
	if (year < 2000 || year > 2100) return null;
	return year;
}

function parseAgency(raw: string): string | null {
	if (!isValidAgencyName(raw)) return null;
	return normalizeAgencyName(raw);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toNullableInteger(value: unknown): number | null {
	if (value == null) return null;
	if (typeof value !== 'number' || !Number.isFinite(value)) return null;
	return Math.trunc(value);
}

function normalizeComparable(value: unknown): string | number | boolean | null {
	if (value == null) return null;
	if (typeof value === 'number' || typeof value === 'boolean') return value;
	const text = String(value).trim();
	return text.length > 0 ? text : null;
}

function normalizeNumber(value: unknown): number | null {
	if (value == null) return null;
	if (typeof value !== 'number' || !Number.isFinite(value)) return null;
	return Math.trunc(value);
}

function humanizeKey(value: string): string {
	return value
		.replace(/[_-]+/g, ' ')
		.trim()
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

function displayActivityValue(value: unknown): string {
	if (value == null || value === '') return '—';
	if (typeof value === 'number') return new Intl.NumberFormat('en-US').format(value);
	if (typeof value === 'boolean') return value ? 'Yes' : 'No';
	if (Array.isArray(value)) return value.map((entry) => displayActivityValue(entry)).join(' · ');
	if (isPlainObject(value)) {
		return Object.entries(value)
			.map(([key, entry]) => `${humanizeKey(key)}: ${displayActivityValue(entry)}`)
			.join(' · ');
	}
	return String(value);
}

function makeChange(input: {
	field: string;
	from: unknown;
	to: unknown;
	section?: string | null;
	context?: string | null;
}): ActivityChange {
	return {
		section: input.section ?? null,
		field: input.field,
		from: input.from,
		to: input.to,
		context: input.context ?? null,
		fromDisplay: displayActivityValue(input.from),
		toDisplay: displayActivityValue(input.to)
	};
}

function yesNo(value: boolean): string {
	return value ? 'Y' : 'N';
}

function buildOverviewChanges(input: {
	type: FormType;
	existing: OverviewRow | null;
	capabilities: ReturnType<typeof assertCapabilities>;
}): ActivityChange[] {
	const selectedModes = new Set(input.capabilities.selectedModes);
	const changes: ActivityChange[] = [];
	const fields: {
		section: string;
		field: string;
		from: unknown;
		to: unknown;
	}[] = [
		{
			section: 'System Information',
			field: 'CTP Grantee Legal Name',
			from: input.existing?.systemName,
			to: input.capabilities.ctpGranteeLegalName
		},
		{
			section: 'System Information',
			field: 'Contact First Name',
			from: input.existing?.firstName,
			to: input.capabilities.contactFirstName
		},
		{
			section: 'System Information',
			field: 'Contact Middle Initial',
			from: input.existing?.middleInitial,
			to: input.capabilities.contactMiddleInitial
		},
		{
			section: 'System Information',
			field: 'Contact Last Name',
			from: input.existing?.lastName,
			to: input.capabilities.contactLastName
		},
		{ section: 'System Information', field: 'Email', from: input.existing?.email, to: input.capabilities.email },
		{ section: 'System Information', field: 'Phone', from: input.existing?.phone, to: input.capabilities.phone },
		{ section: 'System Information', field: 'Fax', from: input.existing?.fax, to: input.capabilities.fax },
		{
			section: 'System Information',
			field: 'Date',
			from: input.existing?.date,
			to: input.capabilities.date
		},
		{
			section: 'Operating Hours',
			field: 'Weekday Peak Routes',
			from: input.existing?.wkdayRouteCounter,
			to: input.capabilities.days.weekday.peakRoutes
		},
		{
			section: 'Operating Hours',
			field: 'Saturday Offered',
			from: Boolean(input.existing?.satBeginTime || input.existing?.satEndTime || input.existing?.satRouteCounter),
			to: input.capabilities.days.saturday.offered
		},
		{
			section: 'Operating Hours',
			field: 'Sunday Offered',
			from: Boolean(input.existing?.sunBeginTime || input.existing?.sunEndTime || input.existing?.sunRouteCounter),
			to: input.capabilities.days.sunday.offered
		}
	];

	if (input.type === 'urban') {
		fields.push(
			{
				section: 'Operating Modes',
				field: 'Fixed Route',
				from: input.existing?.fr,
				to: yesNo(selectedModes.has('fixed_route'))
			},
			{
				section: 'Operating Modes',
				field: 'Dial-A-Ride',
				from: input.existing?.dr,
				to: yesNo(selectedModes.has('dial_a_ride'))
			},
			{
				section: 'Operating Modes',
				field: 'Light Rail',
				from: input.existing?.lr,
				to: yesNo(selectedModes.has('light_rail'))
			},
			{
				section: 'Operating Modes',
				field: 'Street Car',
				from: input.existing?.sc,
				to: yesNo(selectedModes.has('street_car'))
			},
			{
				section: 'Operating Modes',
				field: 'Vanpool',
				from: input.existing?.vp,
				to: yesNo(selectedModes.has('vanpool'))
			},
			{
				section: 'Operating Modes',
				field: 'Microtransit',
				from: input.existing?.mt,
				to: yesNo(selectedModes.has('microtransit'))
			}
		);
	} else {
		fields.push(
			{ section: 'Operating Modes', field: 'DR DO', from: input.existing?.drDo, to: yesNo(selectedModes.has('dr_do')) },
			{ section: 'Operating Modes', field: 'DR PT', from: input.existing?.drPt, to: yesNo(selectedModes.has('dr_pt')) },
			{ section: 'Operating Modes', field: 'MB DO', from: input.existing?.mbDo, to: yesNo(selectedModes.has('mb_do')) },
			{ section: 'Operating Modes', field: 'MB PT', from: input.existing?.mbPt, to: yesNo(selectedModes.has('mb_pt')) },
			{ section: 'Operating Modes', field: 'MT DO', from: input.existing?.mtDo, to: yesNo(selectedModes.has('mt_do')) },
			{ section: 'Operating Modes', field: 'MT PT', from: input.existing?.mtPt, to: yesNo(selectedModes.has('mt_pt')) }
		);
	}

	for (const field of fields) {
		const from = normalizeComparable(field.from);
		const to = normalizeComparable(field.to);
		if (from !== to) changes.push(makeChange(field));
	}

	return changes;
}

function urbanFinanceRowLabel(rowId: string): string {
	return URBAN_FINANCE_ROW_LABELS[rowId] ?? humanizeKey(rowId);
}

function ruralFinanceRowLabel(rowId: string): string {
	return humanizeKey(rowId);
}

function buildCellChange(input: {
	section?: string | null;
	field: string;
	context?: string | null;
	from: unknown;
	to: unknown;
	zeroAsBlank?: boolean;
}): ActivityChange | null {
	const normalize = input.zeroAsBlank
		? (value: unknown) => {
				const comparable = normalizeComparable(value);
				return comparable === 0 ? null : comparable;
			}
		: normalizeComparable;
	const from = normalize(input.from);
	const to = normalize(input.to);
	if (from === to) return null;
	return makeChange({
		section: input.section ?? null,
		field: input.field,
		context: input.context ?? null,
		from: input.from,
		to: input.to
	});
}

function buildUrbanFinanceChanges(input: {
	existing: Record<string, (number | null)[]> | null;
	next: Record<string, unknown>;
}): ActivityChange[] {
	const changes: ActivityChange[] = [];
	for (const [rowId, rowValues] of Object.entries(input.next)) {
		if (!Array.isArray(rowValues)) continue;
		const existingValues = input.existing?.[rowId] ?? [];
		for (let index = 0; index < URBAN_FINANCE_COLUMN_LABELS.length; index++) {
			const change = buildCellChange({
				section: 'Urban Finance',
			field: urbanFinanceRowLabel(rowId),
			context: URBAN_FINANCE_COLUMN_LABELS[index],
			from: existingValues[index] ?? null,
			to: rowValues[index] ?? null,
			zeroAsBlank: true
			});
			if (change) changes.push(change);
		}
	}
	return changes;
}

function buildRuralFinanceChanges(input: {
	existingDraft: Record<string, (number | null)[]> | null;
	existingDescriptions: Record<string, string> | null;
	nextDraft: Record<string, unknown>;
	nextDescriptions: Record<string, unknown>;
}): ActivityChange[] {
	const changes: ActivityChange[] = [];
	for (const [rowId, rowValues] of Object.entries(input.nextDraft)) {
		if (!Array.isArray(rowValues)) continue;
		const existingValues = input.existingDraft?.[rowId] ?? [];
		for (let index = 0; index < RURAL_FINANCE_COLUMN_LABELS.length; index++) {
			const change = buildCellChange({
				section: 'Rural Finance',
			field: ruralFinanceRowLabel(rowId),
			context: RURAL_FINANCE_COLUMN_LABELS[index],
			from: existingValues[index] ?? null,
			to: rowValues[index] ?? null,
			zeroAsBlank: true
			});
			if (change) changes.push(change);
		}
	}

	for (const [rowId, nextDescription] of Object.entries(input.nextDescriptions)) {
		const change = buildCellChange({
			section: 'Rural Finance',
			field: `${ruralFinanceRowLabel(rowId)} Description`,
			from: input.existingDescriptions?.[rowId] ?? '',
			to: typeof nextDescription === 'string' ? nextDescription : ''
		});
		if (change) changes.push(change);
	}

	return changes;
}

function getMonthlyRow(
	rowsByKey: Map<string, MonthlyWriteRow>,
	args: {
		systemId: number;
		year: number;
		month: number;
		dayType: string;
		serviceType: string;
	}
): MonthlyWriteRow {
	const key = `${args.month}:${args.dayType}:${args.serviceType}`;
	const existing = rowsByKey.get(key);
	if (existing) return existing;

	const next: MonthlyWriteRow = {
		systemId: args.systemId,
		year: args.year,
		month: args.month,
		dayType: args.dayType,
		serviceType: args.serviceType
	};
	rowsByKey.set(key, next);
	return next;
}

function buildMonthlyRowsFromGridDraft(args: {
	systemId: number;
	year: number;
	type: FormType;
	daySlug: DaySlug;
	draft: unknown;
}): MonthlyWriteRow[] {
	if (!isPlainObject(args.draft)) return [];

	const dayType = DAY_TYPE_BY_SLUG[args.daySlug];
	const serviceTypeByMode =
		args.type === 'urban' ? URBAN_SERVICE_TYPE_BY_MODE : RURAL_SERVICE_TYPE_BY_MODE;
	const serviceTypes = Array.from(new Set(Object.values(serviceTypeByMode)));
	const rowsByKey = new Map<string, MonthlyWriteRow>();

	for (const [rowId, rawValues] of Object.entries(args.draft)) {
		if (!Array.isArray(rawValues)) continue;
		if (rowId.endsWith('__section') || rowId.startsWith('transit_totals_')) continue;

		if (rowId === 'operating_days') {
			for (let columnIndex = 0; columnIndex < MONTH_BY_COLUMN.length; columnIndex++) {
				for (const serviceType of serviceTypes) {
					const monthlyRow = getMonthlyRow(rowsByKey, {
						systemId: args.systemId,
						year: args.year,
						month: MONTH_BY_COLUMN[columnIndex],
						dayType,
						serviceType
					});
					monthlyRow.operatingDays = toNullableInteger(rawValues[columnIndex]);
				}
			}
			continue;
		}

		const separatorIndex = rowId.indexOf('__');
		if (separatorIndex === -1) continue;
		const mode = rowId.slice(0, separatorIndex);
		const suffix = rowId.slice(separatorIndex + 2);
		const serviceType = serviceTypeByMode[mode];
		const field = MONTHLY_FIELD_BY_SUFFIX[suffix];
		if (!serviceType || !field) continue;

		for (let columnIndex = 0; columnIndex < MONTH_BY_COLUMN.length; columnIndex++) {
			const monthlyRow = getMonthlyRow(rowsByKey, {
				systemId: args.systemId,
				year: args.year,
				month: MONTH_BY_COLUMN[columnIndex],
				dayType,
				serviceType
			});
			monthlyRow[field] = toNullableInteger(rawValues[columnIndex]);
		}
	}

	return Array.from(rowsByKey.values());
}

function monthlyRowKey(row: Pick<MonthlyWriteRow, 'month' | 'dayType' | 'serviceType'>): string {
	return `${row.month}:${row.dayType}:${row.serviceType}`;
}

function monthlyFieldLabel(row: MonthlyWriteRow, field: MonthlyValueField): string {
	const day = DAY_LABEL_BY_TYPE[row.dayType] ?? row.dayType;
	const month = MONTH_LABEL_BY_MONTH[row.month] ?? `Month ${row.month}`;
	const service = SERVICE_LABEL_BY_TYPE[row.serviceType] ?? row.serviceType;
	const metric = MONTHLY_FIELD_LABEL[field];
	if (field === 'operatingDays') return `${day} / ${month} / ${metric}`;
	return `${day} / ${month} / ${service} / ${metric}`;
}

function buildMonthlyChanges(input: {
	rows: MonthlyWriteRow[];
	existingRows: Map<string, MonthlyPersistedRow>;
}): ActivityChange[] {
	const changes: ActivityChange[] = [];

	for (const row of input.rows) {
		const existing = input.existingRows.get(monthlyRowKey(row));
		for (const field of MONTHLY_VALUE_FIELDS) {
			if (!Object.prototype.hasOwnProperty.call(row, field)) continue;
			const from = normalizeNumber(existing?.[field]);
			const to = normalizeNumber(row[field]);
			if (from === to) continue;
			changes.push(
				makeChange({
					section: 'Monthly Data',
					field: monthlyFieldLabel(row, field),
					from,
					to
				})
			);
		}
	}

	return changes;
}

function summarizeSaveChanges(input: { type: FormType; year: number; changes: ActivityChange[] }): string {
	const label = `${input.type === 'urban' ? 'Urban' : 'Rural'} • FY${input.year}`;
	if (input.changes.length === 0) return `Saved form changes (${label})`;
	const allAdditions = input.changes.every((change) => change.from == null && change.to != null);
	return `${allAdditions ? 'Added values' : 'Edited values'} (${label} • ${input.changes.length} change${input.changes.length === 1 ? '' : 's'})`;
}

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const agency = parseAgency(params.agency);
	const type = parseType(params.type);
	const year = parseYear(params.year);

	if (!agency || !type || year == null) {
		return json({ error: 'Invalid request parameters' }, { status: 400 });
	}
	if (!canAccessAgency(locals.userScope, agency)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	return json({ report: null });
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const agency = parseAgency(params.agency);
	const type = parseType(params.type);
	const year = parseYear(params.year);

	if (!agency || !type || year == null) {
		return json({ error: 'Invalid request parameters' }, { status: 400 });
	}
	if (!canAccessAgency(locals.userScope, agency)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const body = (await request.json().catch(() => null)) as
		| { slices?: LocalFormSlices }
		| null;
	if (!body || !isPlainObject(body.slices)) {
		return json({ error: 'Request body must include a slices object' }, { status: 400 });
	}
	const slices = body.slices;

	try {
		const repo = getOpStatsRepository();
		const systemId = await repo.resolveWritableSystemIdByAgencyName(agency, type);
		if (!systemId) {
			await getActivityRepository().log({
				userEmail: locals.user.email ?? null,
				agency,
				action: 'forms.save_failed',
				entityType: 'forms_report',
				entityId: `${type}:${year}`,
				metadata: {
					type,
					year,
					reason: 'missing_writable_system_id'
				}
			});
			return json(
				{
					error: `No writable OpStats SystemID mapping found for agency "${agency}".`
				},
				{ status: 404 }
			);
		}

		const capabilitiesSlice = slices[`capabilities:${type}:${year}`];
		let overviewChanges: ActivityChange[] = [];
		if (capabilitiesSlice !== undefined) {
			const capabilities = assertCapabilities(capabilitiesSlice);
			const existingOverview = await repo.getOverviewRow({ systemId, year });
			overviewChanges = buildOverviewChanges({ type, existing: existingOverview, capabilities });
			await repo.upsertOverview({ systemId, year, type, capabilities });
		}

		const monthlyRows = (['weekday', 'saturday', 'sunday'] as const).flatMap((daySlug) =>
			buildMonthlyRowsFromGridDraft({
				systemId,
				year,
				type,
				daySlug,
				draft: slices[`grid:${type}:${year}:${daySlug}`]
			})
		);
		const existingMonthlyRows = await repo.getMonthlyRowsForWriteRows(monthlyRows);
		const monthlyChanges = buildMonthlyChanges({ rows: monthlyRows, existingRows: existingMonthlyRows });
		await repo.upsertMonthlyRows(monthlyRows);

		const financeSlice = slices[`finance:${type}:${year}:urban-financial`];
		const financeDescriptionsSlice = slices[`finance:${type}:${year}:rural-financial:descriptions`];
		const completionSlice = slices[`completion:${type}:${year}:rural`];
		const reconciliationSlice = slices[`reconciliation:${type}:${year}:urban`];
		const annualStatisticsSlice = slices[`annual-statistics:${type}:${year}`];
		const physicalAssaultSlice = slices[`assaults:${type}:${year}:physical-assaults`];
		const nonPhysicalAssaultSlice = slices[`assaults:${type}:${year}:non-physical-assaults`];
		const otherSafetySlice = slices[`other-safety-security:${type}:${year}:v2`];
		const savedSections: string[] = [];
		let financeChanges: ActivityChange[] = [];

		if (financeSlice !== undefined) {
			if (type === 'urban') {
				const existingUrbanFinance = await repo.getUrbanFinancialDraft({ systemId, year });
				financeChanges = buildUrbanFinanceChanges({
					existing: existingUrbanFinance,
					next: financeSlice as Record<string, unknown>
				});
				await repo.upsertUrbanFinancialDraft({
					systemId,
					year,
					draft: financeSlice as Record<string, (number | null)[]>
				});
			} else {
				const existingRuralFinance = await repo.getRuralFinancialDraft({ systemId, year });
				financeChanges = buildRuralFinanceChanges({
					existingDraft: existingRuralFinance?.draft ?? null,
					existingDescriptions: existingRuralFinance?.descriptions ?? null,
					nextDraft: financeSlice as Record<string, unknown>,
					nextDescriptions:
						(financeDescriptionsSlice &&
						typeof financeDescriptionsSlice === 'object' &&
						!Array.isArray(financeDescriptionsSlice))
							? (financeDescriptionsSlice as Record<string, unknown>)
							: {}
				});
				await repo.upsertRuralFinancialDraft({
					systemId,
					year,
					draft: {
						draft: financeSlice as Record<string, (number | null)[]>,
						descriptions:
							(financeDescriptionsSlice &&
							typeof financeDescriptionsSlice === 'object' &&
							!Array.isArray(financeDescriptionsSlice))
								? (financeDescriptionsSlice as Record<string, string>)
								: {}
					}
				});
			}
			savedSections.push('finance');
		}

		if (annualStatisticsSlice !== undefined) {
			await repo.upsertAnnualStatisticsDraft({
				systemId,
				year,
				draft: annualStatisticsSlice as AnnualStatisticsDraft
			});
			savedSections.push('annual-statistics');
		}

		if (type === 'rural' && completionSlice !== undefined) {
			await repo.upsertRuralCompletionDraft({
				systemId,
				year,
				draft: completionSlice as FinancialOutcomeDraft
			});
			savedSections.push('completion');
		}

		if (type === 'urban' && reconciliationSlice !== undefined) {
			await repo.upsertUrbanFinancialOutcomeDraft({
				systemId,
				year,
				draft: reconciliationSlice as FinancialOutcomeDraft
			});
			savedSections.push('reconciliation');
		}

		if (physicalAssaultSlice !== undefined) {
			await repo.upsertAssaultSafetyDraft({
				systemId,
				year,
				kind: 'physical',
				draft: physicalAssaultSlice as Record<string, (number | null)[]>
			});
			savedSections.push('physical-assaults');
		}

		if (nonPhysicalAssaultSlice !== undefined) {
			await repo.upsertAssaultSafetyDraft({
				systemId,
				year,
				kind: 'nonPhysical',
				draft: nonPhysicalAssaultSlice as Record<string, (number | null)[]>
			});
			savedSections.push('non-physical-assaults');
		}

		if (otherSafetySlice !== undefined) {
			await repo.upsertOtherSafetyDraft({
				systemId,
				year,
				draft: otherSafetySlice as Record<string, (number | null)[]>
			});
			savedSections.push('other-safety-and-security-data');
		}

		const changes = [...overviewChanges, ...monthlyChanges, ...financeChanges];

		await getActivityRepository().log({
			userEmail: locals.user.email ?? null,
			systemId,
			agency,
			action: 'forms.save_succeeded',
			entityType: 'forms_report',
			entityId: `${type}:${year}`,
			metadata: {
				type,
				year,
				hasOverview: capabilitiesSlice !== undefined,
				savedSections,
				summary: summarizeSaveChanges({ type, year, changes }),
				changes,
				changeCount: changes.length
			}
		});

		return json({
			report: {
				agency,
				type,
				year,
				slices,
				updatedAt: new Date().toISOString(),
				updatedBy: locals.user.email ?? null
			}
		});
	} catch (error) {
		console.error('Failed to save forms report', error);
		await getActivityRepository().log({
			userEmail: locals.user.email ?? null,
			agency,
			action: 'forms.save_failed',
			entityType: 'forms_report',
			entityId: `${type}:${year}`,
			metadata: {
				type,
				year,
				reason: error instanceof Error ? error.message : 'unknown_error'
			}
		});
		return json({ error: 'Failed to save forms report' }, { status: 500 });
	}
};
