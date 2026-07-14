import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOpStatsRepository } from '$lib/server/opstats/repository';
import { buildOverviewPrefill } from '$lib/server/opstats/overviewPrefill';

export const load: PageServerLoad = async ({ parent, params }) => {
	if (params.type !== 'rural') {
		throw error(404, 'Not found');
	}

	const parentData = await parent();
	const agency = parentData.rbac?.selectedAgency;
	const year = Number(params.year);

	if (!agency || !Number.isFinite(year)) {
		return {
			agency: agency ?? null,
			overviewPrefill: null,
			remoteDraft: null,
			remoteFinanceDraft: null,
			remoteAnnualStatisticsDraft: null,
			remoteMonthlyRows: [],
			remoteSystemId: null
		};
	}

	const repo = getOpStatsRepository();
	const systemId = await repo.resolveWritableSystemIdByAgencyName(agency);
	if (!systemId) {
		return {
			agency,
			overviewPrefill: null,
			remoteDraft: null,
			remoteFinanceDraft: null,
			remoteAnnualStatisticsDraft: null,
			remoteMonthlyRows: [],
			remoteSystemId: null
		};
	}

	const [overview, rows, remoteFinance, remoteAnnualStatisticsDraft, remoteDraft] =
		await Promise.all([
			repo.getOverviewRow({ systemId, year }),
			repo.getYearMonthlyRows({ systemId, year }),
			repo.getRuralFinancialDraft({ systemId, year }),
			repo.getAnnualStatisticsDraft({ systemId, year }),
			repo.getRuralCompletionDraft({ systemId, year })
		]);
	const overviewPrefill =
		overview || rows.length > 0 ? buildOverviewPrefill({ type: 'rural', agency, overview, rows }) : null;

	return {
		agency,
		overviewPrefill,
		remoteDraft,
		remoteFinanceDraft: remoteFinance?.draft ?? null,
		remoteAnnualStatisticsDraft,
		remoteMonthlyRows: rows,
		remoteSystemId: systemId
	};
};
