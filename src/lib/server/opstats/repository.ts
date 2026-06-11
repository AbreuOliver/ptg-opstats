import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getFormsReportPool } from '$lib/server/formsReport/db';
import type { Capabilities } from '$lib/features/forms/shared/types/capabilities.types';

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

	async resolveWritableSystemIdByAgencyName(agency: string): Promise<number | null> {
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
