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
		return { remoteDraft: null, remoteSystemId: null };
	}

	const repo = getOpStatsRepository();
	const systemId = await repo.resolveSystemIdByAgencyName(agency);
	if (!systemId) {
		return { remoteDraft: null, remoteSystemId: null };
	}

	return {
		remoteDraft: await repo.getAssaultSafetyDraft({ systemId, year, kind: 'physical' }),
		remoteSystemId: systemId
	};
};
