import type { PageServerLoad } from './$types';
import { listAuthUsers } from '$lib/server/opstats/usersRepository';

export const load: PageServerLoad = async () => {
	try {
		const users = await listAuthUsers();
		return {
			users,
			errorMessage: null
		};
	} catch (err) {
		console.error('[dashboards/users] failed to load auth_user rows', err);
		return {
			users: [],
			errorMessage: 'Failed to load auth_user data from RDS.'
		};
	}
};
