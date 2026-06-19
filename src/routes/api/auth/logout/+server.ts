import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { APP_SESSION_COOKIE_NAME } from '$lib/server/auth/session';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete(APP_SESSION_COOKIE_NAME, { path: '/' });
	return json({ ok: true, redirectTo: '/' });
};
