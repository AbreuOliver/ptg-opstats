import { loadReportCertificationState } from '$lib/server/reportCertification/service';
import { buildReportSignatureSessionUser } from '$lib/server/reportCertification/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOpStatsRepository } from '$lib/server/opstats/repository';
import { isEditableFiscalYear } from '$lib/features/forms/shared/fiscalYearAccess';

export const load: PageServerLoad = async ({ parent, params, locals }) => {
	if (params.type !== 'urban') {
		throw error(404, 'Not found');
	}

	const parentData = await parent();
	const agency = parentData.rbac?.selectedAgency;
	const year = Number(params.year);

	if (!agency || !Number.isFinite(year)) {
		return {
			remoteDraft: null,
			remoteFinanceDraft: null,
			remoteSystemId: null,
			certification: {
				reportHash: null,
				signatures: [],
				canSign: false,
				currentUser: null
			}
		};
	}

	const repo = getOpStatsRepository();
	const systemId = await repo.resolveWritableSystemIdByAgencyName(agency, 'urban');
	if (!systemId) {
		return {
			remoteDraft: null,
			remoteFinanceDraft: null,
			remoteSystemId: null,
			certification: {
				reportHash: null,
				signatures: [],
				canSign: false,
				currentUser: null
			}
		};
	}

	const remoteFinance = await repo.getUrbanFinancialDraft({ systemId, year });
	const remoteDraft = await repo.getUrbanFinancialOutcomeDraft({ systemId, year });
	const currentFiscalYear =
		new Date().getMonth() >= 6 ? new Date().getFullYear() + 1 : new Date().getFullYear();
	const certification = await loadReportCertificationState({
		agency,
		type: 'urban',
		year,
		user: locals.user
	}).catch(() => ({
		reportHash: null,
		signatures: []
	}));

	return {
		remoteDraft,
		remoteFinanceDraft: remoteFinance,
		remoteSystemId: systemId,
		certification: {
			reportHash: certification.reportHash ?? null,
			signatures: certification.signatures ?? [],
			canSign: isEditableFiscalYear(year, currentFiscalYear),
			currentUser: locals.user ? buildReportSignatureSessionUser(locals.user) : null
		}
	};
};
