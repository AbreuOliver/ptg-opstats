import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidAgencyName, normalizeAgencyName } from '$lib/features/forms/persistence/agency';
import { getFormsReportRepository } from '$lib/server/formsReport/repository';
import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';
import type { LocalFormSlices } from '$lib/features/forms/persistence/formsReport.types';

function parseType(raw: string): FormType | null {
	if (raw === 'urban' || raw === 'rural') return raw;
	return null;
}

function parseYear(raw: string): number | null {
	const year = Number(raw);
	if (!Number.isInteger(year)) return null;
	if (year < 2000 || year > 2100) return null;
	return year;
}

function parseAgency(raw: string): string | null {
	if (!isValidAgencyName(raw)) return null;
	return normalizeAgencyName(raw);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const agency = parseAgency(params.agency);
	const type = parseType(params.type);
	const year = parseYear(params.year);

	if (!agency || !type || year == null) {
		return json({ error: 'Invalid request parameters' }, { status: 400 });
	}

	try {
		const report = await getFormsReportRepository().get({ agency, type, year });
		return json({ report });
	} catch (error) {
		console.error('Failed to load forms report', error);
		return json({ error: 'Failed to load forms report' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const agency = parseAgency(params.agency);
	const type = parseType(params.type);
	const year = parseYear(params.year);

	if (!agency || !type || year == null) {
		return json({ error: 'Invalid request parameters' }, { status: 400 });
	}

	const body = (await request.json().catch(() => null)) as
		| { slices?: LocalFormSlices }
		| null;
	if (!body || !isPlainObject(body.slices)) {
		return json({ error: 'Request body must include a slices object' }, { status: 400 });
	}

	try {
		const report = await getFormsReportRepository().upsert({
			agency,
			type,
			year,
			slices: body.slices,
			updatedBy: locals.user.email ?? null
		});

		return json({ report });
	} catch (error) {
		console.error('Failed to save forms report', error);
		return json({ error: 'Failed to save forms report' }, { status: 500 });
	}
};
