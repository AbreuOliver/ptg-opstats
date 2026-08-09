const wholeFormatter = new Intl.NumberFormat('en-US');

export function parseDecimalInput(raw: string): number | null {
	const cleaned = raw.trim().replace(/[,\s$]/g, '');
	if (cleaned === '') return null;
	if (!/^-?(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(cleaned)) return null;
	const parsed = Number(cleaned);
	if (!Number.isFinite(parsed)) return null;
	return Math.round(parsed * 100) / 100;
}

export function formatRoundedWhole(value: number | null): string {
	if (value == null || !Number.isFinite(value)) return '';
	return wholeFormatter.format(Math.round(value));
}

export function formatEditableDecimal(value: number | null): string {
	if (value == null || !Number.isFinite(value)) return '';
	const normalized = Math.round(value * 100) / 100;
	return normalized.toFixed(2).replace(/\.?0+$/, '');
}
