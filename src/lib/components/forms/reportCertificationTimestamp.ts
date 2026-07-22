export type ReportCertificationTimestampSignature = {
	signedAt: string;
};

export type ReportCertificationTimestampFormatOptions = {
	locale?: string;
};

function isValidDate(value: Date): boolean {
	return !Number.isNaN(value.getTime());
}

export function formatReportCertificationTimestamp(
	signature: ReportCertificationTimestampSignature,
	options: ReportCertificationTimestampFormatOptions = {}
): string {
	const signedAt = new Date(signature.signedAt);
	if (!isValidDate(signedAt)) return '';

	return new Intl.DateTimeFormat(options.locale, {
		dateStyle: 'short',
		timeStyle: 'short'
	}).format(signedAt);
}
