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
	const systemId = await repo.resolveWritableSystemIdByAgencyName(agency, params.type as 'urban' | 'rural');
	if (!systemId) {
		return { remoteDraft: null, remoteSystemId: null };
	}

	let remoteDraft = await repo.getOtherSafetyDraft({ systemId, year });
	if (!remoteDraft) {
		const latestYear = await repo.getLatestSafetyStatsYear(systemId);
		if (latestYear != null && latestYear !== year) {
			remoteDraft = await repo.getOtherSafetyDraft({ systemId, year: latestYear });
		}
	}

	return {
		remoteDraft,
		remoteSystemId: systemId
	};
};
