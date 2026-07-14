import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	canCreateUsersEmail,
	createAuthorizedUser,
	deleteAuthorizedUser,
	listAuthorizedUsers,
	listSystemInfoOptions,
	setUserActive
} from '$lib/server/opstats/usersRepository';
import { sendInviteEmail } from '$lib/server/email/sendInviteEmail';
import { normalizeAgencyName } from '$lib/features/forms/persistence/agency';

export const load: PageServerLoad = async ({ locals }) => {
	const email = locals.user?.email;
	const role = locals.userScope.role;
	if (role !== 'super_admin' && role !== 'admin') {
		throw error(403, 'You do not have access to manage authorized users.');
	}

	if (!email) {
		return {
			users: [],
			canCreateUsers: false,
			canViewSuperAdmins: role === 'super_admin',
			currentUserEmail: email ?? null,
			defaultSystemInfoId: null,
			defaultAgencyName: locals.userScope.transitSystem,
			systemOptions: [],
			errorMessage: 'No signed-in user email was available.'
		};
	}

	try {
		const [users, canCreateUsers, systemOptions] = await Promise.all([
			listAuthorizedUsers(email),
			canCreateUsersEmail(email),
			listSystemInfoOptions()
		]);
		const defaultAgency = locals.userScope.transitSystem;
		const defaultSystemOption = defaultAgency
			? systemOptions.find(
					(option) => normalizeAgencyName(option.name) === normalizeAgencyName(defaultAgency)
				)
			: null;
		return {
			users,
			canCreateUsers,
			canViewSuperAdmins: role === 'super_admin',
			currentUserEmail: email,
			defaultSystemInfoId: defaultSystemOption?.id ?? null,
			defaultAgencyName: defaultSystemOption?.name ?? defaultAgency,
			systemOptions,
			errorMessage: null
		};
	} catch (err) {
		console.error('[users] failed to load authorized users', err);
		return {
			users: [],
			canCreateUsers: false,
			canViewSuperAdmins: role === 'super_admin',
			currentUserEmail: email ?? null,
			defaultSystemInfoId: null,
			defaultAgencyName: locals.userScope.transitSystem,
			systemOptions: [],
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
			console.error('[users] failed to update auth_user.is_active', err);
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
				systemInfoId: formData.get('systemInfoId'),
				active: formData.get('active') === '1'
			});
			return { success: true };
		} catch (err) {
			console.error('[users] failed to create user', err);
			return fail(400, {
				message: err instanceof Error ? err.message : 'Failed to create user.'
			});
		}
	},
	sendInvitations: async ({ request, locals }) => {
		const actorEmail = locals.user?.email;
		if (!actorEmail) {
			return fail(401, { message: 'You must be signed in to send invitations.' });
		}

		const formData = await request.formData();
		const selectedUserIds = [
			...new Set(
				formData
					.getAll('userId')
					.map((value) => Number(value))
					.filter((value) => Number.isInteger(value) && value > 0)
			)
		];

		if (selectedUserIds.length === 0) {
			return fail(400, { message: 'Select one or more users to invite.' });
		}

		try {
			const users = await listAuthorizedUsers(actorEmail);
			const usersById = new Map(users.map((user) => [user.id, user]));
			const selectedUsers = selectedUserIds.map((userId) => usersById.get(userId));

			if (selectedUsers.some((user) => !user)) {
				throw new Error('One or more selected users are not available for invitations.');
			}

			const recipients = selectedUsers.filter((user): user is NonNullable<(typeof selectedUsers)[number]> =>
				Boolean(user)
			);

			if (
				recipients.some(
					(user) => user.email.trim().toLowerCase() === actorEmail.trim().toLowerCase()
				)
			) {
				throw new Error('You cannot send an invitation to your own account.');
			}

			await Promise.all(
				recipients.map((user) =>
					sendInviteEmail({
						to: user.email,
						recipientName: user.displayName || user.email
					})
				)
			);

			return {
				success: true,
				message: `Invitation email${recipients.length === 1 ? '' : 's'} sent to ${recipients.length} user${recipients.length === 1 ? '' : 's'}.`
			};
		} catch (err) {
			console.error('[users] failed to send invitation emails', err);
			return fail(400, {
				message: err instanceof Error ? err.message : 'Failed to send invitation emails.'
			});
		}
	},
	deleteUser: async ({ request, locals }) => {
		const actorEmail = locals.user?.email;
		if (!actorEmail) {
			return fail(401, { message: 'You must be signed in to delete users.' });
		}

		const formData = await request.formData();
		const targetUserId = Number(formData.get('userId'));
		if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
			return fail(400, { message: 'Invalid user id.' });
		}

		try {
			await deleteAuthorizedUser({
				actorEmail,
				targetUserId,
				confirmation: formData.get('confirmation')
			});
			return { success: true };
		} catch (err) {
			console.error('[users] failed to delete user', err);
			return fail(403, {
				message: err instanceof Error ? err.message : 'Failed to delete user.'
			});
		}
	}
};
