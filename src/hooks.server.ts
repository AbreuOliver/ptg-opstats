import type { Handle } from '@sveltejs/kit';
import { resolveUserScope } from '$lib/server/rbac';
import { APP_SESSION_COOKIE_NAME, verifySignedSessionToken } from '$lib/server/auth/session';
import { getActiveAuthUserBySession } from '$lib/server/auth/user';

export const handle: Handle = async ({ event, resolve }) => {
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
