import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { normalizeEmailAddress, sendOtpToAuthorizedUser } from '$lib/server/auth/otp';

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
	let email: string;

	try {
		email = normalizeEmailAddress(body?.email);
	} catch {
		return json({ error: 'Enter a valid email address.' }, { status: 400 });
	}

	try {
		await sendOtpToAuthorizedUser(email);
		return json(
			{
				ok: true,
				message: 'If this email is authorized, a sign-in code has been sent.'
			},
			{ status: 202 }
		);
	} catch (error) {
		console.error('[auth] failed to request OTP', error);
		return json({ error: 'An unexpected error occurred.' }, { status: 500 });
	}
};
