import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyOtpForEmail } from '$lib/server/auth/otp';
import { setAppSessionCookie } from '$lib/server/auth/session';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = (await request.json().catch(() => null)) as {
		email?: unknown;
		code?: unknown;
	} | null;

	try {
		const result = await verifyOtpForEmail({
			email: body?.email,
			code: body?.code
		});

		if (!result.ok) {
			return json({ error: 'Invalid or expired verification code.' }, { status: 400 });
		}

		setAppSessionCookie(cookies, {
			userId: result.userId,
			email: result.email
		});

		return json({ ok: true, redirectTo: '/dashboard' });
	} catch (error) {
		console.error('[auth] failed to verify OTP', error);
		return json({ error: 'An unexpected error occurred.' }, { status: 500 });
	}
};
