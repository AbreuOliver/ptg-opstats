import { browser } from '$app/environment';
import { capabilitiesKey, loadCapabilities } from '$lib/features/forms/shared/stores/capabilities.store';
import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';
import { gridDraftKey } from '$lib/features/forms/grids/weekSatSun/stores/gridDraft.store';
import { isValidAgencyName, normalizeAgencyName } from './agency';
import type { LocalFormSlices } from './formsReport.types';

const ACTIVE_AGENCY_KEY = 'forms:active-agency:v1';

function safeParse(raw: string): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function listFormStorageKeys(type: FormType, year: number): string[] {
	return [
		capabilitiesKey(type, year),
		gridDraftKey(type, year, 'weekday'),
		gridDraftKey(type, year, 'saturday'),
		gridDraftKey(type, year, 'sunday'),
		`finance:${type}:${year}:urban-financial`,
		`finance:${type}:${year}:rural-financial:descriptions`,
		`assaults:${type}:${year}:physical-assaults`,
		`assaults:${type}:${year}:non-physical-assaults`,
		`annual-statistics:${type}:${year}`,
		`other-safety-security:${type}:${year}:v2`,
		`reconciliation:${type}:${year}:urban`,
		`completion:${type}:${year}:rural`
	];
}

export function buildLocalFormDraft(type: FormType, year: number): LocalFormSlices {
	if (!browser) return {};

	const slices: LocalFormSlices = {};
	for (const key of listFormStorageKeys(type, year)) {
		const raw = localStorage.getItem(key);
		if (!raw) continue;
		slices[key] = safeParse(raw);
	}

	return slices;
}

export function applyLocalFormDraft(type: FormType, year: number, slices: LocalFormSlices): void {
	if (!browser) return;
	const allowedKeys = new Set(listFormStorageKeys(type, year));

	for (const [key, value] of Object.entries(slices)) {
		if (!allowedKeys.has(key)) continue;
		localStorage.setItem(key, JSON.stringify(value));
	}
}

export function hasAnyLocalFormDraft(type: FormType, year: number): boolean {
	if (!browser) return false;
	return listFormStorageKeys(type, year).some((key) => localStorage.getItem(key) !== null);
}

export function rememberActiveAgency(rawAgencyName: string): void {
	if (!browser || !isValidAgencyName(rawAgencyName)) return;
	localStorage.setItem(ACTIVE_AGENCY_KEY, normalizeAgencyName(rawAgencyName));
}

export function readRememberedAgency(): string | null {
	if (!browser) return null;
	const raw = localStorage.getItem(ACTIVE_AGENCY_KEY);
	if (!raw || !isValidAgencyName(raw)) return null;
	return normalizeAgencyName(raw);
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
