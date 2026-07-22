import type { FormType } from './repository';
import { normalizeAgencyName } from '$lib/features/forms/persistence/agency';

const URBAN_SERVICE_TYPES = new Set(['DR', 'FR', 'LR', 'SC', 'VP', 'MT']);
const RURAL_SERVICE_TYPES = new Set(['DR DO', 'DR PT', 'MB DO', 'MB PT', 'MT DO', 'MT PT']);

export type TypeAvailability = {
	systemId: number | null;
	allowsUrban: boolean;
	allowsRural: boolean;
	inferredAsBoth: boolean;
};

const DUAL_MODE_AGENCIES = new Set([
	normalizeAgencyName('AAA Test Transit Agency'),
	normalizeAgencyName('Goldsboro-Wayne Transportation Authority'),
	normalizeAgencyName('Western Piedmont Regional Transportation Authority'),
	normalizeAgencyName('City of Rocky Mount')
]);

export function deriveTypeAvailability(args: {
	agencyName?: string | null;
	systemId: number | null;
	serviceTypes: string[];
}): TypeAvailability {
	const { systemId } = args;
	const normalizedAgencyName = normalizeAgencyName(args.agencyName ?? '');
	if (DUAL_MODE_AGENCIES.has(normalizedAgencyName)) {
		return {
			systemId,
			allowsUrban: true,
			allowsRural: true,
			inferredAsBoth: true
		};
	}
	const normalized = args.serviceTypes.map((s) => s.trim().toUpperCase());
	const hasUrbanService = normalized.some((s) => URBAN_SERVICE_TYPES.has(s));
	const hasRuralService = normalized.some((s) => RURAL_SERVICE_TYPES.has(s));
	const inferredAsBoth = hasUrbanService && hasRuralService;

	if (inferredAsBoth) {
		return {
			systemId,
			allowsUrban: true,
			allowsRural: true,
			inferredAsBoth
		};
	}

	if (typeof systemId === 'number') {
		if (systemId < 200) {
			return {
				systemId,
				allowsUrban: false,
				allowsRural: true,
				inferredAsBoth
			};
		}
		return {
			systemId,
			allowsUrban: true,
			allowsRural: false,
			inferredAsBoth
		};
	}

	// If system ID cannot be resolved, keep both enabled as a safe fallback.
	return {
		systemId: null,
		allowsUrban: true,
		allowsRural: true,
		inferredAsBoth
	};
}

export function isTypeAllowed(type: FormType, availability: TypeAvailability): boolean {
	return type === 'urban' ? availability.allowsUrban : availability.allowsRural;
}
