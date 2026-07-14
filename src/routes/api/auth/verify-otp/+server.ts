import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyOtpForEmail } from '$lib/server/auth/otp';
import { setAppSessionCookie } from '$lib/server/auth/session';
import { getActivityRepository } from '$lib/server/activity/repository';
import { getActiveAuthUserBySession } from '$lib/server/auth/user';
import { resolveUserScope } from '$lib/server/rbac';
import { getOpStatsRepository } from '$lib/server/opstats/repository';

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

		try {
			const authUser = await getActiveAuthUserBySession({
				userId: result.userId,
				email: result.email
			});
			const userScope = await resolveUserScope(authUser);
			const agencies = userScope.allowedTransitSystems;

			if (agencies.length === 0) {
				await getActivityRepository().log({
					userEmail: result.email,
					action: 'auth.sign_in',
					entityType: 'auth_user',
					entityId: String(result.userId),
					metadata: { method: 'otp' }
				});
			} else {
				const repo = getOpStatsRepository();
				await Promise.all(
					agencies.map(async (agency) => {
						const systemId = await repo.resolveSystemIdByAgencyName(agency);
						await getActivityRepository().log({
							userEmail: result.email,
							systemId,
							agency,
							action: 'auth.sign_in',
							entityType: 'auth_user',
							entityId: String(result.userId),
							metadata: { method: 'otp' }
						});
					})
				);
			}
		} catch (error) {
			console.error('[activity] failed to log sign-in', error);
		}

		return json({ ok: true, redirectTo: '/forms' });
	} catch (error) {
		console.error('[auth] failed to verify OTP', error);
		return json({ error: 'An unexpected error occurred.' }, { status: 500 });
	}
};
