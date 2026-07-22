import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getFormsReportPool } from '$lib/server/formsReport/db';
import type { Capabilities } from '$lib/features/forms/shared/types/capabilities.types';
import {
	getTransitAgencySystemId,
	getTransitAgencySystemIds
} from '$lib/features/forms/persistence/agency';

export type FormType = 'urban' | 'rural';
export type DaySlug = 'weekday' | 'saturday' | 'sunday';

export type MonthlyRow = {
	month: number;
	dayType?: string;
	serviceType: string;
	operatingDays: number | null;
	hours: number | null;
	miles: number | null;
	passTripsNonCon: number | null;
	passTripsMedCon: number | null;
	passTripsNonMedCon: number | null;
	peakVehAmPm: number | null;
	peakVehMidday: number | null;
};

export type DaySnapshot = {
	systemId: number;
	year: number;
	daySlug: DaySlug;
	rows: MonthlyRow[];
};

export type OverviewRow = {
	systemId: number;
	fiscalYear: number;
	systemName: string | null;
	firstName: string | null;
	middleInitial: string | null;
	lastName: string | null;
	email: string | null;
	phone: string | null;
	fax: string | null;
	date: Date | string | null;
	serviceAreaType: string | null;
	countiesServed: string | null;
	drDo: string | null;
	drPt: string | null;
	mbDo: string | null;
	mbPt: string | null;
	mtDo: string | null;
	mtPt: string | null;
	fr: string | null;
	dr: string | null;
	lr: string | null;
	sc: string | null;
	vp: string | null;
	mt: string | null;
	wkdayBeginTime: Date | string | null;
	wkdayEndTime: Date | string | null;
	wkdayRouteCounter: number | null;
	satBeginTime: Date | string | null;
	satEndTime: Date | string | null;
	satRouteCounter: number | null;
	sunBeginTime: Date | string | null;
	sunEndTime: Date | string | null;
	sunRouteCounter: number | null;
	contractorName: string | null;
	contractorBegin: Date | string | null;
	contractorEnd: Date | string | null;
	outOfCounty: string | null;
	otherCountiesServed: string | null;
	coordination: string | null;
	coordinatedCounties: string | null;
};

export type MonthlyWriteRow = {
	systemId: number;
	year: number;
	month: number;
	dayType: string;
	serviceType: string;
	operatingDays?: number | null;
	hours?: number | null;
	miles?: number | null;
	passTripsNonCon?: number | null;
	passTripsMedCon?: number | null;
	passTripsNonMedCon?: number | null;
	passTripsBroMedCon?: number | null;
	peakVehAmPm?: number | null;
	peakVehMidday?: number | null;
};

export type MonthlyPersistedRow = Required<
	Pick<MonthlyWriteRow, 'systemId' | 'year' | 'month' | 'dayType' | 'serviceType'>
> &
	Pick<
		MonthlyWriteRow,
		| 'operatingDays'
		| 'hours'
		| 'miles'
		| 'passTripsNonCon'
		| 'passTripsMedCon'
		| 'passTripsNonMedCon'
		| 'passTripsBroMedCon'
		| 'peakVehAmPm'
		| 'peakVehMidday'
	>;

export type FormDraftGrid = Record<string, (number | null)[]>;

export type AnnualStatisticsDraft = {
	volunteerDrivers: number | null;
	personalVehiclesUsed: number | null;
	incidentalMiles: number | null;
	incidentalHours: number | null;
	incidentalDescription: string;
	caresMiles: number | null;
	caresHours: number | null;
	caresDescription: string;
	nonAmbulatoryPassengerTrips: number | null;
	maintenanceMethod: string;
	ownedVehicles: number | null;
	leasedVehicles: number | null;
	ntdEvents: number | null;
	ntdFatalities: number | null;
	ntdInjuries: number | null;
	operationsChangeNotes: string;
	employees: Record<
		'administrative' | 'maintenance' | 'driver' | 'otherOperational',
		{
			ftHowMany: number | null;
			ftPayHours: number | null;
			ptHowMany: number | null;
			ptPayHours: number | null;
		}
	>;
	tripsServed: Record<
		| 'vocationalRehabilitation'
		| 'vocationalWorkshop'
		| 'headstart'
		| 'nursingHomeAssistedLiving'
		| 'unitedWay'
		| 'parksAndRecreation'
		| 'localEmployer'
		| 'dssMedicaid'
		| 'dssWorkFirst'
		| 'dssOther'
		| 'seniorServices'
		| 'mentalHealth'
		| 'other',
		boolean
	>;
};

export type RuralFinancialDraft = {
	draft: FormDraftGrid;
	descriptions: Record<string, string>;
};

