import type { PageServerLoad } from './$types';
import { getOpStatsRepository } from '$lib/server/opstats/repository';

export const load: PageServerLoad = async ({ parent, params }) => {
	const parentData = await parent();
	const agency = parentData.rbac?.selectedAgency;
	const year = Number(params.year);

	if (!agency || !Number.isFinite(year)) {
		return { remoteDraft: null, remoteSystemId: null };
	}

	const repo = getOpStatsRepository();
	const systemId = await repo.resolveWritableSystemIdByAgencyName(agency);
	if (!systemId) {
		return { remoteDraft: null, remoteSystemId: null };
	}

	return {
		remoteDraft: await repo.getAnnualStatisticsDraft({ systemId, year }),
		remoteSystemId: systemId
	};
};
