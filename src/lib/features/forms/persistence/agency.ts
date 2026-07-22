import { TRANSIT_SYSTEMS } from '$lib/data/transitSystems';
import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';

export function normalizeAgencyName(input: string): string {
	return input.trim().replace(/\s+/g, ' ').toUpperCase();
}

export function isValidAgencyName(input: string): boolean {
	return normalizeAgencyName(input).length > 0;
}

export function toAgencyPathSegment(input: string): string {
	const compact = input.trim().replace(/\s+/g, '-');
	return encodeURIComponent(compact);
}

type DualModeAgency = {
	canonicalName: string;
	aliases: string[];
	systemIdsByType: Record<FormType, number>;
	aliasSystemId: number;
};

const DUAL_MODE_AGENCIES: DualModeAgency[] = [
	{
		canonicalName: 'Goldsboro-Wayne Transportation Authority',
		aliases: ['GOLDSBORO'],
		systemIdsByType: {
			rural: 191,
			urban: 217
		},
		aliasSystemId: 217
	},
	{
		canonicalName: 'Western Piedmont Regional Transportation Authority',
		aliases: ['WPRTA', 'Western Piedmont Regional Transit Authority'],
		systemIdsByType: {
			rural: 3,
			urban: 247
		},
		aliasSystemId: 247
	},
	{
		canonicalName: 'City of Rocky Mount',
		aliases: ['ROCKY MOUNT'],
		systemIdsByType: {
			rural: 127,
			urban: 235
		},
		aliasSystemId: 235
	}
];

const HIDDEN_ALIAS_SYSTEM_IDS = new Set(DUAL_MODE_AGENCIES.map((entry) => entry.aliasSystemId));
const CANONICAL_KEY_BY_LOOKUP = new Map<string, string>();
const CANONICAL_DISPLAY_BY_KEY = new Map<string, string>();
const SINGLE_SYSTEM_ID_BY_KEY = new Map<string, number>();
const DUAL_SYSTEM_IDS_BY_KEY = new Map<string, Record<FormType, number>>();
const DUAL_FILTER_NAMES_BY_KEY = new Map<string, string[]>();

function decodeMaybe(input: string): string {
	try {
		return decodeURIComponent(input);
	} catch {
		return input;
	}
}

function registerLookup(raw: string, canonicalKey: string) {
	const normalized = normalizeAgencyName(raw);
	const pathVariant = toAgencyPathSegment(raw).toUpperCase();
	const dashedAsSpaces = normalizeAgencyName(raw.replace(/-/g, ' '));
	CANONICAL_KEY_BY_LOOKUP.set(normalized, canonicalKey);
	CANONICAL_KEY_BY_LOOKUP.set(pathVariant, canonicalKey);
	CANONICAL_KEY_BY_LOOKUP.set(dashedAsSpaces, canonicalKey);
}

for (const system of TRANSIT_SYSTEMS) {
	if (HIDDEN_ALIAS_SYSTEM_IDS.has(system.id)) continue;
	const key = normalizeAgencyName(system.name);
	CANONICAL_DISPLAY_BY_KEY.set(key, system.name);
	SINGLE_SYSTEM_ID_BY_KEY.set(key, system.id);
	registerLookup(system.name, key);
}

for (const entry of DUAL_MODE_AGENCIES) {
	const canonicalKey = normalizeAgencyName(entry.canonicalName);
	CANONICAL_DISPLAY_BY_KEY.set(canonicalKey, entry.canonicalName);
	DUAL_SYSTEM_IDS_BY_KEY.set(canonicalKey, entry.systemIdsByType);
	DUAL_FILTER_NAMES_BY_KEY.set(
		canonicalKey,
		[entry.canonicalName, ...entry.aliases]
			.map((value) => decodeMaybe(value).trim().replace(/\s+/g, ' '))
			.filter((value, index, values) => value.length > 0 && values.indexOf(value) === index)
	);
	SINGLE_SYSTEM_ID_BY_KEY.set(canonicalKey, entry.systemIdsByType.rural);
	registerLookup(entry.canonicalName, canonicalKey);
	for (const alias of entry.aliases) {
		registerLookup(alias, canonicalKey);
	}
}

