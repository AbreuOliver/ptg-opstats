import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOpStatsRepository } from '$lib/server/opstats/repository';
import { buildOverviewPrefill } from '$lib/server/opstats/overviewPrefill';
import { isEditableFiscalYear } from '$lib/features/forms/shared/fiscalYearAccess';
import { loadReportCertificationState } from '$lib/server/reportCertification/service';
import { buildReportSignatureSessionUser } from '$lib/server/reportCertification/utils';

export const load: PageServerLoad = async ({ parent, params, locals }) => {
	if (params.type !== 'rural') {
		throw error(404, 'Not found');
	}

	const parentData = await parent();
	const agency = parentData.rbac?.selectedAgency;
	const year = Number(params.year);
	const currentFiscalYear =
		new Date().getMonth() >= 6 ? new Date().getFullYear() + 1 : new Date().getFullYear();

	if (!agency || !Number.isFinite(year)) {
		return {
			agency: agency ?? null,
			overviewPrefill: null,
			remoteDraft: null,
			remoteFinanceDraft: null,
			remoteAnnualStatisticsDraft: null,
			remoteMonthlyRows: [],
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
	const systemId = await repo.resolveWritableSystemIdByAgencyName(agency, 'rural');
	if (!systemId) {
		return {
			agency,
			overviewPrefill: null,
			remoteDraft: null,
			remoteFinanceDraft: null,
			remoteAnnualStatisticsDraft: null,
			remoteMonthlyRows: [],
			remoteSystemId: null,
			certification: {
				reportHash: null,
				signatures: [],
				canSign: false,
				currentUser: null
			}
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
		overview || rows.length > 0
			? buildOverviewPrefill({ type: 'rural', agency, overview, rows })
			: null;
	const canSign = isEditableFiscalYear(year, currentFiscalYear);
	const certification = await loadReportCertificationState({
		agency,
		type: 'rural',
		year,
		user: locals.user
	}).catch(() => ({
		reportHash: null,
		signatures: []
	}));

	return {
		agency,
		overviewPrefill,
		remoteDraft,
		remoteFinanceDraft: remoteFinance?.draft ?? null,
		remoteAnnualStatisticsDraft,
		remoteMonthlyRows: rows,
		remoteSystemId: systemId,
		certification: {
			reportHash: certification.reportHash ?? null,
			signatures: certification.signatures ?? [],
			canSign,
			currentUser: locals.user ? buildReportSignatureSessionUser(locals.user) : null
		}
	};
};
