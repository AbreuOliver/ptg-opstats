import { describe, expect, it } from 'vitest';
import { formatReportCertificationTimestamp } from './reportCertificationTimestamp';

describe('report certification timestamp formatting', () => {
	it('uses the signer UTC offset to preserve the local wall clock time', () => {
		const formatted = formatReportCertificationTimestamp({
			signedAt: '2026-07-22T14:39:00.000Z',
			signerUtcOffsetMinutes: 240
		},
		{
			isBrowser: true,
			locale: 'en-US',
			timeZone: 'America/New_York'
		});

		expect(formatted).toContain('10:39');
		expect(formatted).toContain('7/22/26');
	});
});
