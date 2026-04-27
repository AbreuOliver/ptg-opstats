export function normalizeAgencyName(input: string): string {
	return input.trim().replace(/\s+/g, ' ').toUpperCase();
}

export function isValidAgencyName(input: string): boolean {
	return normalizeAgencyName(input).length > 0;
}
