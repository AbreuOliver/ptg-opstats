import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		throw redirect(303, '/auth');
	}

	// Extract username from email if available
	const username = user.email?.split('@')[0] ?? null;

	return {
		user,
		username
	};
};
