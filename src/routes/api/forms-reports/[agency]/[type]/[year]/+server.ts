import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidAgencyName, normalizeAgencyName } from '$lib/features/forms/persistence/agency';
import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';
import type { LocalFormSlices } from '$lib/features/forms/persistence/formsReport.types';
import { canAccessAgency } from '$lib/server/rbac';
import { assertCapabilities } from '$lib/features/forms/shared/guards/capabilities.guard';
import {
	getOpStatsRepository,
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
	field: string;
	from: string | number | boolean | null;
	to: string | number | boolean | null;
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
		field: string;
		from: unknown;
		to: unknown;
	}[] = [
		{
			field: 'CTP Grantee Legal Name',
			from: input.existing?.systemName,
			to: input.capabilities.ctpGranteeLegalName
		},
		{ field: 'Contact First Name', from: input.existing?.firstName, to: input.capabilities.contactFirstName },
		{
			field: 'Contact Middle Initial',
			from: input.existing?.middleInitial,
			to: input.capabilities.contactMiddleInitial
		},
		{ field: 'Contact Last Name', from: input.existing?.lastName, to: input.capabilities.contactLastName },
		{ field: 'Email', from: input.existing?.email, to: input.capabilities.email },
		{ field: 'Phone', from: input.existing?.phone, to: input.capabilities.phone },
		{ field: 'Fax', from: input.existing?.fax, to: input.capabilities.fax },
		{
			field: 'Weekday Peak Routes',
			from: input.existing?.wkdayRouteCounter,
			to: input.capabilities.days.weekday.peakRoutes
		},
		{
			field: 'Saturday Offered',
			from: Boolean(input.existing?.satBeginTime || input.existing?.satEndTime || input.existing?.satRouteCounter),
			to: input.capabilities.days.saturday.offered
		},
		{
			field: 'Sunday Offered',
			from: Boolean(input.existing?.sunBeginTime || input.existing?.sunEndTime || input.existing?.sunRouteCounter),
			to: input.capabilities.days.sunday.offered
		}
	];

	if (input.type === 'urban') {
		fields.push(
			{ field: 'Fixed Route', from: input.existing?.fr, to: yesNo(selectedModes.has('fixed_route')) },
			{ field: 'Dial-A-Ride', from: input.existing?.dr, to: yesNo(selectedModes.has('dial_a_ride')) },
			{ field: 'Light Rail', from: input.existing?.lr, to: yesNo(selectedModes.has('light_rail')) },
			{ field: 'Street Car', from: input.existing?.sc, to: yesNo(selectedModes.has('street_car')) },
			{ field: 'Vanpool', from: input.existing?.vp, to: yesNo(selectedModes.has('vanpool')) },
			{ field: 'Microtransit', from: input.existing?.mt, to: yesNo(selectedModes.has('microtransit')) }
		);
	} else {
		fields.push(
			{ field: 'DR DO', from: input.existing?.drDo, to: yesNo(selectedModes.has('dr_do')) },
			{ field: 'DR PT', from: input.existing?.drPt, to: yesNo(selectedModes.has('dr_pt')) },
			{ field: 'MB DO', from: input.existing?.mbDo, to: yesNo(selectedModes.has('mb_do')) },
			{ field: 'MB PT', from: input.existing?.mbPt, to: yesNo(selectedModes.has('mb_pt')) },
			{ field: 'MT DO', from: input.existing?.mtDo, to: yesNo(selectedModes.has('mt_do')) },
			{ field: 'MT PT', from: input.existing?.mtPt, to: yesNo(selectedModes.has('mt_pt')) }
		);
	}

	for (const field of fields) {
		const from = normalizeComparable(field.from);
		const to = normalizeComparable(field.to);
		if (from !== to) changes.push({ field: field.field, from, to });
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
	const rowsByKey = new Map<string, MonthlyWriteRow>();

	for (const [rowId, rawValues] of Object.entries(args.draft)) {
		if (!Array.isArray(rawValues)) continue;
		if (rowId.endsWith('__section') || rowId.startsWith('transit_totals_')) continue;

		if (rowId === 'operating_days') {
			for (let columnIndex = 0; columnIndex < MONTH_BY_COLUMN.length; columnIndex++) {
				const monthlyRow = getMonthlyRow(rowsByKey, {
					systemId: args.systemId,
					year: args.year,
					month: MONTH_BY_COLUMN[columnIndex],
					dayType,
					serviceType: 'ALL'
				});
				monthlyRow.operatingDays = toNullableInteger(rawValues[columnIndex]);
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
			changes.push({
				field: monthlyFieldLabel(row, field),
				from,
				to
			});
		}
	}

	return changes;
}

function summarizeSaveChanges(input: { type: FormType; year: number; changes: ActivityChange[] }): string {
	const label = `${input.type === 'urban' ? 'Urban' : 'Rural'} • FY${input.year}`;
	if (input.changes.length === 0) return `Saved form changes (${label})`;
	const allAdditions = input.changes.every((change) => change.from == null && change.to != null);
	return `${allAdditions ? 'Added values' : 'Edited values'} (${label})`;
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
		const systemId = await repo.resolveWritableSystemIdByAgencyName(agency);
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
		const changes = [...overviewChanges, ...monthlyChanges];
		await repo.upsertMonthlyRows(monthlyRows);

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
