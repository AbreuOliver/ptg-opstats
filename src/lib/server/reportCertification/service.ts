import { error } from '@sveltejs/kit';
import { canAccessAgency, resolveUserScope } from '$lib/server/rbac';
import type { AuthenticatedAppUser } from '$lib/server/auth/user';
import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';
import {
	getOpStatsRepository,
	type AnnualStatisticsDraft,
	type FinancialOutcomeDraft,
	type MonthlyRow,
	type OverviewRow,
	type RuralFinancialDraft
} from '$lib/server/opstats/repository';
import {
	calculateReportDocumentHash,
	calculateSignatureIntegrityHmac,
	mapSignatureRecordToPublic,
	parseReportSignatureRole
} from './utils';
import { getReportSignatureStorage } from './repository';
import type {
	PublicReportSignatureRecord,
	ReportCertificationContext,
	ReportSignatureRequestBody,
	ReportSignatureRole,
	ReportSignatureSessionUser,
	ReportSignatureStrokeData
} from './types';

const CERTIFICATION_TEXT =
	'I hereby certify that, to the best of my knowledge, the information in this report is accurate and complete.';
const SUPPORTING_TEXT =
	'By applying your signature, you certify that the report information is accurate and complete and acknowledge that your account, timestamp, and request information will be recorded.';
const SIGNATURE_METHOD = 'HANDWRITTEN_CANVAS' as const;
const INVALIDATION_REASON = 'Report content changed after certification.';
const REVOCATION_REASON = 'Signature removed by authenticated user.';
const REPLACEMENT_REASON = 'Signature replaced by authenticated user.';

export function getCertificationStatements(): {
	certificationText: string;
	supportingText: string;
} {
	return {
		certificationText: CERTIFICATION_TEXT,
		supportingText: SUPPORTING_TEXT
	};
}

export function getReportCertificationContext(input: {
	agency: string;
	type: FormType;
	year: number;
	organizationId: number;
}): ReportCertificationContext {
	return {
		agency: input.agency,
		type: input.type,
		year: input.year,
		reportKey: `${input.agency}:${input.type}:${input.year}`,
		organizationId: input.organizationId
	};
}

export function getReportDocumentHash(report: unknown): string {
	return calculateReportDocumentHash(report);
}

type ReportDocumentSnapshot = {
	agency: string;
	type: FormType;
	year: number;
	organizationId: number;
	reportKey: string;
	overview: OverviewRow | null;
	monthlyRows: MonthlyRow[];
	ruralFinancialDraft: RuralFinancialDraft | null;
	annualStatisticsDraft: AnnualStatisticsDraft | null;
	ruralCompletionDraft: FinancialOutcomeDraft | null;
	urbanFinancialDraft: Record<string, unknown> | null;
	urbanFinancialOutcomeDraft: FinancialOutcomeDraft | null;
};

function sortMonthlyRows(rows: MonthlyRow[]): MonthlyRow[] {
	return [...rows].sort((left, right) => {
		if (left.month !== right.month) return left.month - right.month;
		const leftDayType = left.dayType ?? '';
		const rightDayType = right.dayType ?? '';
		if (leftDayType !== rightDayType) return leftDayType.localeCompare(rightDayType);
		return left.serviceType.localeCompare(right.serviceType);
	});
}

async function resolveCertificationContext(input: {
	agency: string;
	type: FormType;
	year: number;
}): Promise<ReportCertificationContext> {
	const organizationId = await getOpStatsRepository().resolveWritableSystemIdByAgencyName(
		input.agency,
		input.type
	);
	if (!organizationId) {
		throw error(404, 'No writable report mapping exists for this agency.');
	}
	return getReportCertificationContext({
		agency: input.agency,
		type: input.type,
		year: input.year,
		organizationId
	});
}

