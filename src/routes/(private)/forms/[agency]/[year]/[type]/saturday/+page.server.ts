import type { PageServerLoad } from './$types';
import { loadWeekSatSunRdsData } from '$lib/server/opstats/weekSatSunLoader';

export const load: PageServerLoad = async ({ params, parent }) => {
	const year = Number(params.year);
	const type = params.type as 'urban' | 'rural';
	const parentData = await parent();
	const agency =
		typeof parentData?.rbac?.selectedAgency === 'string' ? parentData.rbac.selectedAgency : null;

	return loadWeekSatSunRdsData({
		type,
		year,
		slug: 'saturday',
		agency
	});
};
