import type { DaySlug, FormType } from '$lib/features/forms/shared/types/capabilities.types';

export type RdsMonthlyRow = {
	month: number;
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

export type RdsDaySnapshot = {
	systemId: number;
	year: number;
	daySlug: DaySlug;
	rows: RdsMonthlyRow[];
};

export type RdsWeekSatSunData = {
	type: FormType;
	snapshot: RdsDaySnapshot | null;
};
