import type { Capabilities, FormType } from '$lib/features/forms/shared/types/capabilities.types';
import { defaultCapabilities } from '$lib/features/forms/shared/rules/defaultCapabilities.rules';
import type { MonthlyRow, OverviewRow } from './repository';

const RURAL_SERVICE_TO_MODE: Record<string, string> = {
	'DR DO': 'dr_do',
	'DR PT': 'dr_pt',
	'MB DO': 'mb_do',
	'MB PT': 'mb_pt',
	'MT DO': 'mt_do',
	'MT PT': 'mt_pt'
};

const URBAN_SERVICE_TO_MODE: Record<string, string> = {
	DR: 'dial_a_ride',
	FR: 'fixed_route',
	LR: 'light_rail',
	SC: 'street_car',
	VP: 'vanpool',
	MT: 'microtransit'
};

function normalizeDayType(value: string | undefined): 'weekday' | 'saturday' | 'sunday' | null {
	const key = (value ?? '').trim().toUpperCase();
	if (key === 'WK') return 'weekday';
	if (key === 'SA') return 'saturday';
	if (key === 'SU') return 'sunday';
	return null;
}

function rowHasActivity(row: MonthlyRow): boolean {
	return (
		(row.operatingDays ?? 0) > 0 ||
		(row.hours ?? 0) > 0 ||
		(row.miles ?? 0) > 0 ||
		(row.passTripsNonCon ?? 0) > 0 ||
		(row.passTripsMedCon ?? 0) > 0 ||
		(row.passTripsNonMedCon ?? 0) > 0 ||
		(row.peakVehAmPm ?? 0) > 0 ||
		(row.peakVehMidday ?? 0) > 0
	);
}

