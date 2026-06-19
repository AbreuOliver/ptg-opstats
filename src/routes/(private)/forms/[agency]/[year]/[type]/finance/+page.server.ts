import type { PageServerLoad } from './$types';
import { getOpStatsRepository } from '$lib/server/opstats/repository';

export const load: PageServerLoad = async ({ parent, params }) => {
	const parentData = await parent();
	const agency = parentData.rbac?.selectedAgency;
	const type = params.type === 'rural' ? 'rural' : 'urban';
	const year = Number(params.year);

	if (!agency || !Number.isFinite(year)) {
		return { remoteDraft: null, remoteDescriptions: null, remoteSystemId: null };
	}

	const repo = getOpStatsRepository();
	const systemId = await repo.resolveSystemIdByAgencyName(agency);
	if (!systemId) {
		return { remoteDraft: null, remoteDescriptions: null, remoteSystemId: null };
	}

	if (type === 'rural') {
		const result = await repo.getRuralFinancialDraft({ systemId, year });
		return {
			remoteDraft: result?.draft ?? null,
			remoteDescriptions: result?.descriptions ?? null,
			remoteSystemId: systemId
		};
	}

	return {
		remoteDraft: await repo.getUrbanFinancialDraft({ systemId, year }),
		remoteDescriptions: null,
		remoteSystemId: systemId
	};
};
