import crypto from 'node:crypto';
import type {
	PublicReportSignatureRecord,
	ReportCertificationContext,
	ReportSignatureRecord,
	ReportSignatureRole,
	ReportSignatureSessionUser
} from './types';

const DEFAULT_HMAC_SECRET_FALLBACK = 'APP_SESSION_SECRET';

export function buildReportKey(
	context:
		| ReportCertificationContext
		| {
				agency: string;
				type: ReportCertificationContext['type'];
				year: number;
		  }
): string {
	return `${context.agency}:${context.type}:${context.year}`;
}

export function formatReportSignatureDisplayName(user: {
	firstName?: string | null;
	lastName?: string | null;
	username?: string | null;
	email: string;
}): string {
	const firstName = user.firstName?.trim();
	const lastName = user.lastName?.trim();
	const username = user.username?.trim();
	if (firstName || lastName) return [firstName, lastName].filter(Boolean).join(' ').trim();
	if (username) return username;
	return user.email.split('@')[0] ?? user.email;
}

export function buildReportSignatureSessionUser(user: {
	authUserId: number;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	username?: string | null;
}): ReportSignatureSessionUser {
	return {
		userId: user.authUserId,
		email: user.email,
		displayName: formatReportSignatureDisplayName({
			firstName: user.firstName ?? null,
			lastName: user.lastName ?? null,
			username: user.username ?? null,
			email: user.email
		})
	};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sortValue(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortValue);
	if (!isPlainObject(value)) return value;
	return Object.keys(value)
		.sort()
		.reduce<Record<string, unknown>>((result, key) => {
			result[key] = sortValue(value[key]);
			return result;
		}, {});
}

export function stableStringify(value: unknown): string {
	return JSON.stringify(sortValue(value));
}

export function buildCanonicalReportSnapshot(snapshot: unknown): unknown {
	return snapshot;
}

export function calculateReportDocumentHash(report: unknown): string {
	return crypto
		.createHash('sha256')
		.update(stableStringify(buildCanonicalReportSnapshot(report)))
		.digest('hex');
}

function resolveHmacSecret(): string {
	return (
		process.env.REPORT_SIGNATURE_HMAC_SECRET ??
		process.env.APP_SESSION_SECRET ??
		DEFAULT_HMAC_SECRET_FALLBACK
	);
}

export function calculateSignatureIntegrityHmac(input: Record<string, unknown>): string {
	return crypto
		.createHmac('sha256', resolveHmacSecret())
		.update(stableStringify(input))
		.digest('hex');
}

export function parseReportSignatureRole(value: unknown): ReportSignatureRole | null {
	if (typeof value !== 'string') return null;
	const normalized = value.trim().toUpperCase();
	if (normalized === 'AUTHORIZED_OFFICIAL') return 'AUTHORIZED_OFFICIAL';
	if (normalized === 'FINANCIAL_MANAGER') return 'FINANCIAL_MANAGER';
	if (normalized === 'TAB_CHAIRPERSON') return 'TAB_CHAIRPERSON';
	return null;
}

export function deriveReportSignatureStatus(record: {
	revokedAt: string | null;
	invalidatedAt: string | null;
}): PublicReportSignatureRecord['status'] {
	if (record.invalidatedAt) return 'invalidated';
	if (record.revokedAt) return 'revoked';
	return 'active';
}

export function isReportSignatureActive(record: {
	revokedAt: string | null;
	invalidatedAt: string | null;
}): boolean {
	return !record.revokedAt && !record.invalidatedAt;
}

export function mapSignatureRecordToPublic(
	record: ReportSignatureRecord
): PublicReportSignatureRecord {
	return {
		reportKey: record.reportKey,
		agency: record.agency,
		type: record.type,
		year: record.year,
		organizationId: record.organizationId,
		id: record.id,
		role: record.role,
		signerName: record.signerName,
		signerEmail: record.signerEmail,
		signatureImage: record.signatureImage,
		signedAt: record.signedAt,
		signerLocale: record.signerLocale,
		signerTimeZone: record.signerTimeZone,
		signerUtcOffsetMinutes: record.signerUtcOffsetMinutes,
		status: deriveReportSignatureStatus(record),
		revokedAt: record.revokedAt,
		invalidatedAt: record.invalidatedAt
	};
}
