import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { normalizeEmailAddress, sendOtpToAuthorizedUser } from '$lib/server/auth/otp';

function testEndpointEnabled(): boolean {
	return process.env.OTP_TEST_SEND_ENABLED === 'true';
}

function allowedTestEmails(): Set<string> {
	return new Set(
		(process.env.OTP_TEST_ALLOWED_EMAILS ?? '')
			.split(',')
			.map((email) => email.trim().toLowerCase())
			.filter(Boolean)
	);
}

function authorizeTestRequest(request: Request): Response | null {
	const configuredSecret = process.env.OTP_TEST_SEND_SECRET;
	if (!dev && !configuredSecret) {
		return json(
			{ error: 'OTP test endpoint requires OTP_TEST_SEND_SECRET outside development.' },
			{ status: 500 }
		);
	}

	if (configuredSecret && request.headers.get('x-otp-test-secret') !== configuredSecret) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	return null;
}

export const POST: RequestHandler = async ({ request }) => {
	if (!testEndpointEnabled()) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	const authError = authorizeTestRequest(request);
	if (authError) return authError;

	const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
	let email: string;
	try {
		email = normalizeEmailAddress(body?.email);
	} catch {
		return json({ error: 'A valid email is required.' }, { status: 400 });
	}

	if (!allowedTestEmails().has(email)) {
		return json({ error: 'Email is not enabled for OTP test delivery.' }, { status: 403 });
	}

	try {
		await sendOtpToAuthorizedUser(email);
		return json(
			{
				ok: true,
				message: 'If this address is active and authorized, an OTP email has been sent.'
			},
			{ status: 202 }
		);
	} catch (error) {
		console.error('[otp-test] failed to send OTP email', error);
		return json({ error: 'Failed to send OTP email.' }, { status: 500 });
	}
};
