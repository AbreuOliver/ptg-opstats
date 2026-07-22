import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
	buildReportSignatureSessionUser,
	calculateReportDocumentHash,
	calculateSignatureIntegrityHmac,
	deriveReportSignatureStatus,
	parseReportSignatureRole,
	stableStringify
} from './utils';

const reportA = {
	agency: 'Alpha Transit',
	type: 'rural',
	year: 2026,
	organizationId: 42,
	reportKey: 'Alpha Transit:rural:2026',
	overview: {
		systemId: 42,
		fiscalYear: 2026,
		systemName: 'Alpha Transit'
	},
	monthlyRows: [
		{ month: 2, serviceType: 'ALL', operatingDays: 4, hours: 5, miles: 6 },
		{ month: 1, serviceType: 'ALL', operatingDays: 1, hours: 2, miles: 3 }
	],
	ruralFinancialDraft: {
		draft: { a: [1, 2], b: [3, 4] },
		descriptions: { a: 'A', b: 'B' }
	},
	annualStatisticsDraft: null,
	ruralCompletionDraft: null,
	urbanFinancialDraft: null,
	urbanFinancialOutcomeDraft: null
};

const reportB = {
	...reportA,
	overview: {
		systemName: 'Alpha Transit',
		fiscalYear: 2026,
		systemId: 42
	},
	ruralFinancialDraft: {
		descriptions: { b: 'B', a: 'A' },
		draft: { b: [3, 4], a: [1, 2] }
	}
};

describe('report certification utilities', () => {
	const previousSecret = process.env.APP_SESSION_SECRET;

	beforeEach(() => {
		process.env.APP_SESSION_SECRET = 'unit-test-secret';
	});

	afterEach(() => {
		if (previousSecret == null) {
			delete process.env.APP_SESSION_SECRET;
		} else {
			process.env.APP_SESSION_SECRET = previousSecret;
		}
	});

	it('canonicalizes report snapshots before hashing', () => {
		expect(stableStringify(reportA.overview)).toBe(stableStringify(reportB.overview));
		expect(calculateReportDocumentHash(reportA)).toBe(calculateReportDocumentHash(reportB));
	});

	it('derives a stable integrity HMAC', () => {
		const payload = { reportKey: 'alpha:rural:2026', signedAt: '2026-07-22T00:00:00.000Z' };
		expect(calculateSignatureIntegrityHmac(payload)).toBe(calculateSignatureIntegrityHmac(payload));
	});

	it('parses report signature roles defensively', () => {
		expect(parseReportSignatureRole('authorized_official')).toBe('AUTHORIZED_OFFICIAL');
		expect(parseReportSignatureRole('FINANCIAL_MANAGER')).toBe('FINANCIAL_MANAGER');
		expect(parseReportSignatureRole('unknown')).toBeNull();
	});

	it('maps signature status from revocation fields', () => {
		expect(deriveReportSignatureStatus({ revokedAt: null, invalidatedAt: null })).toBe('active');
		expect(
			deriveReportSignatureStatus({ revokedAt: '2026-07-22T00:00:00.000Z', invalidatedAt: null })
		).toBe('revoked');
		expect(
			deriveReportSignatureStatus({
				revokedAt: null,
				invalidatedAt: '2026-07-22T00:00:00.000Z'
			})
		).toBe('invalidated');
	});

	it('builds a signer display name from the server session', () => {
		expect(
			buildReportSignatureSessionUser({
				authUserId: 1,
				email: 'sam@example.com',
				firstName: 'Sam',
				lastName: 'Taylor',
				username: 'staylor'
			})
		).toMatchObject({
			userId: 1,
			email: 'sam@example.com',
			displayName: 'Sam Taylor'
		});
	});
});
