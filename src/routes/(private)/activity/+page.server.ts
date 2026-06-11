import type { PageServerLoad } from './$types';
import { getActivityRepository } from '$lib/server/activity/repository';
import { getOpStatsRepository } from '$lib/server/opstats/repository';
import { normalizeAgencyName } from '$lib/features/forms/persistence/agency';

export const load: PageServerLoad = async ({ parent, url }) => {
	const parentData = await parent();
	const userScope = parentData.userScope;
	const requestedAgency = url.searchParams.get('agency');
	const selectedAgency =
		userScope.isSuperAdmin && requestedAgency
			? normalizeAgencyName(requestedAgency)
			: userScope.transitSystem;

	let systemId: number | null = null;
	if (selectedAgency) {
		systemId = await getOpStatsRepository().resolveSystemIdByAgencyName(selectedAgency);
	}

	const events = await getActivityRepository().list({
		agency: selectedAgency,
		systemId,
		limit: 100
	});

	return {
		selectedAgency,
		systemId,
		isSuperAdmin: userScope.isSuperAdmin,
		events
	};
};