async function loadReportDocumentSnapshot(input: {
	agency: string;
	type: FormType;
	year: number;
}): Promise<{ context: ReportCertificationContext; snapshot: ReportDocumentSnapshot }> {
	const context = await resolveCertificationContext(input);
	const repo = getOpStatsRepository();
	const [overview, monthlyRows] = await Promise.all([
		repo.getOverviewRow({ systemId: context.organizationId, year: context.year }),
		repo.getYearMonthlyRows({ systemId: context.organizationId, year: context.year })
	]);

	if (context.type === 'urban') {
		const [urbanFinancialDraft, urbanFinancialOutcomeDraft] = await Promise.all([
			repo.getUrbanFinancialDraft({ systemId: context.organizationId, year: context.year }),
			repo.getUrbanFinancialOutcomeDraft({ systemId: context.organizationId, year: context.year })
		]);
		return {
			context,
			snapshot: {
				agency: context.agency,
				type: context.type,
				year: context.year,
				organizationId: context.organizationId,
				reportKey: context.reportKey,
				overview,
				monthlyRows: sortMonthlyRows(monthlyRows),
				ruralFinancialDraft: null,
				annualStatisticsDraft: null,
				ruralCompletionDraft: null,
				urbanFinancialDraft,
				urbanFinancialOutcomeDraft
			}
		};
	}

	const [ruralFinancialDraft, annualStatisticsDraft, ruralCompletionDraft] = await Promise.all([
		repo.getRuralFinancialDraft({ systemId: context.organizationId, year: context.year }),
		repo.getAnnualStatisticsDraft({ systemId: context.organizationId, year: context.year }),
		repo.getRuralCompletionDraft({ systemId: context.organizationId, year: context.year })
	]);
	return {
		context,
		snapshot: {
			agency: context.agency,
			type: context.type,
			year: context.year,
			organizationId: context.organizationId,
			reportKey: context.reportKey,
			overview,
			monthlyRows: sortMonthlyRows(monthlyRows),
			ruralFinancialDraft,
			annualStatisticsDraft,
			ruralCompletionDraft,
			urbanFinancialDraft: null,
			urbanFinancialOutcomeDraft: null
		}
	};
}

function normalizeSignatureStrokeData(value: unknown): ReportSignatureStrokeData {
	if (!Array.isArray(value)) {
		throw error(400, 'Signature stroke data must be an array.');
	}
	return value as ReportSignatureStrokeData;
}

function normalizeSignatureImage(value: unknown): string {
	if (typeof value !== 'string' || !value.startsWith('data:image/')) {
		throw error(400, 'Signature image must be a data URL.');
	}
	if (value.length > 600_000) {
		throw error(400, 'Signature image is too large.');
	}
	return value;
}

function normalizeSignatureText(value: unknown, label: string): string {
	if (typeof value !== 'string') {
		throw error(400, `${label} is required.`);
	}
	const trimmed = value.trim();
	if (!trimmed) {
		throw error(400, `${label} is required.`);
	}
	return trimmed;
}

function requestAuditContext(request: Request): {
	ipAddress: string | null;
	userAgent: string | null;
	acceptLanguage: string | null;
} {
	const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
	const ipAddress =
		forwardedFor ||
		request.headers.get('x-real-ip')?.trim() ||
		request.headers.get('cf-connecting-ip')?.trim() ||
		null;

	return {
		ipAddress,
		userAgent: request.headers.get('user-agent'),
		acceptLanguage: request.headers.get('accept-language')
	};
}

function normalizeTimezoneOffset(value: unknown): number | null {
	if (value == null) return null;
	if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
		throw error(400, 'Signature UTC offset must be an integer number of minutes.');
	}
	if (value < -840 || value > 840) {
		throw error(400, 'Signature UTC offset is out of range.');
	}
	return value;
}

function buildAuditPayload(input: {
	context: ReportCertificationContext;
	role: ReportSignatureRole;
	signerUser: ReportSignatureSessionUser;
	signatureImage: string;
	signatureStrokeData: ReportSignatureStrokeData;
	documentHash: string;
	consentText: string;
	supportingText: string;
	signedAt: string;
	signerLocale: string | null;
	signerTimeZone: string | null;
	signerUtcOffsetMinutes: number | null;
	ipAddress: string | null;
	userAgent: string | null;
	acceptLanguage: string | null;
}): Record<string, unknown> {
	return {
		reportKey: input.context.reportKey,
		agency: input.context.agency,
		type: input.context.type,
		year: input.context.year,
		organizationId: input.context.organizationId,
		role: input.role,
		signerUserId: input.signerUser.userId,
		signerEmail: input.signerUser.email,
		signerName: input.signerUser.displayName,
		signatureMethod: SIGNATURE_METHOD,
		signatureImage: input.signatureImage,
		signatureStrokeData: input.signatureStrokeData,
		documentHash: input.documentHash,
		consentText: input.consentText,
		supportingText: input.supportingText,
		signedAt: input.signedAt,
		signerLocale: input.signerLocale,
		signerTimeZone: input.signerTimeZone,
		signerUtcOffsetMinutes: input.signerUtcOffsetMinutes,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		acceptLanguage: input.acceptLanguage
	};
}

