import type { PageServerLoad } from './$types';
import { getOpStatsRepository } from '$lib/server/opstats/repository';
import { buildOverviewPrefill } from '$lib/server/opstats/overviewPrefill';

export const load: PageServerLoad = async ({ parent, params }) => {
	const parentData = await parent();
	const agency = parentData.rbac?.selectedAgency;
	const type = params.type === 'rural' ? 'rural' : 'urban';
	const year = Number(params.year);

	if (!agency || !Number.isFinite(year)) {
		return { remoteDraft: null, remoteDescriptions: null, remoteSystemId: null };
	}

	const repo = getOpStatsRepository();
	const systemId = await repo.resolveWritableSystemIdByAgencyName(agency, type);
	if (!systemId) {
		return { overviewPrefill: null, remoteDraft: null, remoteDescriptions: null, remoteSystemId: null };
	}

	const [overview, rows] = await Promise.all([
		repo.getOverviewRow({ systemId, year }),
		repo.getYearMonthlyRows({ systemId, year })
	]);
	const overviewPrefill = overview || rows.length > 0 ? buildOverviewPrefill({ type, agency, overview, rows }) : null;

	if (type === 'rural') {
		const result = await repo.getRuralFinancialDraft({ systemId, year });
		return {
			overviewPrefill,
			remoteDraft: result?.draft ?? null,
			remoteDescriptions: result?.descriptions ?? null,
			remoteSystemId: systemId
		};
	}

	return {
		overviewPrefill,
		remoteDraft: await repo.getUrbanFinancialDraft({ systemId, year }),
		remoteDescriptions: null,
		remoteSystemId: systemId
	};
};
