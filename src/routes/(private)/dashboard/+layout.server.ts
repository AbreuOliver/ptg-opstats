import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
    const session = locals.session;

    console.log('Private layout session:', session);

	// locals.session should already be populated by your `hooks.server.ts`
	if (!locals.session) {
		throw redirect(303, '/auth');
	}
    
    let username: string | null = null;
    if (session?.user?.email) {
		username = session.user.email.split('@')[0];
	}

	return {
		session, username
	};
};
