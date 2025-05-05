import { createServerClient } from '@supabase/ssr';
import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const supabase = createServerClient(
		import.meta.env.PUBLIC_SUPABASE_URL,
		import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: event.cookies,
			cookieOptions: {
				name: 'sb', // optional; 'sb' is the default
				lifetime: 60 * 60 * 24 * 7, // 7 days
				domain: dev ? undefined : 'yourdomain.com', // only in prod
				path: '/',
				sameSite: 'Lax',
				secure: !dev
			}
		}
	);

	event.locals.supabase = supabase;

	const {
		data: { session }
	} = await supabase.auth.getSession();

	event.locals.session = session;

	return resolve(event);
};
