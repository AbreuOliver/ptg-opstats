import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// locals.session should already be populated by your `hooks.server.ts`
	if (!locals.session) {
		throw redirect(303, '/auth');
	}

	return {
		session: locals.session
	};
};
