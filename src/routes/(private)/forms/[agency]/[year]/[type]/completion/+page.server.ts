import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOpStatsRepository } from '$lib/server/opstats/repository';

export const load: PageServerLoad = async ({ parent, params }) => {
	if (params.type !== 'rural') {
		throw error(404, 'Not found');
	}

	const parentData = await parent();
	const agency = parentData.rbac?.selectedAgency;
	const year = Number(params.year);

	if (!agency || !Number.isFinite(year)) {
		return { remoteDraft: null, remoteFinanceDraft: null, remoteSystemId: null };
	}

	const repo = getOpStatsRepository();
	const systemId = await repo.resolveWritableSystemIdByAgencyName(agency);
	if (!systemId) {
		return { remoteDraft: null, remoteFinanceDraft: null, remoteSystemId: null };
	}

	const remoteFinance = await repo.getRuralFinancialDraft({ systemId, year });

	return {
		remoteFinanceDraft: remoteFinance?.draft ?? null,
		remoteSystemId: systemId
	};
};