async function ensureSignatureAccess(args: {
	user: AuthenticatedAppUser;
	agency: string;
}): Promise<void> {
	const scope = await resolveUserScope(args.user);
	if (!canAccessAgency(scope, args.agency)) {
		throw error(403, 'You are not authorized to sign this report.');
	}
}

function validatePayload(body: ReportSignatureRequestBody): {
	role: ReportSignatureRole;
	signatureImage: string;
	signatureStrokeData: ReportSignatureStrokeData;
	signatureMethod: typeof SIGNATURE_METHOD;
	consentText: string;
	supportingText: string;
	signerLocale: string | null;
	signerTimeZone: string | null;
	signerUtcOffsetMinutes: number | null;
} {
	const role = parseReportSignatureRole(body.role);
	if (!role) throw error(400, 'A valid signature role is required.');
	return {
		role,
		signatureImage: normalizeSignatureImage(body.signatureImage),
		signatureStrokeData: normalizeSignatureStrokeData(body.signatureStrokeData),
		signatureMethod:
			body.signatureMethod === undefined || body.signatureMethod === SIGNATURE_METHOD
				? SIGNATURE_METHOD
				: (() => {
						throw error(400, 'Unsupported signature method.');
				})(),
		consentText: normalizeSignatureText(body.consentText, 'Consent text'),
		supportingText: normalizeSignatureText(body.supportingText, 'Supporting text'),
		signerLocale:
			typeof body.signerLocale === 'string' && body.signerLocale.trim()
				? body.signerLocale.trim().slice(0, 100)
				: null,
		signerTimeZone:
			typeof body.signerTimeZone === 'string' && body.signerTimeZone.trim()
				? body.signerTimeZone.trim().slice(0, 64)
				: null,
		signerUtcOffsetMinutes: normalizeTimezoneOffset(body.signerUtcOffsetMinutes)
	};
}

export async function listReportSignatures(input: {
	agency: string;
	type: FormType;
	year: number;
	user: AuthenticatedAppUser | null;
}): Promise<PublicReportSignatureRecord[]> {
	if (!input.user) throw error(401, 'Unauthorized');
	await ensureSignatureAccess({ user: input.user, agency: input.agency });
	const context = await resolveCertificationContext(input);
	const signatures = await getReportSignatureStorage().listByReport(context);
	return signatures.map(mapSignatureRecordToPublic);
}

export async function loadReportCertificationState(input: {
	agency: string;
	type: FormType;
	year: number;
	user: AuthenticatedAppUser | null;
}): Promise<{
	reportHash: string | null;
	signatures: PublicReportSignatureRecord[];
}> {
	if (!input.user) throw error(401, 'Unauthorized');
	await ensureSignatureAccess({ user: input.user, agency: input.agency });
	const { context, snapshot } = await loadReportDocumentSnapshot(input);
	const signatures = await getReportSignatureStorage().listByReport(context);
	return {
		reportHash: calculateReportDocumentHash(snapshot),
		signatures: signatures.map(mapSignatureRecordToPublic)
	};
}

async function resolveSignerUser(user: AuthenticatedAppUser): Promise<ReportSignatureSessionUser> {
	return {
		userId: user.authUserId,
		email: user.email,
		displayName:
			[user.firstName?.trim(), user.lastName?.trim()].filter(Boolean).join(' ').trim() ||
			user.username?.trim() ||
			user.email.split('@')[0] ||
			user.email
	};
}

