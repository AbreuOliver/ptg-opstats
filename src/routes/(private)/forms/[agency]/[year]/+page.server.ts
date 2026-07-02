import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOpStatsRepository } from '$lib/server/opstats/repository';
import { deriveTypeAvailability } from '$lib/server/opstats/typeAvailability';
import { TRANSIT_SYSTEMS } from '$lib/data/transitSystems';
import { getCurrentFiscalYear } from '$lib/server/opstats/weekSatSunLoader';
import { normalizeAgencyName } from '$lib/features/forms/persistence/agency';
import { isEditableFiscalYear } from '$lib/features/forms/shared/fiscalYearAccess';

export const load: PageServerLoad = async ({ params, parent }) => {
	const year = Number(params.year);
	if (!Number.isFinite(year)) throw error(404, 'Invalid year');

	const parentData = await parent();
	const agency =
		typeof parentData?.rbac?.selectedAgency === 'string' && parentData.rbac.selectedAgency.length > 0
			? parentData.rbac.selectedAgency
			: null;

	const currentFiscalYear = getCurrentFiscalYear();
	if (!agency) {
		return {
			agency: null,
			year,
			currentFiscalYear,
			isEditableYear: isEditableFiscalYear(year, currentFiscalYear),
			systemId: null,
			allowsUrban: true,
			allowsRural: true,
			inferredAsBoth: false
		};
	}

	const fallbackSystemId =
		TRANSIT_SYSTEMS.find((row) => normalizeAgencyName(row.name) === normalizeAgencyName(agency))?.id ?? null;

	let systemId: number | null = fallbackSystemId;
	let serviceTypes: string[] = [];
	try {
		const repo = getOpStatsRepository();
		const resolved = await repo.resolveWritableSystemIdByAgencyName(agency);
		systemId = resolved ?? fallbackSystemId;
		if (systemId) {
			serviceTypes = await repo.listServiceTypesForSystem(systemId);
		}
	} catch (err) {
		console.error('[forms] failed to load service type availability for agency/year selector', {
			agency,
			err
		});
		// keep fallback from static list
	}

	const availability = deriveTypeAvailability({ systemId, serviceTypes });

	return {
		agency,
		year,
		currentFiscalYear,
		isEditableYear: isEditableFiscalYear(year, currentFiscalYear),
		systemId,
		allowsUrban: availability.allowsUrban,
		allowsRural: availability.allowsRural,
		inferredAsBoth: availability.inferredAsBoth
	};
};
