import { browser } from '$app/environment';
import { capabilitiesKey, loadCapabilities } from '$lib/features/forms/shared/stores/capabilities.store';
import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';
import { gridDraftKey } from '$lib/features/forms/grids/weekSatSun/stores/gridDraft.store';
import { isValidAgencyName, normalizeAgencyName } from './agency';
import { buildCurrentFormDraft } from './formDraftRegistry';
import type { LocalFormSlices } from './formsReport.types';

export function listFormStorageKeys(type: FormType, year: number): string[] {
	return [
		capabilitiesKey(type, year),
		gridDraftKey(type, year, 'weekday'),
		gridDraftKey(type, year, 'saturday'),
		gridDraftKey(type, year, 'sunday'),
		`finance:${type}:${year}:urban-financial`,
		`finance:${type}:${year}:rural-financial:descriptions`,
		`completion:${type}:${year}:rural`,
		`reconciliation:${type}:${year}:urban`,
		`assaults:${type}:${year}:physical-assaults`,
		`assaults:${type}:${year}:non-physical-assaults`,
		`annual-statistics:${type}:${year}`,
		`other-safety-security:${type}:${year}:v2`
	];
}

export function buildLocalFormDraft(type: FormType, year: number): LocalFormSlices {
	return buildCurrentFormDraft(type, year);
}

export function clearLocalFormDraft(type: FormType, year: number): void {
	void type;
	void year;
}

export function applyLocalFormDraft(type: FormType, year: number, slices: LocalFormSlices): void {
	void type;
	void year;
	void slices;
}

export function hasAnyLocalFormDraft(type: FormType, year: number): boolean {
	void type;
	void year;
	return false;
}

export function rememberActiveAgency(rawAgencyName: string): void {
	void rawAgencyName;
}

export function readRememberedAgency(): string | null {
	return null;
}

export function resolveAgencyForContext(
	type: FormType,
	year: number,
	queryAgency: string | null
): string | null {
	if (!browser) return null;

	if (queryAgency && isValidAgencyName(queryAgency)) {
		const agency = normalizeAgencyName(queryAgency);
		rememberActiveAgency(agency);
		return agency;
	}

	const capabilities = loadCapabilities(type, year);
	if (capabilities?.ctpGranteeLegalName && isValidAgencyName(capabilities.ctpGranteeLegalName)) {
		const agency = normalizeAgencyName(capabilities.ctpGranteeLegalName);
		rememberActiveAgency(agency);
		return agency;
	}

	return readRememberedAgency();
}
