import { createServerClient } from '@supabase/ssr';
import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { resolveUserScope } from '$lib/server/rbac';
import { APP_SESSION_COOKIE_NAME, verifySignedSessionToken } from '$lib/server/auth/session';
import { getActiveAuthUserBySession } from '$lib/server/auth/user';

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
	event.locals.session = null;

	let user = null;
	const sessionToken = event.cookies.get(APP_SESSION_COOKIE_NAME);
	if (sessionToken) {
		const session = verifySignedSessionToken(sessionToken);
		if (session) {
			user = await getActiveAuthUserBySession({
				userId: session.userId,
				email: session.email
			});
		}
		if (!user) {
			event.cookies.delete(APP_SESSION_COOKIE_NAME, { path: '/' });
		}
	}

	event.locals.user = user;
	event.locals.userScope = await resolveUserScope(user);

	return resolve(event);
};
