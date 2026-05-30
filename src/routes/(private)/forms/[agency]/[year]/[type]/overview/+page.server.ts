import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOpStatsRepository } from '$lib/server/opstats/repository';
import { buildOverviewPrefill } from '$lib/server/opstats/overviewPrefill';

export const load: PageServerLoad = async ({ params, parent }) => {
	const year = Number(params.year);
	const type = params.type as 'urban' | 'rural';
	if (!Number.isFinite(year) || (type !== 'urban' && type !== 'rural')) {
		throw error(404, 'Invalid overview route');
	}

	const parentData = await parent();
	const agency =
		typeof parentData?.rbac?.selectedAgency === 'string' ? parentData.rbac.selectedAgency : null;
	if (!agency) {
		return { overviewPrefill: null };
	}

	try {
		const repo = getOpStatsRepository();
		const systemId = await repo.resolveSystemIdByAgencyName(agency);
		if (!systemId) return { overviewPrefill: null };
		const [overview, rows] = await Promise.all([
			repo.getOverviewRow({ systemId, year }),
			repo.getYearMonthlyRows({ systemId, year })
		]);
		if (!overview && rows.length === 0) return { overviewPrefill: null };
		return {
			overviewPrefill: buildOverviewPrefill({
				type,
				agency,
				overview,
				rows
			})
		};
	} catch (err) {
		console.error('[forms] failed to load overview prefill from OpStats tables', {
			agency,
			year,
			type,
			err
		});
		return { overviewPrefill: null };
	}
};
