import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';

export const REPORT_SIGNATURE_ROLES = [
	'AUTHORIZED_OFFICIAL',
	'FINANCIAL_MANAGER',
	'TAB_CHAIRPERSON'
] as const;

export type ReportSignatureRole = (typeof REPORT_SIGNATURE_ROLES)[number];

export const REPORT_SIGNATURE_METHODS = ['HANDWRITTEN_CANVAS'] as const;

export type ReportSignatureMethod = (typeof REPORT_SIGNATURE_METHODS)[number];

export type ReportCertificationKey = {
	agency: string;
	type: FormType;
	year: number;
};

export type ReportCertificationContext = ReportCertificationKey & {
	reportKey: string;
	organizationId: number;
};

export type ReportSignatureStrokeData = unknown[];

export type ReportSignatureRecord = ReportCertificationContext & {
	id: number;
	role: ReportSignatureRole;
	signerUserId: number;
	signerName: string;
	signerEmail: string;
	signatureMethod: ReportSignatureMethod;
	signatureImage: string;
	signatureStrokeData: ReportSignatureStrokeData;
	documentHash: string;
	recordIntegrityHash: string;
	consentText: string;
	supportingText: string;
	signedAt: string;
	signerLocale: string | null;
	signerTimeZone: string | null;
	signerUtcOffsetMinutes: number | null;
	ipAddress: string | null;
	userAgent: string | null;
	acceptLanguage: string | null;
	createdAt: string;
	revokedAt: string | null;
	revokedByUserId: number | null;
	revocationReason: string | null;
	invalidatedAt: string | null;
	invalidationReason: string | null;
};

export type PublicReportSignatureRecord = ReportCertificationContext & {
	id: number;
	role: ReportSignatureRole;
	signerName: string;
	signerEmail: string;
	signatureImage: string;
	signedAt: string;
	signerLocale: string | null;
	signerTimeZone: string | null;
	signerUtcOffsetMinutes: number | null;
	status: 'active' | 'revoked' | 'invalidated';
	revokedAt: string | null;
	invalidatedAt: string | null;
};

export type ReportSignatureSessionUser = {
	userId: number;
	email: string;
	displayName: string;
};

export type ReportSignatureRequestBody = {
	role?: unknown;
	signatureImage?: unknown;
	signatureStrokeData?: unknown;
	signatureMethod?: unknown;
	consentText?: unknown;
	supportingText?: unknown;
	signerLocale?: unknown;
	signerTimeZone?: unknown;
	signerUtcOffsetMinutes?: unknown;
};
