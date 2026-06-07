import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import crypto from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';

export const APP_SESSION_COOKIE_NAME = 'ncopstats_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AppSessionPayload = {
	v: 1;
	userId: number;
	email: string;
	iat: number;
	exp: number;
};

function getSessionSecret(): string {
	const secret = env.APP_SESSION_SECRET;
	if (!secret) {
		throw new Error('APP_SESSION_SECRET is required for custom auth sessions.');
	}
	return secret;
}

function base64UrlEncode(value: string): string {
	return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
	return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string): string {
	return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function timingSafeEqual(a: string, b: string): boolean {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function createSignedSessionToken(args: { userId: number; email: string }): string {
	const now = Math.floor(Date.now() / 1000);
	const payload: AppSessionPayload = {
		v: 1,
		userId: args.userId,
		email: args.email,
		iat: now,
		exp: now + SESSION_MAX_AGE_SECONDS
	};
	const encodedPayload = base64UrlEncode(JSON.stringify(payload));
	return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySignedSessionToken(token: string | undefined): AppSessionPayload | null {
	if (!token) return null;
	const [encodedPayload, signature] = token.split('.');
	if (!encodedPayload || !signature) return null;
	if (!timingSafeEqual(sign(encodedPayload), signature)) return null;

	try {
		const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AppSessionPayload;
		if (payload.v !== 1) return null;
		if (!Number.isInteger(payload.userId) || payload.userId <= 0) return null;
		if (typeof payload.email !== 'string' || !payload.email) return null;
		if (!Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
		return payload;
	} catch {
		return null;
	}
}

export function setAppSessionCookie(
	cookies: Cookies,
	args: { userId: number; email: string }
): void {
	cookies.set(APP_SESSION_COOKIE_NAME, createSignedSessionToken(args), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: SESSION_MAX_AGE_SECONDS
	});
}
