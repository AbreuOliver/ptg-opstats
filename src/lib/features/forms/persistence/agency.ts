export function normalizeAgencyName(input: string): string {
	return input.trim().replace(/\s+/g, ' ').toUpperCase();
}

export function isValidAgencyName(input: string): boolean {
	return normalizeAgencyName(input).length > 0;
}

export function toAgencyPathSegment(input: string): string {
	const compact = input.trim().replace(/\s+/g, '-');
	return encodeURIComponent(compact);
}

export function fromAgencyPathSegment(input: string, candidates: string[] = []): string {
	let decoded: string;
	try {
		decoded = decodeURIComponent(input).trim();
	} catch {
		decoded = input.trim();
	}

	if (candidates.length > 0) {
		for (const candidate of candidates) {
			if (toAgencyPathSegment(candidate).toUpperCase() === input.toUpperCase()) {
				return normalizeAgencyName(candidate);
			}
		}
		for (const candidate of candidates) {
			if (normalizeAgencyName(candidate) === normalizeAgencyName(decoded)) {
				return normalizeAgencyName(candidate);
			}
		}
		const dashedAsSpaces = decoded.replace(/-/g, ' ');
		for (const candidate of candidates) {
			if (normalizeAgencyName(candidate) === normalizeAgencyName(dashedAsSpaces)) {
				return normalizeAgencyName(candidate);
			}
		}
	}

	return normalizeAgencyName(decoded.replace(/-/g, ' '));
}
