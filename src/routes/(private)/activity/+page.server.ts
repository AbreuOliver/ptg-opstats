import type { PageServerLoad } from './$types';
import { getActivityRepository } from '$lib/server/activity/repository';
import { listSystemInfoOptions } from '$lib/server/opstats/usersRepository';
import {
	canonicalizeTransitAgencyDisplayName,
	getTransitAgencySystemIds
} from '$lib/features/forms/persistence/agency';

export const load: PageServerLoad = async ({ parent, url }) => {
	const parentData = await parent();
	const userScope = parentData.userScope;
	const requestedAgency = url.searchParams.get('agency');
	const requestedUser = url.searchParams.get('user')?.trim() ?? '';
	const selectedAgency =
		userScope.isSuperAdmin && requestedAgency
			? canonicalizeTransitAgencyDisplayName(requestedAgency)
			: canonicalizeTransitAgencyDisplayName(userScope.transitSystem ?? '');
	const selectedUserEmail = requestedUser || null;
	const selectedAgencySystemIds = selectedAgency ? getTransitAgencySystemIds(selectedAgency) : [];

	const activityRepository = getActivityRepository();
	const [rawAgencyOptions, userOptions, events] = await Promise.all([
		listSystemInfoOptions(),
		activityRepository.listUsers({
			agency: selectedAgency,
			systemIds: selectedAgencySystemIds
		}),
		activityRepository.list({
			agency: selectedAgency,
			systemIds: selectedAgencySystemIds,
			userEmail: selectedUserEmail,
			limit: 100
		})
	]);

	const agencyOptions = rawAgencyOptions
		.map((option) => ({
			...option,
			name: canonicalizeTransitAgencyDisplayName(option.name)
		}))
		.filter(
			(option, index, options) =>
				options.findIndex((candidate) => candidate.name === option.name) === index
		)
		.sort((left, right) => left.name.localeCompare(right.name));

	return {
		selectedAgency,
		selectedUserEmail,
		selectedAgencySystemIds,
		isSuperAdmin: userScope.isSuperAdmin,
		agencyOptions,
		userOptions,
		events
	};
};