export type FinancialOutcomeDraft = {
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

type MonthlyMetricKey = Exclude<
	keyof MonthlyWriteRow,
	'systemId' | 'year' | 'month' | 'dayType' | 'serviceType'
>;

const DAY_TYPE_BY_SLUG: Record<DaySlug, string> = {
	weekday: 'Wk',
	saturday: 'SA',
	sunday: 'Su'
};

const TYPE_SERVICE_FILTERS: Record<FormType, string[]> = {
	urban: ['ALL', 'DR', 'FR', 'LR', 'SC', 'VP', 'MT'],
	rural: ['ALL', 'DR DO', 'DR PT', 'MB DO', 'MB PT', 'MT DO', 'MT PT']
};

type AgencyLookupRow = RowDataPacket & {
	systemId: number;
};

type YearLookupRow = RowDataPacket & {
	fiscalYear: number;
};

type ServiceTypeLookupRow = RowDataPacket & {
	serviceType: string;
};

type MonthlyLookupRow = RowDataPacket & {
	month: number;
	dayType?: string;
	serviceType: string;
	operatingDays: number | null;
	hours: number | null;
	miles: number | null;
	passTripsNonCon: number | null;
	passTripsMedCon: number | null;
	passTripsNonMedCon: number | null;
	passTripsBroMedCon?: number | null;
	peakVehAmPm: number | null;
	peakVehMidday: number | null;
};

type OverviewLookupRow = RowDataPacket & {
	systemId: number;
	fiscalYear: number;
	systemName: string | null;
	firstName: string | null;
	middleInitial: string | null;
	lastName: string | null;
	email: string | null;
	phone: string | null;
	fax: string | null;
	date: Date | string | null;
	serviceAreaType: string | null;
	countiesServed: string | null;
	drDo: string | null;
	drPt: string | null;
	mbDo: string | null;
	mbPt: string | null;
	mtDo: string | null;
	mtPt: string | null;
	fr: string | null;
	dr: string | null;
	lr: string | null;
	sc: string | null;
	vp: string | null;
	mt: string | null;
	wkdayBeginTime: Date | string | null;
	wkdayEndTime: Date | string | null;
	wkdayRouteCounter: number | null;
	satBeginTime: Date | string | null;
	satEndTime: Date | string | null;
	satRouteCounter: number | null;
	sunBeginTime: Date | string | null;
	sunEndTime: Date | string | null;
	sunRouteCounter: number | null;
	contractorName: string | null;
	contractorBegin: Date | string | null;
	contractorEnd: Date | string | null;
	outOfCounty: string | null;
	otherCountiesServed: string | null;
	coordination: string | null;
	coordinatedCounties: string | null;
};

function emptyToNull(value: string | undefined | null): string | null {
	const trimmed = String(value ?? '').trim();
	return trimmed.length > 0 ? trimmed : null;
}

function boolFlag(value: boolean): string {
	return value ? 'Y' : 'N';
}

function selectedFlag(selectedModes: Set<string>, mode: string): string {
	return boolFlag(selectedModes.has(mode));
}

function toDateTime(value: string | undefined | null): string | null {
	const trimmed = String(value ?? '').trim();
	if (!trimmed) return null;
	return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed} 00:00:00` : trimmed;
}

function toTimeDateTime(value: string | undefined | null): string | null {
	const trimmed = String(value ?? '').trim();
	if (!trimmed) return null;

	const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
	if (!match) return trimmed;

	let hour = Number(match[1]);
	const minute = Number(match[2]);
	const suffix = match[3].toUpperCase();
	if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
	if (suffix === 'PM' && hour !== 12) hour += 12;
	if (suffix === 'AM' && hour === 12) hour = 0;
	return `1970-01-01 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

function toNullableInteger(value: number | undefined | null): number | null {
	if (value == null || !Number.isFinite(value)) return null;
	return Math.trunc(value);
}

function dbNumber(value: unknown): number | null {
	if (value == null || value === '') return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function dbString(value: unknown): string {
	return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function dbTripFlag(value: unknown): boolean {
	const parsed = dbNumber(value);
	return parsed != null && parsed > 0;
}

function toNullableText(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function toNullableDateTimeText(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

async function upsertTableRow(
	pool: Pool,
	table: string,
	keyColumns: string[],
	values: Record<string, unknown>
): Promise<void> {
	const columns = Object.keys(values);
	const updateColumns = columns.filter((column) => !keyColumns.includes(column));
	const updateValues = updateColumns.map((column) => values[column]);
	const keyValues = keyColumns.map((column) => values[column]);

	const [result] = await pool.query<ResultSetHeader>(
		`UPDATE ${table}
		 SET ${updateColumns.map((column) => `${column} = ?`).join(', ')}
		 WHERE ${keyColumns.map((column) => `${column} = ?`).join(' AND ')}`,
		[...updateValues, ...keyValues]
	);

	if (result.affectedRows > 0) return;

	await pool.query<ResultSetHeader>(
		`INSERT INTO ${table} (${columns.join(', ')})
		 VALUES (${columns.map(() => '?').join(', ')})`,
		columns.map((column) => values[column])
	);
}

class OpStatsRepository {
	constructor(private readonly pool: Pool) {}

	async resolveSystemIdByAgencyName(agency: string): Promise<number | null> {
		const normalized = agency.trim().toUpperCase();
		if (!normalized) return null;

		const [exactRows] = await this.pool.query<AgencyLookupRow[]>(
			`SELECT SystemID AS systemId
			 FROM tblAll_SystemInfo
			 WHERE UPPER(TRIM(SystemName)) = ?
			 LIMIT 1`,
			[normalized]
		);
		if (exactRows[0]?.systemId != null) return Number(exactRows[0].systemId);

		const [overviewRows] = await this.pool.query<AgencyLookupRow[]>(
			`SELECT SystemID AS systemId
			 FROM tblAll_Overview
			 WHERE UPPER(TRIM(SystemName_1)) = ?
			 LIMIT 1`,
			[normalized]
		);
		if (overviewRows[0]?.systemId != null) return Number(overviewRows[0].systemId);

		const [codeRows] = await this.pool.query<AgencyLookupRow[]>(
			`SELECT SystemID AS systemId
			 FROM tblAll_SystemInfo
			 WHERE UPPER(TRIM(PTD_ID)) = ?
			 LIMIT 1`,
			[normalized]
		);
		if (codeRows[0]?.systemId != null) return Number(codeRows[0].systemId);

		const like = `%${normalized}%`;
		const [likeRows] = await this.pool.query<AgencyLookupRow[]>(
			`SELECT SystemID AS systemId
			 FROM tblAll_SystemInfo
			 WHERE UPPER(SystemName) LIKE ?
			 ORDER BY CHAR_LENGTH(SystemName) ASC
			 LIMIT 1`,
			[like]
		);
		if (likeRows[0]?.systemId != null) return Number(likeRows[0].systemId);

		return null;
	}

	async resolveWritableSystemIdByAgencyName(
		agency: string,
		type?: FormType
	): Promise<number | null> {
		const mapped = getTransitAgencySystemId(agency, type);
		if (mapped != null) return mapped;

		const normalized = agency.trim().toUpperCase();
		if (!normalized) return null;

		const [exactRows] = await this.pool.query<AgencyLookupRow[]>(
			`SELECT SystemID AS systemId
			 FROM \`tblAll_SystemInfo(OLD)\`
			 WHERE UPPER(TRIM(SystemName)) = ?
			 LIMIT 1`,
			[normalized]
		);
		if (exactRows[0]?.systemId != null) return Number(exactRows[0].systemId);

		const [overviewRows] = await this.pool.query<AgencyLookupRow[]>(
			`SELECT overview.SystemID AS systemId
			 FROM tblAll_Overview overview
			 INNER JOIN \`tblAll_SystemInfo(OLD)\` system_info
			   ON system_info.SystemID = overview.SystemID
			 WHERE UPPER(TRIM(overview.SystemName_1)) = ?
			 LIMIT 1`,
			[normalized]
		);
		if (overviewRows[0]?.systemId != null) return Number(overviewRows[0].systemId);

		const [codeRows] = await this.pool.query<AgencyLookupRow[]>(
			`SELECT SystemID AS systemId
			 FROM \`tblAll_SystemInfo(OLD)\`
			 WHERE UPPER(TRIM(PTD_ID)) = ?
			 LIMIT 1`,
			[normalized]
		);
		if (codeRows[0]?.systemId != null) return Number(codeRows[0].systemId);

		const like = `%${normalized}%`;
		const [likeRows] = await this.pool.query<AgencyLookupRow[]>(
			`SELECT SystemID AS systemId
			 FROM \`tblAll_SystemInfo(OLD)\`
			 WHERE UPPER(SystemName) LIKE ?
			 ORDER BY CHAR_LENGTH(SystemName) ASC
			 LIMIT 1`,
			[like]
		);
		if (likeRows[0]?.systemId != null) return Number(likeRows[0].systemId);

		return null;
	}

	async resolveWritableSystemIdsByAgencyName(agency: string): Promise<number[]> {
		const mapped = getTransitAgencySystemIds(agency);
		if (mapped.length > 0) return mapped;

		const systemId = await this.resolveWritableSystemIdByAgencyName(agency);
		return systemId == null ? [] : [systemId];
	}

	async listFiscalYearsForSystem(systemId: number, type: FormType): Promise<number[]> {
		const serviceTypes = TYPE_SERVICE_FILTERS[type];
		const placeholders = serviceTypes.map(() => '?').join(', ');

		const [rows] = await this.pool.query<YearLookupRow[]>(
			`SELECT DISTINCT FiscalYear AS fiscalYear
			 FROM tblAll_Monthly
			 WHERE SystemID = ?
			   AND UPPER(TRIM(ServiceType)) IN (${placeholders})
			 ORDER BY FiscalYear DESC`,
			[systemId, ...serviceTypes]
		);

		return rows
			.map((row) => Number(row.fiscalYear))
			.filter((year) => Number.isFinite(year));
	}

	async listAllFiscalYearsForSystem(systemId: number): Promise<number[]> {
		const [rows] = await this.pool.query<YearLookupRow[]>(
			`SELECT DISTINCT FiscalYear AS fiscalYear
			 FROM tblAll_Monthly
			 WHERE SystemID = ?
			 ORDER BY FiscalYear DESC`,
			[systemId]
		);

		return rows
			.map((row) => Number(row.fiscalYear))
			.filter((year) => Number.isFinite(year));
	}

	async listAllFiscalYearsForSystems(systemIds: number[]): Promise<number[]> {
		if (systemIds.length === 0) return [];
		const placeholders = systemIds.map(() => '?').join(', ');
		const [rows] = await this.pool.query<YearLookupRow[]>(
			`SELECT DISTINCT FiscalYear AS fiscalYear
			 FROM tblAll_Monthly
			 WHERE SystemID IN (${placeholders})
			 ORDER BY FiscalYear DESC`,
			systemIds
		);

		return rows
			.map((row) => Number(row.fiscalYear))
			.filter((year) => Number.isFinite(year));
	}

	async listServiceTypesForSystems(systemIds: number[]): Promise<string[]> {
		if (systemIds.length === 0) return [];
		const placeholders = systemIds.map(() => '?').join(', ');
		const [rows] = await this.pool.query<ServiceTypeLookupRow[]>(
			`SELECT DISTINCT UPPER(TRIM(ServiceType)) AS serviceType
			 FROM tblAll_Monthly
			 WHERE SystemID IN (${placeholders})
			 ORDER BY serviceType`,
			systemIds
		);
		return rows
			.map((row) => String(row.serviceType ?? '').trim())
			.filter((value) => value.length > 0);
	}

	async listFiscalYearsForType(type: FormType): Promise<number[]> {
		const serviceTypes = TYPE_SERVICE_FILTERS[type];
		const placeholders = serviceTypes.map(() => '?').join(', ');

		const [rows] = await this.pool.query<YearLookupRow[]>(
			`SELECT DISTINCT FiscalYear AS fiscalYear
			 FROM tblAll_Monthly
			 WHERE UPPER(TRIM(ServiceType)) IN (${placeholders})
			 ORDER BY FiscalYear DESC`,
			[...serviceTypes]
		);

		return rows
			.map((row) => Number(row.fiscalYear))
			.filter((year) => Number.isFinite(year));
	}

	async listServiceTypesForSystem(systemId: number): Promise<string[]> {
		const [rows] = await this.pool.query<ServiceTypeLookupRow[]>(
			`SELECT DISTINCT ServiceType AS serviceType
			 FROM tblAll_Monthly
			 WHERE SystemID = ?`,
			[systemId]
		);
		return rows
			.map((row) => String(row.serviceType ?? '').trim())
			.filter((value) => value.length > 0);
	}

	async getDaySnapshot(args: {
		systemId: number;
		year: number;
		slug: DaySlug;
	}): Promise<DaySnapshot> {
		const dayType = DAY_TYPE_BY_SLUG[args.slug];
		const [rows] = await this.pool.query<MonthlyLookupRow[]>(
			`SELECT
				Month AS month,
				ServiceType AS serviceType,
				OperatingDays AS operatingDays,
				Hours AS hours,
				Miles AS miles,
				PassTrips_NonCon AS passTripsNonCon,
				PassTrips_MedCon AS passTripsMedCon,
				PassTrips_NonMedCon AS passTripsNonMedCon,
				PeakVeh_AMPM AS peakVehAmPm,
				PeakVeh_Midday AS peakVehMidday
			 FROM tblAll_Monthly
			 WHERE SystemID = ?
			   AND FiscalYear = ?
			   AND DayType = ?`,
			[args.systemId, args.year, dayType]
		);

		return {
			systemId: args.systemId,
			year: args.year,
			daySlug: args.slug,
			rows: rows.map((row) => ({
				month: Number(row.month),
				serviceType: String(row.serviceType ?? '').trim(),
				operatingDays: row.operatingDays == null ? null : Number(row.operatingDays),
				hours: row.hours == null ? null : Number(row.hours),
				miles: row.miles == null ? null : Number(row.miles),
				passTripsNonCon: row.passTripsNonCon == null ? null : Number(row.passTripsNonCon),
				passTripsMedCon: row.passTripsMedCon == null ? null : Number(row.passTripsMedCon),
				passTripsNonMedCon:
					row.passTripsNonMedCon == null ? null : Number(row.passTripsNonMedCon),
				peakVehAmPm: row.peakVehAmPm == null ? null : Number(row.peakVehAmPm),
				peakVehMidday: row.peakVehMidday == null ? null : Number(row.peakVehMidday)
			}))
		};
	}

	async getYearMonthlyRows(args: { systemId: number; year: number }): Promise<MonthlyRow[]> {
		const [rows] = await this.pool.query<MonthlyLookupRow[]>(
			`SELECT
				Month AS month,
				DayType AS dayType,
				ServiceType AS serviceType,
				OperatingDays AS operatingDays,
				Hours AS hours,
				Miles AS miles,
				PassTrips_NonCon AS passTripsNonCon,
				PassTrips_MedCon AS passTripsMedCon,
				PassTrips_NonMedCon AS passTripsNonMedCon,
				PeakVeh_AMPM AS peakVehAmPm,
				PeakVeh_Midday AS peakVehMidday
			 FROM tblAll_Monthly
			 WHERE SystemID = ?
			   AND FiscalYear = ?`,
			[args.systemId, args.year]
		);

		return rows.map((row) => ({
			month: Number(row.month),
			dayType: String(row.dayType ?? '').trim(),
			serviceType: String(row.serviceType ?? '').trim(),
			operatingDays: row.operatingDays == null ? null : Number(row.operatingDays),
			hours: row.hours == null ? null : Number(row.hours),
			miles: row.miles == null ? null : Number(row.miles),
			passTripsNonCon: row.passTripsNonCon == null ? null : Number(row.passTripsNonCon),
			passTripsMedCon: row.passTripsMedCon == null ? null : Number(row.passTripsMedCon),
			passTripsNonMedCon: row.passTripsNonMedCon == null ? null : Number(row.passTripsNonMedCon),
			peakVehAmPm: row.peakVehAmPm == null ? null : Number(row.peakVehAmPm),
			peakVehMidday: row.peakVehMidday == null ? null : Number(row.peakVehMidday)
		}));
	}

	async getOverviewRow(args: { systemId: number; year: number }): Promise<OverviewRow | null> {
		const [rows] = await this.pool.query<OverviewLookupRow[]>(
			`SELECT
				SystemID AS systemId,
				FiscalYear AS fiscalYear,
				SystemName_1 AS systemName,
				FirstName_2A AS firstName,
				MiddleInitial_2B AS middleInitial,
				LastName_2C AS lastName,
				Email_R3U2a AS email,
				Phone_R5U3 AS phone,
				Fax_U4 AS fax,
				Date_U5 AS date,
				ServiceAreaType_R6 AS serviceAreaType,
				CountiesServed_R7 AS countiesServed,
				DRDO_R8 AS drDo,
				DRPT_R9 AS drPt,
				MBDO_R10 AS mbDo,
				MBPT_R11 AS mbPt,
				MTDO_R12 AS mtDo,
				MTPT_R13 AS mtPt,
				FR_U6 AS fr,
				DR_U7 AS dr,
				LR_U8 AS lr,
				SC_U9 AS sc,
				VP_U10 AS vp,
				MT_U11 AS mt,
				WkdayBeginTime_R12AU10A AS wkdayBeginTime,
				WkdayEndTime_R12BU10B AS wkdayEndTime,
				WkdayRouteCounter_U10C AS wkdayRouteCounter,
				SatBeginTime_R13AU11A AS satBeginTime,
				SatEndTime_R13BU11B AS satEndTime,
				SatRouteCounter_U11C AS satRouteCounter,
				SunBeginTime_R14AU12A AS sunBeginTime,
				SunEndTime_R14BU12B AS sunEndTime,
				SunRouteCounter_U12C AS sunRouteCounter,
				ContractorName_R16U14 AS contractorName,
				ContractorBegin_R17A AS contractorBegin,
				ContractorEnd_R17C AS contractorEnd,
				OutOfCounty_R18 AS outOfCounty,
				OtherCountiesServed_R19 AS otherCountiesServed,
				Coordination_R20 AS coordination,
				CoordinatedCounties_R21 AS coordinatedCounties
			 FROM tblAll_Overview
			 WHERE SystemID = ?
			   AND FiscalYear = ?
			 LIMIT 1`,
			[args.systemId, args.year]
		);

		return rows[0] ?? null;
	}

	async getUrbanFinancialDraft(args: { systemId: number; year: number }): Promise<FormDraftGrid | null> {
		const [rows] = await this.pool.query<(RowDataPacket & Record<string, unknown>)[]>(
			`SELECT *
			 FROM tblAll_Financial_Urban
			 WHERE SystemID = ?
			   AND FiscalYear = ?
			 LIMIT 1`,
			[args.systemId, args.year]
		);
		const row = rows[0];
		if (!row) return null;

		const columnGroups = [
			{
				expenses: 'FRExpenses99A',
				passengerFares: 'FRPassFares100A',
				specialFares: 'FRSpecialFares101A',
				otherTransport: 'FROtherTransRev102A',
				nonTransport: 'FRNonTransRev103A',
				federal: 'FRFederalAssist104A',
				state: 'FRStateAssist105A',
				local: 'FRLocalAssist106A',
				other: 'FROtherAssist107A'
			},
			{
				expenses: 'DRExpenses99B',
				passengerFares: 'DRPassFares100B',
				specialFares: 'DRSpecialFares101B',
				otherTransport: 'DROtherTransRev102B',
				nonTransport: 'DRNonTransRev103B',
				federal: 'DRFederalAssist104B',
				state: 'DRStateAssist105B',
				local: 'DRLocalAssist106B',
				other: 'DROtherAssist107B'
			},
			{
				expenses: 'LRExpenses99C',
				passengerFares: 'LRPassFares100C',
				specialFares: 'LRSpecialFares101C',
				otherTransport: 'LROtherTransRev102C',
				nonTransport: 'LRNonTransRev103C',
				federal: 'LRFederalAssist104C',
				state: 'LRStateAssist105C',
				local: 'LRLocalAssist106C',
				other: 'LROtherAssist107C'
			},
			{
				expenses: 'SCExpenses99D',
				passengerFares: 'SCPassFares100D',
				specialFares: 'SCSpecialFares101D',
				otherTransport: 'SCOtherTransRev102D',
				nonTransport: 'SCNonTransRev103D',
				federal: 'SCFederalAssist104D',
				state: 'SCStateAssist105D',
				local: 'SCLocalAssist106D',
				other: 'SCOtherAssist107D'
			},
			{
				expenses: 'VPExpenses',
				passengerFares: 'VPPassFares',
				specialFares: 'VPSpecialFares',
				otherTransport: 'VPOtherTransRev',
				nonTransport: 'VPNonTransRev',
				federal: 'VPFederalAssist',
				state: 'VPStateAssist',
				local: 'VPLocalAssist',
				other: 'VPOtherAssist'
			},
			{
				expenses: 'MTExpenses',
				passengerFares: 'MTPassFares',
				specialFares: 'MTSpecialFares',
				otherTransport: 'MTOtherTransRev',
				nonTransport: 'MTNonTransRev',
				federal: 'MTFederalAssist',
				state: 'MTStateAssist',
				local: 'MTLocalAssist',
				other: 'MTOtherAssist'
			}
		];

		const values = (key: keyof (typeof columnGroups)[number]) =>
			columnGroups.map((columns) => dbNumber(row[columns[key]]));

		return {
			total_system_expenses: values('expenses'),
			passenger_fares: values('passengerFares'),
			special_transit_fares: values('specialFares'),
			other_transport_revenue: values('otherTransport'),
			non_transport_revenue: values('nonTransport'),
			federal_assistance: values('federal'),
			state_assistance: values('state'),
			local_gov_assistance: values('local'),
			other_assistance: values('other')
		};
	}

	async getRuralFinancialDraft(args: { systemId: number; year: number }): Promise<RuralFinancialDraft | null> {
		const [rows] = await this.pool.query<(RowDataPacket & Record<string, unknown>)[]>(
			`SELECT *
			 FROM tblAll_Financial_CT
			 WHERE SystemID = ?
			   AND FiscalYear = ?
			   AND Quarter = 'All'
			   AND BudgetType IN ('Admin/Operating', 'Capital')`,
			[args.systemId, args.year]
		);
		if (rows.length === 0) return null;

		const modeIndexByLabel = new Map([
			['DR DO', 0],
			['DR PT', 1],
			['MB DO', 2],
			['MB PT', 3],
			['MT DO', 4],
			['MT PT', 5]
		]);
		const draft: FormDraftGrid = {};
		const descriptions: Record<string, string> = {};
		const columnByRow: Record<string, string> = {
			personal_salaries_fringes: 'Admin_Salaries118',
			advertising_promotion: 'AdPromo119',
			employee_development: 'EmpDevel120',
			vehicle_insurance_premiums: 'VehInsurance121',
			admin_indirect_services: 'IndirectSvc_Admin122',
			admin_ctp_codes: 'Expense_CodeRange123',
			other_admin_expense: 'OtherAdminExp124',
			driver_salaries_fringes: 'DriverSalaries125',
			other_operating_staff: 'OtherOpStaffSalaries126',
			mechanics_salaries_fringes: 'MechanicSalaries127',
			operating_indirect_services: 'IndirectSvc_Oper128',
			fuel: 'Fuel129',
			vehicle_maintenance: 'VehMaint130',
			insurance_deductible: 'PayInsuranceDeduct131',
			disposal_of_vehicle: 'DisposalOfVeh132',
			management_operation_services: 'MgmntOpSvc133',
			volunteer_reimbursement: 'VolReimburse134',
			other_transit_provider_services: 'OtherTransProvSvc135',
			other_operating_expense: 'OtherOpExp136',
			capital_purchases: 'Cap_Purchases137',
			body_work: 'Cap_BodyWork138',
			facility_renovation: 'Cap_FacilRenoConst139',
			advanced_technology_purchases: 'Cap_AdvTechExp140',
			other_capital_expense: 'Cap_OtherExp141',
			federal_assistance: '5307_Urban86',
			federal_cares_5307: '5307_CARESUrban',
			federal_crrsa_5307: '5307_CRRSAUrban',
			federal_arp_5307: '5307_ARPUrban',
			federal_capital_5309: '5309_FTACapital87',
			federal_elderly_5310: '5310_EldDisable88',
			federal_ca_ops_5310: '5310_CAoperations89',
			federal_cares_5310: '5310_CARESUrban',
			federal_crrsa_5310: '5310_CRRSAUrban',
			federal_arp_5310: '5310_ARPUrban',
			federal_ctp_admin_cap_5311: '5311_CTPAdminCap90',
			federal_ctp_operating_5311: '5311_CTPOper91',
			federal_ca_ops_5311: '5311_CAoperations92',
			federal_appalachian_5311: '5311_Appalachian93',
			federal_tribal_5311: '5311_Tribal94',
			federal_arra_5311: '5311_ARRA95',
			federal_arra_tribal_5311: '5311_ARRATribal96',
			federal_cares_5311: '5311_CARESCT',
			federal_crrsa_5311: '5311_CRRSACT',
			federal_arp_5311: '5311_ARPCT',
			federal_jarc_5316: '5316_JARC97',
			federal_new_freedom_5317: '5317_Freedom98',
			federal_bus_facilities_5339: '5339_BusFacilities',
			federal_other_fta: 'OtherFTA_99',
			federal_other_non_fta: 'OtherNonFTA_100',
			state_assistance: 'State_CTPAdmin101',
			roap_suballocated: 'ROAP102',
			state_vehicles_capital: 'StateVehicle103',
			state_facility: 'StateFacility104',
			state_advanced_tech: 'StateAdvTech105',
			state_other_revenue: 'OtherStateRev106',
			local_gov_assistance: 'Local_Govern107',
			medicaid_revenue: 'Local_Medicaid108',
			brokered_medicaid_revenue: 'Local_BrokeredMedicaid108b',
			contract_revenue_full_cost: 'Local_Contract109',
			other_directly_generated_revenue: 'OtherDirGeneratedRev110',
			passenger_fares: 'Local_Fares111',
			donations: 'Local_Donation112',
			interest_income: 'Local_InterestIncome113',
			advertising_revenue: 'Local_AdRevenue114',
			insurance_proceeds: 'LocalInsProceed115',
			vehicle_sale_proceeds: 'LocalVehProceed116',
			other_local_revenue: 'LocalOtherRev117'
		};
		const descriptionByRow: Record<string, string> = {
			other_admin_expense: 'OtherAdminExp_Notes124',
			other_operating_expense: 'OtherOpExp_Notes136',
			other_capital_expense: 'Cap_OtherExp_Notes141',
			federal_other_fta: 'OtherFedRev_Notes99',
			federal_other_non_fta: 'OtherFedNonFTARev_Notes100',
			state_other_revenue: 'OtherStateRev_Notes106',
			other_local_revenue: 'LocalOtherRev_Notes117'
		};

		for (const rowId of Object.keys(columnByRow)) {
			draft[rowId] = Array.from({ length: 12 }, () => null);
		}

		for (const row of rows) {
			const modeIndex = modeIndexByLabel.get(String(row.ModeType ?? '').trim());
			if (modeIndex == null) continue;
			const offset = String(row.BudgetType ?? '').trim() === 'Capital' ? 6 : 0;
			for (const [rowId, column] of Object.entries(columnByRow)) {
				draft[rowId][offset + modeIndex] = dbNumber(row[column]);
			}
			for (const [rowId, column] of Object.entries(descriptionByRow)) {
				const value = dbString(row[column]).trim();
				if (value) descriptions[rowId] = value;
			}
		}

		return { draft, descriptions };
	}

	async getAnnualStatisticsDraft(args: {
		systemId: number;
		year: number;
	}): Promise<AnnualStatisticsDraft | null> {
		const [rows] = await this.pool.query<(RowDataPacket & Record<string, unknown>)[]>(
			`SELECT *
			 FROM tblAll_AnnualStats
			 WHERE SystemID = ?
			   AND FiscalYear = ?
			 LIMIT 1`,
			[args.systemId, args.year]
		);
		const row = rows[0];
		if (!row) return null;

		const employee = (prefix: 'Admin' | 'Maint' | 'Driver' | 'Other', rowNumber: string) => ({
			ftHowMany: dbNumber(row[`FT_Emp_${prefix}Count${rowNumber}A`]),
			ftPayHours: dbNumber(row[`FT_Emp_${prefix}Hrs${rowNumber}B`]),
			ptHowMany: dbNumber(row[`PT_Emp_${prefix}Count${rowNumber}C`]),
			ptPayHours: dbNumber(row[`PT_Emp_${prefix}Hrs${rowNumber}D`])
		});

		return {
			volunteerDrivers: dbNumber(row.VolunteerDrivers320A),
			personalVehiclesUsed: dbNumber(row.PersonVehs320D),
			incidentalMiles: dbNumber(row.IncidentalMiles321A),
			incidentalHours: dbNumber(row.IncidentalHrs321D),
			incidentalDescription: dbString(row.IncidentialServiceNote322),
			caresMiles: dbNumber(row.CARESIncidentalMiles),
			caresHours: dbNumber(row.CARESIncidentalHrs),
			caresDescription: dbString(row.CARESIncidentalServiceNote),
			nonAmbulatoryPassengerTrips: dbNumber(row.NonAmbTrip327),
			maintenanceMethod: dbString(row.MaintMethod328),
			ownedVehicles: dbNumber(row.MaintFacil_Owned329A),
			leasedVehicles: dbNumber(row.MaintFacil_Lease329C),
			ntdEvents: dbNumber(row.NTD_Events330A),
			ntdFatalities: dbNumber(row.NTD_Fatalities330C),
			ntdInjuries: dbNumber(row.NTD_Injuries330E),
			operationsChangeNotes: dbString(row.Admin_ChangesNotes338),
			employees: {
				administrative: employee('Admin', '323'),
				maintenance: employee('Maint', '324'),
				driver: employee('Driver', '325'),
				otherOperational: employee('Other', '326')
			},
			tripsServed: {
				vocationalRehabilitation: dbTripFlag(row.VocRehab_Trips331A),
				vocationalWorkshop: dbTripFlag(row.VocWorkshop_Trips332A),
				headstart: dbTripFlag(row.Headstart_Trips333A),
				nursingHomeAssistedLiving: dbTripFlag(row.NursingHome_Trips334A),
				unitedWay: dbTripFlag(row.UnitedWay_Trips335A),
				parksAndRecreation: dbTripFlag(row.ParksRec_Trips336A),
				localEmployer: dbTripFlag(row.LocEmployer_Trips337A),
				dssMedicaid: dbTripFlag(row.DSSMedicaid_Trips331D),
				dssWorkFirst: dbTripFlag(row.DSSWorkFirst_Trips332D),
				dssOther: dbTripFlag(row.DSSOther_Trips333D),
				seniorServices: dbTripFlag(row.SeniorSvcs_Trips334D),
				mentalHealth: dbTripFlag(row.MentalHealth_Trips335D),
				other: dbTripFlag(row.OtherTripServed_336D)
			}
		};
	}

	async getAssaultSafetyDraft(args: {
		systemId: number;
		year: number;
		kind: 'physical' | 'nonPhysical';
	}): Promise<FormDraftGrid | null> {
		const [rows] = await this.pool.query<(RowDataPacket & Record<string, unknown>)[]>(
			`SELECT *
			 FROM tblAll_SafetyStats
			 WHERE SystemID = ?
			   AND FiscalYear = ?
			 LIMIT 1`,
			[args.systemId, args.year]
		);
		const row = rows[0];
		if (!row) return null;

		const prefix = args.kind === 'physical' ? 'PhysAssault' : 'NonPhysAssault';
		const locations = ['TransitVeh', 'RevFac', 'NonRevFac', 'OtherLoc'];
		const values = (metric: string) =>
			locations.map((location) => dbNumber(row[`${prefix}_${location}_${metric}`]));

		return {
			major_safety_security_events: values('MajorEvent'),
			non_major_events: values('NonMajorEvent'),
			operator_injuries: values('OperInjury'),
			other_transit_worker_injuries: values('TransitWorkerInjury'),
			other_injuries: values('OtherInjury'),
			operator_fatalities: values('OperFatality'),
			other_transit_worker_fatalities: values('TransitWorkerFatality'),
			other_fatalities: values('OtherFatality')
		};
	}

	async getOtherSafetyDraft(args: { systemId: number; year: number }): Promise<FormDraftGrid | null> {
		const [rows] = await this.pool.query<(RowDataPacket & Record<string, unknown>)[]>(
			`SELECT *
			 FROM tblAll_SafetyStats
			 WHERE SystemID = ?
			   AND FiscalYear = ?
			 LIMIT 1`,
			[args.systemId, args.year]
		);
		const row = rows[0];
		if (!row) return null;

		return {
			collisions_pedestrians: [
				dbNumber(row.PedCollision_MajorEvent),
				dbNumber(row.PedCollision_Fatalities),
				dbNumber(row.PedCollision_Injuries)
			],
			collisions_vehicles: [
				dbNumber(row.VehCollision_MajorEvent),
				dbNumber(row.VehCollision_Fatalities),
				dbNumber(row.VehCollision_Injuries)
			],
			collisions_other: [
				dbNumber(row.OtherCollision_MajorEvent),
				dbNumber(row.OtherCollision_Fatalities),
				dbNumber(row.OtherCollision_Injuries)
			],
			other_major_events: [
				dbNumber(row.OtherMajorEvent_MajorEvent),
				dbNumber(row.OtherMajorEvent_Fatalities),
				dbNumber(row.OtherMajorEvent_Injuries)
			],
			total_reportable_non_major: [null, null, dbNumber(row.TotalInjury_NonMajorEvent)]
		};
	}

	async getUrbanFinancialOutcomeDraft(args: {
		systemId: number;
		year: number;
	}): Promise<FinancialOutcomeDraft | null> {
		const [rows] = await this.pool.query<(RowDataPacket & Record<string, unknown>)[]>(
			`SELECT *
			 FROM tblAll_Financial_Urban
			 WHERE SystemID = ?
			   AND FiscalYear = ?
			 LIMIT 1`,
			[args.systemId, args.year]
		);
		const row = rows[0];
		if (!row) return null;

		return {
			surplusTransitAccount: dbNumber(row.SurpTransAccount108),
			surplusOtherPurpose: dbNumber(row.SurpOtherPurpose109),
			surplusExplain: dbString(row.SurpOtherExplain110),
			deficitDrawDownTransitAccount: dbNumber(row.DefTransAccount111),
			deficitLocalGovernmentFunds: dbNumber(row.DefLocalFunds112),
			deficitOther: dbNumber(row.DefOther113),
			deficitExplain: dbString(row.DefOtherExplain114),
			authorizedOfficial: dbString(row.AuthorizedOfficial),
			authorizedDate: dbString(row.AuthorizedDate),
			financialManager: dbString(row.FinancialManager),
			financialDate: dbString(row.FinancialDate)
		};
	}

	async getRuralCompletionDraft(args: {
		systemId: number;
		year: number;
	}): Promise<FinancialOutcomeDraft | null> {
		const [rows] = await this.pool.query<(RowDataPacket & Record<string, unknown>)[]>(
			`SELECT *
			 FROM tblAll_Financial_CT
			 WHERE SystemID = ?
			   AND FiscalYear = ?
			   AND Quarter = 'All'
			   AND BudgetType = 'Admin/Operating'
			 ORDER BY FIELD(ModeType, 'DR DO', 'DR PT', 'MB DO', 'MB PT', 'MT DO', 'MT PT')
			 LIMIT 1`,
			[args.systemId, args.year]
		);
		const row = rows[0];
		if (!row) return null;

		return {
			surplusTransitAccount: dbNumber(row.Surplus),
			surplusOtherPurpose: dbNumber(row.SurpOtherPurpose109),
			surplusExplain: dbString(row.SurpOtherExplain110),
			deficitDrawDownTransitAccount: dbNumber(row.DefTransAccount111),
			deficitLocalGovernmentFunds: dbNumber(row.DefLocalFunds112),
			deficitOther: dbNumber(row.DefOther113),
			deficitExplain: dbString(row.DefOtherExplain114),
			authorizedOfficial: dbString(row.AuthorizedOfficial),
			authorizedDate: dbString(row.AuthorizedDate),
			financialManager: dbString(row.FinancialManager),
			financialDate: dbString(row.FinancialDate)
		};
	}

	async upsertUrbanFinancialDraft(args: {
		systemId: number;
		year: number;
		draft: FormDraftGrid;
	}): Promise<void> {
		const rowValue = (rowId: string, index: number): number | null => {
			const values = args.draft[rowId];
			if (!Array.isArray(values)) return null;
			return toNullableInteger(values[index]);
		};

		await upsertTableRow(this.pool, 'tblAll_Financial_Urban', ['SystemID', 'FiscalYear'], {
			SystemID: args.systemId,
			FiscalYear: args.year,
			FRExpenses99A: rowValue('total_system_expenses', 0),
			FRPassFares100A: rowValue('passenger_fares', 0),
			FRSpecialFares101A: rowValue('special_transit_fares', 0),
			FROtherTransRev102A: rowValue('other_transport_revenue', 0),
			FRNonTransRev103A: rowValue('non_transport_revenue', 0),
			FRFederalAssist104A: rowValue('federal_assistance', 0),
			FRStateAssist105A: rowValue('state_assistance', 0),
			FRLocalAssist106A: rowValue('local_gov_assistance', 0),
			FROtherAssist107A: rowValue('other_assistance', 0),
			DRExpenses99B: rowValue('total_system_expenses', 1),
			DRPassFares100B: rowValue('passenger_fares', 1),
			DRSpecialFares101B: rowValue('special_transit_fares', 1),
			DROtherTransRev102B: rowValue('other_transport_revenue', 1),
			DRNonTransRev103B: rowValue('non_transport_revenue', 1),
			DRFederalAssist104B: rowValue('federal_assistance', 1),
			DRStateAssist105B: rowValue('state_assistance', 1),
			DRLocalAssist106B: rowValue('local_gov_assistance', 1),
			DROtherAssist107B: rowValue('other_assistance', 1),
			LRExpenses99C: rowValue('total_system_expenses', 2),
			LRPassFares100C: rowValue('passenger_fares', 2),
			LRSpecialFares101C: rowValue('special_transit_fares', 2),
			LROtherTransRev102C: rowValue('other_transport_revenue', 2),
			LRNonTransRev103C: rowValue('non_transport_revenue', 2),
			LRFederalAssist104C: rowValue('federal_assistance', 2),
			LRStateAssist105C: rowValue('state_assistance', 2),
			LRLocalAssist106C: rowValue('local_gov_assistance', 2),
			LROtherAssist107C: rowValue('other_assistance', 2),
			SCExpenses99D: rowValue('total_system_expenses', 3),
			SCPassFares100D: rowValue('passenger_fares', 3),
			SCSpecialFares101D: rowValue('special_transit_fares', 3),
			SCOtherTransRev102D: rowValue('other_transport_revenue', 3),
			SCNonTransRev103D: rowValue('non_transport_revenue', 3),
			SCFederalAssist104D: rowValue('federal_assistance', 3),
			SCStateAssist105D: rowValue('state_assistance', 3),
			SCLocalAssist106D: rowValue('local_gov_assistance', 3),
			SCOtherAssist107D: rowValue('other_assistance', 3),
			VPExpenses: rowValue('total_system_expenses', 4),
			VPPassFares: rowValue('passenger_fares', 4),
			VPSpecialFares: rowValue('special_transit_fares', 4),
			VPOtherTransRev: rowValue('other_transport_revenue', 4),
			VPNonTransRev: rowValue('non_transport_revenue', 4),
			VPFederalAssist: rowValue('federal_assistance', 4),
			VPStateAssist: rowValue('state_assistance', 4),
			VPLocalAssist: rowValue('local_gov_assistance', 4),
			VPOtherAssist: rowValue('other_assistance', 4),
			MTExpenses: rowValue('total_system_expenses', 5),
			MTPassFares: rowValue('passenger_fares', 5),
			MTSpecialFares: rowValue('special_transit_fares', 5),
			MTOtherTransRev: rowValue('other_transport_revenue', 5),
			MTNonTransRev: rowValue('non_transport_revenue', 5),
			MTFederalAssist: rowValue('federal_assistance', 5),
			MTStateAssist: rowValue('state_assistance', 5),
			MTLocalAssist: rowValue('local_gov_assistance', 5),
			MTOtherAssist: rowValue('other_assistance', 5)
		});
	}

	async upsertRuralFinancialDraft(args: {
		systemId: number;
		year: number;
		draft: RuralFinancialDraft;
	}): Promise<void> {
		const columnByRow: Record<string, string> = {
			personal_salaries_fringes: 'Admin_Salaries118',
			advertising_promotion: 'AdPromo119',
			employee_development: 'EmpDevel120',
			vehicle_insurance_premiums: 'VehInsurance121',
			admin_indirect_services: 'IndirectSvc_Admin122',
			admin_ctp_codes: 'Expense_CodeRange123',
			other_admin_expense: 'OtherAdminExp124',
			driver_salaries_fringes: 'DriverSalaries125',
			other_operating_staff: 'OtherOpStaffSalaries126',
			mechanics_salaries_fringes: 'MechanicSalaries127',
			operating_indirect_services: 'IndirectSvc_Oper128',
			fuel: 'Fuel129',
			vehicle_maintenance: 'VehMaint130',
			insurance_deductible: 'PayInsuranceDeduct131',
			disposal_of_vehicle: 'DisposalOfVeh132',
			management_operation_services: 'MgmntOpSvc133',
			volunteer_reimbursement: 'VolReimburse134',
			other_transit_provider_services: 'OtherTransProvSvc135',
			other_operating_expense: 'OtherOpExp136',
			capital_purchases: 'Cap_Purchases137',
			body_work: 'Cap_BodyWork138',
			facility_renovation: 'Cap_FacilRenoConst139',
			advanced_technology_purchases: 'Cap_AdvTechExp140',
			other_capital_expense: 'Cap_OtherExp141',
			federal_assistance: '5307_Urban86',
			federal_cares_5307: '5307_CARESUrban',
			federal_crrsa_5307: '5307_CRRSAUrban',
			federal_arp_5307: '5307_ARPUrban',
			federal_capital_5309: '5309_FTACapital87',
			federal_elderly_5310: '5310_EldDisable88',
			federal_ca_ops_5310: '5310_CAoperations89',
			federal_cares_5310: '5310_CARESUrban',
			federal_crrsa_5310: '5310_CRRSAUrban',
			federal_arp_5310: '5310_ARPUrban',
			federal_ctp_admin_cap_5311: '5311_CTPAdminCap90',
			federal_ctp_operating_5311: '5311_CTPOper91',
			federal_ca_ops_5311: '5311_CAoperations92',
			federal_appalachian_5311: '5311_Appalachian93',
			federal_tribal_5311: '5311_Tribal94',
			federal_arra_5311: '5311_ARRA95',
			federal_arra_tribal_5311: '5311_ARRATribal96',
			federal_cares_5311: '5311_CARESCT',
			federal_crrsa_5311: '5311_CRRSACT',
			federal_arp_5311: '5311_ARPCT',
			federal_jarc_5316: '5316_JARC97',
			federal_new_freedom_5317: '5317_Freedom98',
			federal_bus_facilities_5339: '5339_BusFacilities',
			federal_other_fta: 'OtherFTA_99',
			federal_other_non_fta: 'OtherNonFTA_100',
			state_assistance: 'State_CTPAdmin101',
			roap_suballocated: 'ROAP102',
			state_vehicles_capital: 'StateVehicle103',
			state_facility: 'StateFacility104',
			state_advanced_tech: 'StateAdvTech105',
			state_other_revenue: 'OtherStateRev106',
			local_gov_assistance: 'Local_Govern107',
			medicaid_revenue: 'Local_Medicaid108',
			brokered_medicaid_revenue: 'Local_BrokeredMedicaid108b',
			contract_revenue_full_cost: 'Local_Contract109',
			other_directly_generated_revenue: 'OtherDirGeneratedRev110',
			passenger_fares: 'Local_Fares111',
			donations: 'Local_Donation112',
			interest_income: 'Local_InterestIncome113',
			advertising_revenue: 'Local_AdRevenue114',
			insurance_proceeds: 'LocalInsProceed115',
			vehicle_sale_proceeds: 'LocalVehProceed116',
			other_local_revenue: 'LocalOtherRev117'
		};
		const descriptionByRow: Record<string, string> = {
			other_admin_expense: 'OtherAdminExp_Notes124',
			other_operating_expense: 'OtherOpExp_Notes136',
			other_capital_expense: 'Cap_OtherExp_Notes141',
			federal_other_fta: 'OtherFedRev_Notes99',
			federal_other_non_fta: 'OtherFedNonFTARev_Notes100',
			state_other_revenue: 'OtherStateRev_Notes106',
			other_local_revenue: 'LocalOtherRev_Notes117'
		};
		const modeIndexByLabel = new Map([
			['DR DO', 0],
			['DR PT', 1],
			['MB DO', 2],
			['MB PT', 3],
			['MT DO', 4],
			['MT PT', 5]
		]);

		for (const [modeType, modeIndex] of modeIndexByLabel.entries()) {
			for (const budgetType of ['Admin/Operating', 'Capital'] as const) {
				const offset = budgetType === 'Capital' ? 6 : 0;
				const values: Record<string, unknown> = {
					SystemID: args.systemId,
					FiscalYear: args.year,
					Quarter: 'All',
					BudgetType: budgetType,
					ModeType: modeType
				};

				for (const [rowId, column] of Object.entries(columnByRow)) {
					const rowValues = args.draft.draft[rowId];
					values[column] = Array.isArray(rowValues) ? toNullableInteger(rowValues[offset + modeIndex]) : null;
				}

				for (const [rowId, column] of Object.entries(descriptionByRow)) {
					values[column] = emptyToNull(args.draft.descriptions[rowId]);
				}

				await upsertTableRow(
					this.pool,
					'tblAll_Financial_CT',
					['SystemID', 'FiscalYear', 'Quarter', 'BudgetType', 'ModeType'],
					values
				);
			}
		}
	}

	async upsertAnnualStatisticsDraft(args: {
		systemId: number;
		year: number;
		draft: AnnualStatisticsDraft;
	}): Promise<void> {
		const e = args.draft.employees;
		const t = args.draft.tripsServed;
		await upsertTableRow(this.pool, 'tblAll_AnnualStats', ['SystemID', 'FiscalYear'], {
			SystemID: args.systemId,
			FiscalYear: args.year,
			VolunteerDrivers320A: args.draft.volunteerDrivers,
			PersonVehs320D: args.draft.personalVehiclesUsed,
			IncidentalMiles321A: args.draft.incidentalMiles,
			IncidentalHrs321D: args.draft.incidentalHours,
			IncidentialServiceNote322: emptyToNull(args.draft.incidentalDescription),
			CARESIncidentalMiles: args.draft.caresMiles,
			CARESIncidentalHrs: args.draft.caresHours,
			CARESIncidentalServiceNote: emptyToNull(args.draft.caresDescription),
			NonAmbTrip327: args.draft.nonAmbulatoryPassengerTrips,
			MaintMethod328: emptyToNull(args.draft.maintenanceMethod),
			MaintFacil_Owned329A: args.draft.ownedVehicles,
			MaintFacil_Lease329C: args.draft.leasedVehicles,
			NTD_Events330A: args.draft.ntdEvents,
			NTD_Fatalities330C: args.draft.ntdFatalities,
			NTD_Injuries330E: args.draft.ntdInjuries,
			Admin_ChangesNotes338: emptyToNull(args.draft.operationsChangeNotes),
			FT_Emp_AdminCount323A: e.administrative.ftHowMany,
			FT_Emp_AdminHrs323B: e.administrative.ftPayHours,
			PT_Emp_AdminCount323C: e.administrative.ptHowMany,
			PT_Emp_AdminHrs323D: e.administrative.ptPayHours,
			FT_Emp_MaintCount324A: e.maintenance.ftHowMany,
			FT_Emp_MaintHrs324B: e.maintenance.ftPayHours,
			PT_Emp_MaintCount324C: e.maintenance.ptHowMany,
			PT_Emp_MaintHrs324D: e.maintenance.ptPayHours,
			FT_Emp_DriverCount325A: e.driver.ftHowMany,
			FT_Emp_DriverHrs325B: e.driver.ftPayHours,
			PT_Emp_DriverCount325C: e.driver.ptHowMany,
			PT_Emp_DriverHrs325D: e.driver.ptPayHours,
			FT_Emp_OtherCount326A: e.otherOperational.ftHowMany,
			FT_Emp_OtherHrs326B: e.otherOperational.ftPayHours,
			PT_Emp_OtherCount326C: e.otherOperational.ptHowMany,
			PT_Emp_OtherHrs326D: e.otherOperational.ptPayHours,
			VocRehab_Trips331A: t.vocationalRehabilitation ? 1 : 0,
			VocWorkshop_Trips332A: t.vocationalWorkshop ? 1 : 0,
			Headstart_Trips333A: t.headstart ? 1 : 0,
			NursingHome_Trips334A: t.nursingHomeAssistedLiving ? 1 : 0,
			UnitedWay_Trips335A: t.unitedWay ? 1 : 0,
			ParksRec_Trips336A: t.parksAndRecreation ? 1 : 0,
			LocEmployer_Trips337A: t.localEmployer ? 1 : 0,
			DSSMedicaid_Trips331D: t.dssMedicaid ? 1 : 0,
			DSSWorkFirst_Trips332D: t.dssWorkFirst ? 1 : 0,
			DSSOther_Trips333D: t.dssOther ? 1 : 0,
			SeniorSvcs_Trips334D: t.seniorServices ? 1 : 0,
			MentalHealth_Trips335D: t.mentalHealth ? 1 : 0,
			OtherTripServed_336D: t.other ? 1 : 0
		});
	}

	async upsertAssaultSafetyDraft(args: {
		systemId: number;
		year: number;
		kind: 'physical' | 'nonPhysical';
		draft: FormDraftGrid;
	}): Promise<void> {
		const prefix = args.kind === 'physical' ? 'PhysAssault' : 'NonPhysAssault';
		const locations = ['TransitVeh', 'RevFac', 'NonRevFac', 'OtherLoc'] as const;
		const metrics: Array<[string, string]> = [
			['major_safety_security_events', 'MajorEvent'],
			['non_major_events', 'NonMajorEvent'],
			['operator_injuries', 'OperInjury'],
			['other_transit_worker_injuries', 'TransitWorkerInjury'],
			['other_injuries', 'OtherInjury'],
			['operator_fatalities', 'OperFatality'],
			['other_transit_worker_fatalities', 'TransitWorkerFatality'],
			['other_fatalities', 'OtherFatality']
		];
		const values: Record<string, unknown> = {
			SystemID: args.systemId,
			FiscalYear: args.year
		};

		for (const [rowId, metric] of metrics) {
			const rowValues = args.draft[rowId];
			for (let index = 0; index < locations.length; index++) {
				values[`${prefix}_${locations[index]}_${metric}`] = Array.isArray(rowValues)
					? toNullableInteger(rowValues[index])
					: null;
			}
		}

		await upsertTableRow(this.pool, 'tblAll_SafetyStats', ['SystemID', 'FiscalYear'], values);
	}

	async upsertOtherSafetyDraft(args: {
		systemId: number;
		year: number;
		draft: FormDraftGrid;
	}): Promise<void> {
		const rowValue = (rowId: string, index: number): number | null => {
			const values = args.draft[rowId];
			if (!Array.isArray(values)) return null;
			return toNullableInteger(values[index]);
		};

		await upsertTableRow(this.pool, 'tblAll_SafetyStats', ['SystemID', 'FiscalYear'], {
			SystemID: args.systemId,
			FiscalYear: args.year,
			PedCollision_MajorEvent: rowValue('collisions_pedestrians', 0),
			PedCollision_Fatalities: rowValue('collisions_pedestrians', 1),
			PedCollision_Injuries: rowValue('collisions_pedestrians', 2),
			VehCollision_MajorEvent: rowValue('collisions_vehicles', 0),
			VehCollision_Fatalities: rowValue('collisions_vehicles', 1),
			VehCollision_Injuries: rowValue('collisions_vehicles', 2),
			OtherCollision_MajorEvent: rowValue('collisions_other', 0),
			OtherCollision_Fatalities: rowValue('collisions_other', 1),
			OtherCollision_Injuries: rowValue('collisions_other', 2),
			OtherMajorEvent_MajorEvent: rowValue('other_major_events', 0),
			OtherMajorEvent_Fatalities: rowValue('other_major_events', 1),
			OtherMajorEvent_Injuries: rowValue('other_major_events', 2),
			TotalInjury_NonMajorEvent: rowValue('total_reportable_non_major', 2)
		});
	}

	async upsertUrbanFinancialOutcomeDraft(args: {
		systemId: number;
		year: number;
		draft: FinancialOutcomeDraft;
	}): Promise<void> {
		await upsertTableRow(this.pool, 'tblAll_Financial_Urban', ['SystemID', 'FiscalYear'], {
			SystemID: args.systemId,
			FiscalYear: args.year,
			Surplus: args.draft.surplusTransitAccount,
			SurpTransAccount108: args.draft.surplusTransitAccount,
			SurpOtherPurpose109: args.draft.surplusOtherPurpose,
			SurpOtherExplain110: emptyToNull(args.draft.surplusExplain),
			Deficit: args.draft.deficitDrawDownTransitAccount,
			DefTransAccount111: args.draft.deficitDrawDownTransitAccount,
			DefLocalFunds112: args.draft.deficitLocalGovernmentFunds,
			DefOther113: args.draft.deficitOther,
			DefOtherExplain114: emptyToNull(args.draft.deficitExplain)
		});
	}

	async upsertRuralCompletionDraft(args: {
		systemId: number;
		year: number;
		draft: FinancialOutcomeDraft;
	}): Promise<void> {
		await upsertTableRow(this.pool, 'tblAll_Financial_CT', ['SystemID', 'FiscalYear', 'Quarter', 'BudgetType', 'ModeType'], {
			SystemID: args.systemId,
			FiscalYear: args.year,
			Quarter: 'All',
			BudgetType: 'Admin/Operating',
			ModeType: 'DR DO',
			Surplus: args.draft.surplusTransitAccount,
			SurpTransAccount108: args.draft.surplusTransitAccount,
			SurpOtherPurpose109: args.draft.surplusOtherPurpose,
			SurpOtherExplain110: emptyToNull(args.draft.surplusExplain),
			Deficit: args.draft.deficitDrawDownTransitAccount,
			DefTransAccount111: args.draft.deficitDrawDownTransitAccount,
			DefLocalFunds112: args.draft.deficitLocalGovernmentFunds,
			DefOther113: args.draft.deficitOther,
			DefOtherExplain114: emptyToNull(args.draft.deficitExplain)
		});
	}

	async upsertOverview(args: {
		systemId: number;
		year: number;
		type: FormType;
		capabilities: Capabilities;
	}): Promise<void> {
		const selectedModes = new Set(args.capabilities.selectedModes);
		const days = args.capabilities.days;
		const rural = args.capabilities.rural;
		const contractorName =
			args.type === 'rural'
				? emptyToNull(rural?.ptContractor.name) || emptyToNull(args.capabilities.contractor)
				: emptyToNull(args.capabilities.contractor);

		const values = {
			SystemID: args.systemId,
			SystemName_1: emptyToNull(args.capabilities.ctpGranteeLegalName),
			FiscalYear: args.year,
			FirstName_2A: emptyToNull(args.capabilities.contactFirstName),
			MiddleInitial_2B: emptyToNull(args.capabilities.contactMiddleInitial),
			LastName_2C: emptyToNull(args.capabilities.contactLastName),
			Email_R3U2a: emptyToNull(args.capabilities.email),
			Phone_R5U3: emptyToNull(args.capabilities.phone),
			Fax_U4: emptyToNull(args.capabilities.fax),
			Date_U5: toDateTime(args.capabilities.date),
			ServiceAreaType_R6:
				args.type === 'rural'
					? rural?.serviceArea.multiCounty
						? 'Multi-County'
						: 'Single County'
					: null,
			CountiesServed_R7: emptyToNull(rural?.serviceArea.counties),
			DRDO_R8: args.type === 'rural' ? selectedFlag(selectedModes, 'dr_do') : null,
			DRPT_R9: args.type === 'rural' ? selectedFlag(selectedModes, 'dr_pt') : null,
			MBDO_R10: args.type === 'rural' ? selectedFlag(selectedModes, 'mb_do') : null,
			MBPT_R11: args.type === 'rural' ? selectedFlag(selectedModes, 'mb_pt') : null,
			MTDO_R12: args.type === 'rural' ? selectedFlag(selectedModes, 'mt_do') : null,
			MTPT_R13: args.type === 'rural' ? selectedFlag(selectedModes, 'mt_pt') : null,
			FR_U6: args.type === 'urban' ? selectedFlag(selectedModes, 'fixed_route') : null,
			DR_U7: args.type === 'urban' ? selectedFlag(selectedModes, 'dial_a_ride') : null,
			LR_U8: args.type === 'urban' ? selectedFlag(selectedModes, 'light_rail') : null,
			SC_U9: args.type === 'urban' ? selectedFlag(selectedModes, 'street_car') : null,
			VP_U10: args.type === 'urban' ? selectedFlag(selectedModes, 'vanpool') : null,
			MT_U11: args.type === 'urban' ? selectedFlag(selectedModes, 'microtransit') : null,
			WkdayBeginTime_R12AU10A: toTimeDateTime(days.weekday.start),
			WkdayEndTime_R12BU10B: toTimeDateTime(days.weekday.end),
			WkdayRouteCounter_U10C: toNullableInteger(days.weekday.peakRoutes),
			SatBeginTime_R13AU11A: days.saturday.offered ? toTimeDateTime(days.saturday.start) : null,
			SatEndTime_R13BU11B: days.saturday.offered ? toTimeDateTime(days.saturday.end) : null,
			SatRouteCounter_U11C: days.saturday.offered
				? toNullableInteger(days.saturday.peakRoutes)
				: null,
			SunBeginTime_R14AU12A: days.sunday.offered ? toTimeDateTime(days.sunday.start) : null,
			SunEndTime_R14BU12B: days.sunday.offered ? toTimeDateTime(days.sunday.end) : null,
			SunRouteCounter_U12C: days.sunday.offered
				? toNullableInteger(days.sunday.peakRoutes)
				: null,
			ContractorName_R16U14: contractorName,
			ContractorBegin_R17A: toDateTime(rural?.ptContractor.contractStart),
			ContractorEnd_R17C: toDateTime(rural?.ptContractor.contractEnd),
			OutOfCounty_R18: rural ? boolFlag(rural.outOfServiceArea.enabled) : null,
			OtherCountiesServed_R19: emptyToNull(rural?.outOfServiceArea.destinations),
			Coordination_R20: rural ? boolFlag(rural.coordination.enabled) : null,
			CoordinatedCounties_R21: emptyToNull(rural?.coordination.systems),
			LastUpdate: new Date()
		};

		const columns = Object.keys(values);
		const updateColumns = columns.filter((column) => column !== 'SystemID' && column !== 'FiscalYear');
		const [result] = await this.pool.query<ResultSetHeader>(
			`UPDATE tblAll_Overview
			 SET ${updateColumns.map((column) => `${column} = ?`).join(', ')}
			 WHERE SystemID = ? AND FiscalYear = ?`,
			[
				...updateColumns.map((column) => values[column as keyof typeof values]),
				args.systemId,
				args.year
			]
		);

		if (result.affectedRows > 0) return;

		await this.pool.query<ResultSetHeader>(
			`INSERT INTO tblAll_Overview (${columns.join(', ')})
			 VALUES (${columns.map(() => '?').join(', ')})`,
			columns.map((column) => values[column as keyof typeof values])
		);
	}

	async upsertMonthlyRows(rows: MonthlyWriteRow[]): Promise<void> {
		const metricColumns: MonthlyMetricKey[] = [
			'operatingDays',
			'hours',
			'miles',
			'passTripsNonCon',
			'passTripsMedCon',
			'passTripsNonMedCon',
			'passTripsBroMedCon',
			'peakVehAmPm',
			'peakVehMidday'
		];
		const columnByMetric: Record<MonthlyMetricKey, string> = {
			operatingDays: 'OperatingDays',
			hours: 'Hours',
			miles: 'Miles',
			passTripsNonCon: 'PassTrips_NonCon',
			passTripsMedCon: 'PassTrips_MedCon',
			passTripsNonMedCon: 'PassTrips_NonMedCon',
			passTripsBroMedCon: 'PassTrips_BroMedCon',
			peakVehAmPm: 'PeakVeh_AMPM',
			peakVehMidday: 'PeakVeh_Midday'
		};

		for (const row of rows) {
			const presentMetrics = metricColumns.filter((metric) =>
				Object.prototype.hasOwnProperty.call(row, metric)
			);
			if (presentMetrics.length === 0) continue;

			const [result] = await this.pool.query<ResultSetHeader>(
				`UPDATE tblAll_Monthly
				 SET ${presentMetrics.map((metric) => `${columnByMetric[metric]} = ?`).join(', ')},
				     LastUpdate = CURRENT_TIMESTAMP
				 WHERE SystemID = ? AND FiscalYear = ? AND Month = ? AND DayType = ? AND ServiceType = ?`,
				[
					...presentMetrics.map((metric) => row[metric]),
					row.systemId,
					row.year,
					row.month,
					row.dayType,
					row.serviceType
				]
			);

			if (result.affectedRows > 0) continue;

			const insertColumns = [
				'SystemID',
				'FiscalYear',
				'Month',
				'ServiceType',
				'DayType',
				...presentMetrics.map((metric) => columnByMetric[metric]),
				'LastUpdate'
			];
			await this.pool.query<ResultSetHeader>(
				`INSERT INTO tblAll_Monthly (${insertColumns.join(', ')})
				 VALUES (${insertColumns.map(() => '?').join(', ')})`,
				[
					row.systemId,
					row.year,
					row.month,
					row.serviceType,
					row.dayType,
					...presentMetrics.map((metric) => row[metric]),
					new Date()
				]
			);
		}
	}

	async getMonthlyRowsForWriteRows(rows: MonthlyWriteRow[]): Promise<Map<string, MonthlyPersistedRow>> {
		const result = new Map<string, MonthlyPersistedRow>();
		const uniqueRows = Array.from(
			new Map(
				rows.map((row) => [
					`${row.systemId}:${row.year}:${row.month}:${row.dayType}:${row.serviceType}`,
					row
				])
			).values()
		);

		for (const row of uniqueRows) {
			const [existingRows] = await this.pool.query<
				(RowDataPacket & {
					SystemID: number;
					FiscalYear: number;
					Month: number;
					DayType: string;
					ServiceType: string;
					OperatingDays: number | null;
					Hours: number | null;
					Miles: number | null;
					PassTrips_NonCon: number | null;
					PassTrips_MedCon: number | null;
					PassTrips_NonMedCon: number | null;
					PassTrips_BroMedCon: number | null;
					PeakVeh_AMPM: number | null;
					PeakVeh_Midday: number | null;
				})[]
			>(
				`SELECT SystemID,
				        FiscalYear,
				        Month,
				        DayType,
				        ServiceType,
				        OperatingDays,
				        Hours,
				        Miles,
				        PassTrips_NonCon,
				        PassTrips_MedCon,
				        PassTrips_NonMedCon,
				        PassTrips_BroMedCon,
				        PeakVeh_AMPM,
				        PeakVeh_Midday
				   FROM tblAll_Monthly
				  WHERE SystemID = ?
				    AND FiscalYear = ?
				    AND Month = ?
				    AND DayType = ?
				    AND ServiceType = ?
				  LIMIT 1`,
				[row.systemId, row.year, row.month, row.dayType, row.serviceType]
			);

			const existing = existingRows[0];
			if (!existing) continue;

			result.set(`${row.month}:${row.dayType}:${row.serviceType}`, {
				systemId: Number(existing.SystemID),
				year: Number(existing.FiscalYear),
				month: Number(existing.Month),
				dayType: String(existing.DayType ?? '').trim(),
				serviceType: String(existing.ServiceType ?? '').trim(),
				operatingDays: existing.OperatingDays == null ? null : Number(existing.OperatingDays),
				hours: existing.Hours == null ? null : Number(existing.Hours),
				miles: existing.Miles == null ? null : Number(existing.Miles),
				passTripsNonCon:
					existing.PassTrips_NonCon == null ? null : Number(existing.PassTrips_NonCon),
				passTripsMedCon:
					existing.PassTrips_MedCon == null ? null : Number(existing.PassTrips_MedCon),
				passTripsNonMedCon:
					existing.PassTrips_NonMedCon == null ? null : Number(existing.PassTrips_NonMedCon),
				passTripsBroMedCon:
					existing.PassTrips_BroMedCon == null ? null : Number(existing.PassTrips_BroMedCon),
				peakVehAmPm: existing.PeakVeh_AMPM == null ? null : Number(existing.PeakVeh_AMPM),
				peakVehMidday: existing.PeakVeh_Midday == null ? null : Number(existing.PeakVeh_Midday)
			});
		}

		return result;
	}
}

let singleton: OpStatsRepository | null = null;

export function getOpStatsRepository(): OpStatsRepository {
	if (!singleton) singleton = new OpStatsRepository(getFormsReportPool());
	return singleton;
}
