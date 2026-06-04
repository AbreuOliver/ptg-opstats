import { json } from '@sveltejs/kit';
import { authorizedUserEmailExists, isSuperAdminEmail } from '$lib/server/opstats/usersRepository';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const actorEmail = locals.user?.email;
	if (!actorEmail || !(await isSuperAdminEmail(actorEmail))) {
		return json({ available: false, message: 'Not authorized.' }, { status: 403 });
	}

	const email = url.searchParams.get('email')?.trim() ?? '';
	if (!email) {
		return json({ available: false, message: 'Email is required.' }, { status: 400 });
	}

	try {
		const exists = await authorizedUserEmailExists(email);
		return json({ available: !exists });
	} catch (error) {
		return json(
			{
				available: false,
				message: error instanceof Error ? error.message : 'Unable to check this email address.'
			},
			{ status: 400 }
		);
	}
};
