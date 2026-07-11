import type { PageServerLoad } from './$types';
import { getActivityRepository } from '$lib/server/activity/repository';
import { getOpStatsRepository } from '$lib/server/opstats/repository';
import { listSystemInfoOptions } from '$lib/server/opstats/usersRepository';
import { normalizeAgencyName } from '$lib/features/forms/persistence/agency';

export const load: PageServerLoad = async ({ parent, url }) => {
	const parentData = await parent();
	const userScope = parentData.userScope;
	const requestedAgency = url.searchParams.get('agency');
	const requestedUser = url.searchParams.get('user')?.trim() ?? '';
	const selectedAgency =
		userScope.isSuperAdmin && requestedAgency
			? normalizeAgencyName(requestedAgency)
			: userScope.transitSystem;
	const selectedUserEmail = requestedUser || null;

	let systemId: number | null = null;
	if (selectedAgency) {
		systemId = await getOpStatsRepository().resolveSystemIdByAgencyName(selectedAgency);
	}

	const activityRepository = getActivityRepository();
	const [agencyOptions, userOptions, events] = await Promise.all([
		listSystemInfoOptions(),
		activityRepository.listUsers({
			agency: selectedAgency,
			systemId
		}),
		activityRepository.list({
			agency: selectedAgency,
			systemId,
			userEmail: selectedUserEmail,
			limit: 100
		})
	]);

	return {
		selectedAgency,
		selectedUserEmail,
		systemId,
		isSuperAdmin: userScope.isSuperAdmin,
		agencyOptions,
		userOptions,
		events
	};
};
