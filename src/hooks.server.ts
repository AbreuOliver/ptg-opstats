import { createServerClient } from '@supabase/ssr';
import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';


export const handle: Handle = async ({ event, resolve }) => {
	const cookieWrapper = {
		getAll: () => event.cookies.getAll().map(({ name, value }) => ({ name, value })),

		setAll: (
			cookies: { name: string; value: string; options?: Parameters<typeof event.cookies.set>[2] }[]
		) => {
			for (const cookie of cookies) {
				event.cookies.set(cookie.name, cookie.value, cookie.options);
			}
		}
	};

	const supabase = createServerClient(
		import.meta.env.PUBLIC_SUPABASE_URL,
		import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: cookieWrapper,
			cookieEncoding: 'base64' as any,
			cookieOptions: {
				path: '/',
				sameSite: 'lax',
				secure: !dev,
				domain: dev ? undefined : 'yourdomain.com'
			}
		}
	);

	event.locals.supabase = supabase;

	// **Call supabase.auth.getUser() to validate the user**
	const { data: { user }, error } = await supabase.auth.getUser();

	if (error) {
		// Optionally log or handle error, but usually just continue with no user
		event.locals.user = null;
	} else {
		event.locals.user = user;
	}

	return resolve(event);
};