async function saveSignature(input: {
	agency: string;
	type: FormType;
	year: number;
	user: AuthenticatedAppUser;
	body: ReportSignatureRequestBody;
	request: Request;
	mode: 'create' | 'replace';
}): Promise<PublicReportSignatureRecord> {
	await ensureSignatureAccess({ user: input.user, agency: input.agency });
	const { context, snapshot } = await loadReportDocumentSnapshot(input);
	const payload = validatePayload(input.body);
	const signerUser = await resolveSignerUser(input.user);
	const audit = requestAuditContext(input.request);
	const signedAt = new Date().toISOString();
	const documentHash = calculateReportDocumentHash(snapshot);
	const recordIntegrityHash = calculateSignatureIntegrityHmac(
		buildAuditPayload({
			context,
			role: payload.role,
			signerUser,
			signatureImage: payload.signatureImage,
			signatureStrokeData: payload.signatureStrokeData,
			documentHash,
			consentText: payload.consentText,
			supportingText: payload.supportingText,
			signedAt,
			...audit,
			signerLocale: payload.signerLocale,
			signerTimeZone: payload.signerTimeZone,
			signerUtcOffsetMinutes: payload.signerUtcOffsetMinutes
		})
	);
	const storage = getReportSignatureStorage();

	await storage.invalidateMatchingActiveSignatures({
		context,
		documentHash,
		invalidatedByUserId: input.user.authUserId,
		invalidatedAt: signedAt,
		invalidationReason: INVALIDATION_REASON
	});

	const active = await storage.getActiveByRole(context, payload.role);
	if (input.mode === 'create' && active) {
		throw error(409, 'An active signature already exists for this role.');
	}

	const record =
		input.mode === 'replace'
			? await storage.replace({
					context,
					role: payload.role,
					signerUserId: signerUser.userId,
					signerName: signerUser.displayName,
					signerEmail: signerUser.email,
					signatureMethod: payload.signatureMethod,
					signatureImage: payload.signatureImage,
					signatureStrokeData: payload.signatureStrokeData,
					documentHash,
					recordIntegrityHash,
					consentText: payload.consentText,
					supportingText: payload.supportingText,
					signedAt,
					signerLocale: payload.signerLocale,
					signerTimeZone: payload.signerTimeZone,
					signerUtcOffsetMinutes: payload.signerUtcOffsetMinutes,
					ipAddress: audit.ipAddress,
					userAgent: audit.userAgent,
					acceptLanguage: audit.acceptLanguage,
					revocationReason: REPLACEMENT_REASON
				})
			: await storage.create({
					context,
					role: payload.role,
					signerUserId: signerUser.userId,
					signerName: signerUser.displayName,
					signerEmail: signerUser.email,
					signatureMethod: payload.signatureMethod,
					signatureImage: payload.signatureImage,
					signatureStrokeData: payload.signatureStrokeData,
					documentHash,
					recordIntegrityHash,
					consentText: payload.consentText,
					supportingText: payload.supportingText,
					signedAt,
					signerLocale: payload.signerLocale,
					signerTimeZone: payload.signerTimeZone,
					signerUtcOffsetMinutes: payload.signerUtcOffsetMinutes,
					ipAddress: audit.ipAddress,
					userAgent: audit.userAgent,
					acceptLanguage: audit.acceptLanguage
				});

	return mapSignatureRecordToPublic(record);
}

export async function createReportSignature(input: {
	agency: string;
	type: FormType;
	year: number;
	user: AuthenticatedAppUser;
	body: ReportSignatureRequestBody;
	request: Request;
}): Promise<PublicReportSignatureRecord> {
	return saveSignature({ ...input, mode: 'create' });
}

export async function replaceReportSignature(input: {
	agency: string;
	type: FormType;
	year: number;
	user: AuthenticatedAppUser;
	body: ReportSignatureRequestBody;
	request: Request;
}): Promise<PublicReportSignatureRecord> {
	return saveSignature({ ...input, mode: 'replace' });
}

export async function revokeReportSignature(input: {
	agency: string;
	type: FormType;
	year: number;
	role: ReportSignatureRole;
	user: AuthenticatedAppUser;
	request: Request;
	reason?: string;
}): Promise<PublicReportSignatureRecord | null> {
	await ensureSignatureAccess({ user: input.user, agency: input.agency });
	const context = await resolveCertificationContext(input);
	const revokedAt = new Date().toISOString();
	const record = await getReportSignatureStorage().revoke({
		context,
		role: input.role,
		revokedByUserId: input.user.authUserId,
		revokedAt,
		revocationReason: input.reason?.trim() || REVOCATION_REASON
	});
	return record ? mapSignatureRecordToPublic(record) : null;
}

export async function getReportSignatures(input: {
	agency: string;
	type: FormType;
	year: number;
	user: AuthenticatedAppUser | null;
}): Promise<PublicReportSignatureRecord[]> {
	return listReportSignatures(input);
}

export async function invalidateReportSignaturesForReportChange(input: {
	agency: string;
	type: FormType;
	year: number;
	user: AuthenticatedAppUser | null;
}): Promise<PublicReportSignatureRecord[]> {
	if (!input.user) throw error(401, 'Unauthorized');
	await ensureSignatureAccess({ user: input.user, agency: input.agency });
	const { context, snapshot } = await loadReportDocumentSnapshot(input);
	const documentHash = calculateReportDocumentHash(snapshot);
	const invalidated = await getReportSignatureStorage().invalidateMatchingActiveSignatures({
		context,
		documentHash,
		invalidatedByUserId: input.user.authUserId,
		invalidatedAt: new Date().toISOString(),
		invalidationReason: INVALIDATION_REASON
	});
	return invalidated.map(mapSignatureRecordToPublic);
}
