import type { Pool, RowDataPacket } from 'mysql2/promise';
import { getFormsReportPool } from '$lib/server/formsReport/db';

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
}

let singleton: OpStatsRepository | null = null;

export function getOpStatsRepository(): OpStatsRepository {
	if (!singleton) singleton = new OpStatsRepository(getFormsReportPool());
	return singleton;
}
