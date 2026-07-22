import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadWeekSatSunRdsData } from '$lib/server/opstats/weekSatSunLoader';

export const load: PageServerLoad = async ({ params, parent }) => {
	const year = Number(params.year);
	const type = params.type as 'urban' | 'rural';
	const parentData = await parent();
	const agency =
		typeof parentData?.rbac?.selectedAgency === 'string' ? parentData.rbac.selectedAgency : null;

	const data = await loadWeekSatSunRdsData({
		type,
		year,
		slug: 'sunday',
		agency
	});

	if (data.overviewCapabilities?.days.sunday.offered === false) {
		throw error(404, 'Sunday service is not offered for this form.');
	}

	return data;
};
