import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createAuthorizedUser,
	isSuperAdminEmail,
	listAuthorizedUsers,
	setUserActive
} from '$lib/server/opstats/usersRepository';

export const load: PageServerLoad = async ({ locals }) => {
	const email = locals.user?.email;
	if (!email) {
		return {
			users: [],
			errorMessage: 'No signed-in user email was available.'
		};
	}

	try {
		const [users, canCreateUsers] = await Promise.all([
			listAuthorizedUsers(email),
			isSuperAdminEmail(email)
		]);
		return {
			users,
			canCreateUsers,
			errorMessage: null
		};
	} catch (err) {
		console.error('[dashboard/users] failed to load authorized users', err);
		return {
			users: [],
			canCreateUsers: false,
			errorMessage: 'Failed to load authorized user data from RDS.'
		};
	}
};

export const actions: Actions = {
	setActive: async ({ request, locals }) => {
		const actorEmail = locals.user?.email;
		if (!actorEmail) {
			return fail(401, { message: 'You must be signed in to update user status.' });
		}

		const formData = await request.formData();
		const targetUserId = Number(formData.get('userId'));
		const active = formData.get('active') === '1';

		if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
			return fail(400, { message: 'Invalid user id.' });
		}

		try {
			await setUserActive({ actorEmail, targetUserId, active });
			return { success: true };
		} catch (err) {
			console.error('[dashboard/users] failed to update auth_user.is_active', err);
			return fail(403, {
				message: err instanceof Error ? err.message : 'You do not have permission to update this user.'
			});
		}
	},
	createUser: async ({ request, locals }) => {
		const actorEmail = locals.user?.email;
		if (!actorEmail) {
			return fail(401, { message: 'You must be signed in to create users.' });
		}

		const formData = await request.formData();

		try {
			await createAuthorizedUser({
				actorEmail,
				firstName: formData.get('firstName'),
				lastName: formData.get('lastName'),
				email: formData.get('email'),
				role: formData.get('role'),
				active: formData.get('active') === '1'
			});
			return { success: true };
		} catch (err) {
			console.error('[dashboard/users] failed to create user', err);
			return fail(400, {
				message: err instanceof Error ? err.message : 'Failed to create user.'
			});
		}
	}
};
