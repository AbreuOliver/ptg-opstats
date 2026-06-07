import { env } from '$env/dynamic/private';
import crypto from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getFormsReportPool } from '$lib/server/formsReport/db';
import { sendOtpEmail } from '$lib/server/email/sendOtpEmail';

const OTP_EXPIRES_IN_MINUTES = 10;
const MAX_ATTEMPTS = 5;

type AuthUserRow = RowDataPacket & {
	id: number;
	email: string;
	is_active: number | boolean;
};

type OtpRow = RowDataPacket & {
	id: number;
	user_id: number;
	code_hash: string;
	attempts: number;
};

export type IssueOtpResult =
	| {
			issued: true;
			email: string;
			userId: number;
			code: string;
			expiresInMinutes: number;
	  }
	| {
			issued: false;
			email: string;
	  };

export type VerifyOtpResult =
	| { ok: true; userId: number; email: string }
	| { ok: false; reason: 'invalid_user' | 'invalid_code' | 'too_many_attempts' };

export function normalizeEmailAddress(value: unknown): string {
	if (typeof value !== 'string') throw new Error('Email is required.');
	const email = value.trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
	return email;
}

function getOtpHashSecret(): string {
	const secret = env.OTP_HASH_SECRET ?? env.APP_SESSION_SECRET;
	if (!secret) {
		throw new Error('OTP hashing secret is missing. Set OTP_HASH_SECRET or APP_SESSION_SECRET.');
	}
	return secret;
}

function generateOtpCode(): string {
	return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function normalizeOtpCode(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const code = value.replace(/\D/g, '');
	return /^\d{6}$/.test(code) ? code : null;
}

function hashOtpCode(args: { userId: number; email: string; code: string }): string {
	return crypto
		.createHmac('sha256', getOtpHashSecret())
		.update(`${args.userId}:${args.email}:${args.code}`)
		.digest('hex');
}

function constantTimeEqualHex(a: string, b: string): boolean {
	const left = Buffer.from(a, 'hex');
	const right = Buffer.from(b, 'hex');
	return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function getActiveAuthUserByEmail(email: string): Promise<AuthUserRow | null> {
	const pool = getFormsReportPool();
	const [rows] = await pool.query<AuthUserRow[]>(
		`SELECT id, email, is_active
		   FROM auth_user
		  WHERE LOWER(email) = LOWER(?)
		    AND is_active = 1
		  LIMIT 1`,
		[email]
	);
	return rows[0] ?? null;
}

export async function cleanupOldOtpCodes(): Promise<void> {
	const pool = getFormsReportPool();
	await pool.query(`DELETE FROM auth_otp_code WHERE created_at < NOW(6) - INTERVAL 7 DAY`);
}

export async function issueOtpForEmail(emailInput: unknown): Promise<IssueOtpResult> {
	const email = normalizeEmailAddress(emailInput);
	await cleanupOldOtpCodes();

	const user = await getActiveAuthUserByEmail(email);
	if (!user) return { issued: false, email };

	const code = generateOtpCode();
	const codeHash = hashOtpCode({ userId: Number(user.id), email, code });
	const pool = getFormsReportPool();

	await pool.query<ResultSetHeader>(
		`INSERT INTO auth_otp_code (user_id, code_hash, expires_at)
		 VALUES (?, ?, DATE_ADD(NOW(6), INTERVAL ? MINUTE))`,
		[Number(user.id), codeHash, OTP_EXPIRES_IN_MINUTES]
	);

	return {
		issued: true,
		email,
		userId: Number(user.id),
		code,
		expiresInMinutes: OTP_EXPIRES_IN_MINUTES
	};
}

export async function sendOtpToAuthorizedUser(
	emailInput: unknown
): Promise<{ email: string; sent: boolean }> {
	const issued = await issueOtpForEmail(emailInput);
	if (!issued.issued) return { email: issued.email, sent: false };

	await sendOtpEmail({
		to: issued.email,
		code: issued.code,
		expiresInMinutes: issued.expiresInMinutes
	});

	return { email: issued.email, sent: true };
}

export async function verifyOtpForEmail(args: {
	email: unknown;
	code: unknown;
}): Promise<VerifyOtpResult> {
	const email = normalizeEmailAddress(args.email);
	const code = normalizeOtpCode(args.code);
	if (!code) {
		return { ok: false, reason: 'invalid_code' };
	}

	const user = await getActiveAuthUserByEmail(email);
	if (!user) return { ok: false, reason: 'invalid_user' };

	const pool = getFormsReportPool();
	const [rows] = await pool.query<OtpRow[]>(
		`SELECT id, user_id, code_hash, attempts
		   FROM auth_otp_code
		  WHERE user_id = ?
		    AND used_at IS NULL
		    AND expires_at > NOW(6)
		  ORDER BY created_at DESC
		  LIMIT 1`,
		[Number(user.id)]
	);
	const otp = rows[0];
	if (!otp) return { ok: false, reason: 'invalid_code' };
	if (Number(otp.attempts) >= MAX_ATTEMPTS) return { ok: false, reason: 'too_many_attempts' };

	const submittedHash = hashOtpCode({
		userId: Number(user.id),
		email,
		code
	});

	if (!constantTimeEqualHex(submittedHash, otp.code_hash)) {
		await pool.query(`UPDATE auth_otp_code SET attempts = attempts + 1 WHERE id = ?`, [
			Number(otp.id)
		]);
		return Number(otp.attempts) + 1 >= MAX_ATTEMPTS
			? { ok: false, reason: 'too_many_attempts' }
			: { ok: false, reason: 'invalid_code' };
	}

	await pool.query(`UPDATE auth_otp_code SET used_at = NOW(6) WHERE id = ? AND used_at IS NULL`, [
		Number(otp.id)
	]);

	return { ok: true, userId: Number(user.id), email };
}
