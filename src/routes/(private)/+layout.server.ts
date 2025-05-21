import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = locals.session;
	const supabase = locals.supabase;

	// Check session validity first
	const {
		data: { user },
		error
	} = await supabase.auth.getUser();

	if (error || !user) {
		console.error('Auth error or unauthenticated:', error?.message);
		throw redirect(303, '/auth');
	}

	// Securely extracted user object
	console.log('🪪 Authenticated User (Email):', user.email);


	// locals.session should already be populated by your `hooks.server.ts`
	if (!locals.session) {
		throw redirect(303, '/auth');
	}

	let username: string | null = null;
	if (session?.user?.email) {
		username = session.user.email.split('@')[0];
	}

	return {
		session,
		username
	};
};
