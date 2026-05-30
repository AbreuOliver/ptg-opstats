import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';
import type { GridValues, RowDef } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.types';
import type { RdsDaySnapshot } from '../types/rdsSnapshot.types';

const URBAN_MODE_TO_SERVICE_TYPE: Record<string, string> = {
	fixed_route: 'FR',
	dial_a_ride: 'DR',
	light_rail: 'LR',
	street_car: 'SC',
	vanpool: 'VP',
	microtransit: 'MT'
};

const RURAL_MODE_TO_SERVICE_TYPE: Record<string, string> = {
	dr_do: 'DR DO',
	dr_pt: 'DR PT',
	mb_do: 'MB DO',
	mb_pt: 'MB PT',
	mt_do: 'MT DO',
	mt_pt: 'MT PT'
};

function normalizeServiceType(raw: string): string {
	return raw.trim().toUpperCase();
}

function monthToColumn(month: number): number | null {
	if (!Number.isFinite(month) || month < 1 || month > 12) return null;
	const fiscalStart = 7;
	return (month - fiscalStart + 12) % 12;
}

function fieldValueForSuffix(
	suffix: string,
	row: {
		hours: number | null;
		miles: number | null;
		passTripsNonCon: number | null;
		passTripsMedCon: number | null;
		passTripsNonMedCon: number | null;
		peakVehAmPm: number | null;
		peakVehMidday: number | null;
	}
): number | null {
	switch (suffix) {
		case 'hours':
		case 'vehicle_revenue_hours':
			return row.hours;
		case 'miles':
		case 'vehicle_revenue_miles':
			return row.miles;
		case 'pt_nc':
			return row.passTripsNonCon;
		case 'medicaid':
			return row.passTripsMedCon;
		case 'nonmedicaid':
			return row.passTripsNonMedCon;
		case 'total_unlinked_passenger_trips':
			return (row.passTripsNonCon ?? 0) + (row.passTripsMedCon ?? 0) + (row.passTripsNonMedCon ?? 0);
		case 'am_pm_peak_period_vehicles':
			return row.peakVehAmPm;
		case 'midday_vehicles':
			return row.peakVehMidday;
		default:
			return null;
	}
}

export function inferSelectedModesFromSnapshot(type: FormType, snapshot: RdsDaySnapshot | null): string[] {
	if (!snapshot || snapshot.rows.length === 0) return [];
	const serviceTypes = new Set(snapshot.rows.map((row) => normalizeServiceType(row.serviceType)));

	if (type === 'urban') {
		return Object.entries(URBAN_MODE_TO_SERVICE_TYPE)
			.filter(([, serviceType]) => serviceTypes.has(serviceType))
			.map(([mode]) => mode);
	}

	return Object.entries(RURAL_MODE_TO_SERVICE_TYPE)
		.filter(([, serviceType]) => serviceTypes.has(serviceType))
		.map(([mode]) => mode);
}

export function buildGridValuesFromSnapshot(
	type: FormType,
	rows: RowDef[],
	colCount: number,
	snapshot: RdsDaySnapshot | null
): GridValues {
	const base: GridValues = Array.from({ length: rows.length }, () =>
		Array.from({ length: colCount }, () => null)
	);
	if (!snapshot || snapshot.rows.length === 0) return base;

	const byServiceAndMonth = new Map<string, Map<number, (typeof snapshot.rows)[number]>>();
	for (const row of snapshot.rows) {
		const service = normalizeServiceType(row.serviceType);
		const monthCol = monthToColumn(row.month);
		if (monthCol === null) continue;
		const byMonth = byServiceAndMonth.get(service) ?? new Map<number, (typeof snapshot.rows)[number]>();
		byMonth.set(monthCol, row);
		byServiceAndMonth.set(service, byMonth);
	}

	for (let r = 0; r < rows.length; r++) {
		const row = rows[r];
		if (row.type !== 'number') continue;

		if (row.id === 'operating_days') {
			const allRows = byServiceAndMonth.get('ALL');
			if (!allRows) continue;
			for (const [col, source] of allRows.entries()) {
				base[r][col] = source.operatingDays;
			}
			continue;
		}

		const [modePrefix, suffix] = row.id.split('__');
		if (!modePrefix || !suffix) continue;
		const serviceType =
			type === 'urban'
				? URBAN_MODE_TO_SERVICE_TYPE[modePrefix]
				: RURAL_MODE_TO_SERVICE_TYPE[modePrefix];
		if (!serviceType) continue;
		const sourceRows = byServiceAndMonth.get(serviceType);
		if (!sourceRows) continue;

		for (const [col, source] of sourceRows.entries()) {
			base[r][col] = fieldValueForSuffix(suffix, source);
		}
	}

	return base;
}