export const CANONICAL_TRANSIT_SYSTEMS = TRANSIT_SYSTEMS.filter(
	(system) => !HIDDEN_ALIAS_SYSTEM_IDS.has(system.id)
);

export const CANONICAL_TRANSIT_SYSTEM_NAMES = CANONICAL_TRANSIT_SYSTEMS.map((system) => system.name);

export function canonicalizeTransitAgencyKey(input: string): string {
	const decoded = decodeMaybe(input).trim();
	if (!decoded) return '';

	const direct = CANONICAL_KEY_BY_LOOKUP.get(normalizeAgencyName(decoded));
	if (direct) return direct;

	const pathVariant = CANONICAL_KEY_BY_LOOKUP.get(toAgencyPathSegment(decoded).toUpperCase());
	if (pathVariant) return pathVariant;

	const dashedAsSpaces = CANONICAL_KEY_BY_LOOKUP.get(normalizeAgencyName(decoded.replace(/-/g, ' ')));
	if (dashedAsSpaces) return dashedAsSpaces;

	return normalizeAgencyName(decoded);
}

export function canonicalizeTransitAgencyDisplayName(input: string): string {
	const key = canonicalizeTransitAgencyKey(input);
	return CANONICAL_DISPLAY_BY_KEY.get(key) ?? decodeMaybe(input).trim().replace(/\s+/g, ' ');
}

export function getTransitAgencySystemIds(input: string): number[] {
	const key = canonicalizeTransitAgencyKey(input);
	const dual = DUAL_SYSTEM_IDS_BY_KEY.get(key);
	if (dual) return [dual.rural, dual.urban];

	const single = SINGLE_SYSTEM_ID_BY_KEY.get(key);
	return typeof single === 'number' ? [single] : [];
}

export function getTransitAgencyFilterNames(input: string): string[] {
	const key = canonicalizeTransitAgencyKey(input);
	const dual = DUAL_FILTER_NAMES_BY_KEY.get(key);
	if (dual) return dual;

	const displayName = canonicalizeTransitAgencyDisplayName(input).trim().replace(/\s+/g, ' ');
	return displayName ? [displayName] : [];
}

export function getTransitAgencySystemId(input: string, type?: FormType): number | null {
	const key = canonicalizeTransitAgencyKey(input);
	if (type) {
		const dual = DUAL_SYSTEM_IDS_BY_KEY.get(key);
		if (dual) return dual[type];
	}
	return SINGLE_SYSTEM_ID_BY_KEY.get(key) ?? null;
}

export function fromAgencyPathSegment(input: string, candidates: string[] = []): string {
	let decoded: string;
	try {
		decoded = decodeURIComponent(input).trim();
	} catch {
		decoded = input.trim();
	}

	if (candidates.length > 0) {
		for (const candidate of candidates) {
			if (toAgencyPathSegment(candidate).toUpperCase() === input.toUpperCase()) {
				return canonicalizeTransitAgencyKey(candidate);
			}
		}
		for (const candidate of candidates) {
			if (canonicalizeTransitAgencyKey(candidate) === canonicalizeTransitAgencyKey(decoded)) {
				return canonicalizeTransitAgencyKey(candidate);
			}
		}
		const dashedAsSpaces = decoded.replace(/-/g, ' ');
		for (const candidate of candidates) {
			if (canonicalizeTransitAgencyKey(candidate) === canonicalizeTransitAgencyKey(dashedAsSpaces)) {
				return canonicalizeTransitAgencyKey(candidate);
			}
		}
	}

	return canonicalizeTransitAgencyKey(decoded);
}
