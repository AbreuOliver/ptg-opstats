import type { PageServerLoad } from './$types';
import { loadWeekSatSunRdsData } from '$lib/server/opstats/weekSatSunLoader';

export const load: PageServerLoad = async ({ params, parent }) => {
	const year = Number(params.year);
	const type = params.type as 'urban' | 'rural';
	const parentData = await parent();
	const agency =
		typeof parentData?.rbac?.selectedAgency === 'string' ? parentData.rbac.selectedAgency : null;

	const [weekday, saturday, sunday] = await Promise.all([
		loadWeekSatSunRdsData({ type, year, slug: 'weekday', agency }),
		loadWeekSatSunRdsData({ type, year, slug: 'saturday', agency }),
		loadWeekSatSunRdsData({ type, year, slug: 'sunday', agency })
	]);

	return {
		currentFiscalYear: weekday.currentFiscalYear,
		readonlyYear: weekday.readonlyYear,
		overviewCapabilities: weekday.overviewCapabilities,
		rdsSnapshots: {
			weekday: weekday.rdsSnapshot,
			saturday: saturday.rdsSnapshot,
			sunday: sunday.rdsSnapshot
		}
	};
};