export function buildOverviewPrefill(args: {
	type: FormType;
	agency: string;
	overview: OverviewRow | null;
	rows: MonthlyRow[];
}): Capabilities {
	const base = defaultCapabilities(args.type);
	const selectedModes = new Set<string>();
	const offeredDays: Record<'weekday' | 'saturday' | 'sunday', boolean> = {
		weekday: false,
		saturday: false,
		sunday: false
	};

	for (const row of args.rows) {
		if (!rowHasActivity(row)) continue;
		const day = normalizeDayType(row.dayType);
		if (day) offeredDays[day] = true;
	}

	const overview = args.overview;

	function hasYesValue(value: string | null | undefined): boolean {
		const normalized = String(value ?? '')
			.trim()
			.toUpperCase();
		return normalized === 'Y' || normalized === 'YES' || normalized === 'TRUE' || normalized === '1';
	}

	function hasKnownFlagValue(value: string | null | undefined): boolean {
		return value != null && String(value).trim().length > 0;
	}

	function coalesceText(value: string | null | undefined): string {
		return String(value ?? '').trim();
	}

	function formatIsoDate(value: Date | string | null | undefined): string {
		if (!value) return '';
		if (value instanceof Date && Number.isFinite(value.valueOf())) {
			return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
		}
		const text = String(value).trim();
		const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
		if (match) return `${match[1]}-${match[2]}-${match[3]}`;
		const parsed = new Date(text);
		if (!Number.isFinite(parsed.valueOf())) return '';
		return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
	}

	function formatTime(value: Date | string | null | undefined): string {
		if (!value) return '';
		let hour24 = 0;
		let minute = 0;

		if (value instanceof Date && Number.isFinite(value.valueOf())) {
			hour24 = value.getHours();
			minute = value.getMinutes();
		} else {
			const text = String(value).trim();
			const match = text.match(/(\d{2}):(\d{2})(?::\d{2})?$/);
			if (!match) return '';
			hour24 = Number(match[1]);
			minute = Number(match[2]);
			if (!Number.isFinite(hour24) || !Number.isFinite(minute)) return '';
		}

		const suffix = hour24 < 12 ? 'AM' : 'PM';
		const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
		return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
	}

	function toRouteCount(value: number | null | undefined): number {
		if (value == null) return 0;
		return Number.isFinite(Number(value)) ? Number(value) : 0;
	}

	function hasAnyValue(value: Date | string | number | null | undefined): boolean {
		if (value == null) return false;
		if (typeof value === 'number') return Number.isFinite(value) && value > 0;
		if (value instanceof Date) return Number.isFinite(value.valueOf());
		return String(value).trim().length > 0;
	}

	base.ctpGranteeLegalName = coalesceText(overview?.systemName) || args.agency;
	base.contactFirstName = coalesceText(overview?.firstName);
	base.contactMiddleInitial = coalesceText(overview?.middleInitial);
	base.contactLastName = coalesceText(overview?.lastName);
	base.email = coalesceText(overview?.email);
	base.phone = coalesceText(overview?.phone);
	base.fax = coalesceText(overview?.fax);
	base.date = formatIsoDate(overview?.date);

	const hasOverviewModeFlags =
		args.type === 'rural'
			? [
					overview?.drDo,
					overview?.drPt,
					overview?.mbDo,
					overview?.mbPt,
					overview?.mtDo,
					overview?.mtPt
				].some(hasKnownFlagValue)
			: [overview?.fr, overview?.dr, overview?.lr, overview?.sc, overview?.vp, overview?.mt].some(
					hasKnownFlagValue
				);

	if (args.type === 'rural') {
		if (hasYesValue(overview?.drDo)) selectedModes.add('dr_do');
		if (hasYesValue(overview?.drPt)) selectedModes.add('dr_pt');
		if (hasYesValue(overview?.mbDo)) selectedModes.add('mb_do');
		if (hasYesValue(overview?.mbPt)) selectedModes.add('mb_pt');
		if (hasYesValue(overview?.mtDo)) selectedModes.add('mt_do');
		if (hasYesValue(overview?.mtPt)) selectedModes.add('mt_pt');
	} else {
		if (hasYesValue(overview?.fr)) selectedModes.add('fixed_route');
		if (hasYesValue(overview?.dr)) selectedModes.add('dial_a_ride');
		if (hasYesValue(overview?.lr)) selectedModes.add('light_rail');
		if (hasYesValue(overview?.sc)) selectedModes.add('street_car');
		if (hasYesValue(overview?.vp)) selectedModes.add('vanpool');
		if (hasYesValue(overview?.mt)) selectedModes.add('microtransit');
	}

	base.days.weekday.offered = true;
	base.days.weekday.start = formatTime(overview?.wkdayBeginTime);
	base.days.weekday.end = formatTime(overview?.wkdayEndTime);
	base.days.weekday.peakRoutes = toRouteCount(overview?.wkdayRouteCounter);

	base.days.saturday.offered =
		hasAnyValue(overview?.satBeginTime) ||
		hasAnyValue(overview?.satEndTime) ||
		hasAnyValue(overview?.satRouteCounter);
	base.days.saturday.start = formatTime(overview?.satBeginTime);
	base.days.saturday.end = formatTime(overview?.satEndTime);
	base.days.saturday.peakRoutes = toRouteCount(overview?.satRouteCounter);

	base.days.sunday.offered =
		hasAnyValue(overview?.sunBeginTime) ||
		hasAnyValue(overview?.sunEndTime) ||
		hasAnyValue(overview?.sunRouteCounter);
	base.days.sunday.start = formatTime(overview?.sunBeginTime);
	base.days.sunday.end = formatTime(overview?.sunEndTime);
	base.days.sunday.peakRoutes = toRouteCount(overview?.sunRouteCounter);

	base.contractor = coalesceText(overview?.contractorName);

	if (args.type === 'rural') {
		const serviceAreaType = coalesceText(overview?.serviceAreaType).toUpperCase();
		base.rural = base.rural ?? {
			serviceArea: { multiCounty: false, counties: '' },
			ptContractor: { name: '', contractStart: '', contractEnd: '' },
			outOfServiceArea: { enabled: false, destinations: '' },
			coordination: { enabled: false, systems: '' }
		};
		base.rural.serviceArea.multiCounty = serviceAreaType.includes('MULTI');
		base.rural.serviceArea.counties = coalesceText(overview?.countiesServed);
		base.rural.ptContractor.name = coalesceText(overview?.contractorName);
		base.rural.ptContractor.contractStart = formatIsoDate(overview?.contractorBegin);
		base.rural.ptContractor.contractEnd = formatIsoDate(overview?.contractorEnd);
		base.rural.outOfServiceArea.enabled = hasYesValue(overview?.outOfCounty);
		base.rural.outOfServiceArea.destinations = coalesceText(overview?.otherCountiesServed);
		base.rural.coordination.enabled = hasYesValue(overview?.coordination);
		base.rural.coordination.systems = coalesceText(overview?.coordinatedCounties);
	}

	// Fallback to monthly only when overview mode flags are absent.
	if (!hasOverviewModeFlags || (!base.days.saturday.offered && !base.days.sunday.offered)) {
		for (const row of args.rows) {
			if (!rowHasActivity(row)) continue;
			const day = normalizeDayType(row.dayType);
			if (day) offeredDays[day] = true;

			if (!hasOverviewModeFlags) {
				const serviceType = row.serviceType.trim().toUpperCase();
				if (args.type === 'rural') {
					const mode = RURAL_SERVICE_TO_MODE[serviceType];
					if (mode) selectedModes.add(mode);
				} else {
					const mode = URBAN_SERVICE_TO_MODE[serviceType];
					if (mode) selectedModes.add(mode);
				}
			}
		}
		if (!base.days.saturday.offered) base.days.saturday.offered = offeredDays.saturday;
		if (!base.days.sunday.offered) base.days.sunday.offered = offeredDays.sunday;
	}

	base.selectedModes = Array.from(selectedModes);
	return base;
}
