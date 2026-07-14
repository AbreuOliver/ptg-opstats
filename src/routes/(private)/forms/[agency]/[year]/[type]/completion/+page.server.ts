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
		return {
			agency: agency ?? null,
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
			remoteDraft: null,
			remoteFinanceDraft: null,
			remoteAnnualStatisticsDraft: null,
			remoteMonthlyRows: [],
			remoteSystemId: null
		};
	}

	const [remoteFinance, remoteAnnualStatisticsDraft, remoteMonthlyRows, remoteDraft] =
		await Promise.all([
			repo.getRuralFinancialDraft({ systemId, year }),
			repo.getAnnualStatisticsDraft({ systemId, year }),
			repo.getYearMonthlyRows({ systemId, year }),
			repo.getRuralCompletionDraft({ systemId, year })
		]);

	return {
		agency,
		remoteDraft,
		remoteFinanceDraft: remoteFinance?.draft ?? null,
		remoteAnnualStatisticsDraft,
		remoteMonthlyRows,
		remoteSystemId: systemId
	};
};
