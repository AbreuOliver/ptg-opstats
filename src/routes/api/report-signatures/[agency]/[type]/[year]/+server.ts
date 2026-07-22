import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidAgencyName, normalizeAgencyName } from '$lib/features/forms/persistence/agency';
import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';
import {
	createReportSignature,
	getReportSignatures,
	replaceReportSignature,
	revokeReportSignature
} from '$lib/server/reportCertification/service';
import type { ReportSignatureRequestBody } from '$lib/server/reportCertification/types';
import { parseReportSignatureRole } from '$lib/server/reportCertification/utils';

function parseType(raw: string): FormType | null {
	if (raw === 'urban' || raw === 'rural') return raw;
	return null;
}

function parseYear(raw: string): number | null {
	const year = Number(raw);
	if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
	return year;
}

function parseAgency(raw: string): string | null {
	if (!isValidAgencyName(raw)) return null;
	return normalizeAgencyName(raw);
}

function parseBody(value: unknown): ReportSignatureRequestBody {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return {};
	}
	return value as ReportSignatureRequestBody;
}

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const agency = parseAgency(params.agency);
	const type = parseType(params.type);
	const year = parseYear(params.year);
	if (!agency || !type || year == null) {
		return json({ error: 'Invalid request parameters' }, { status: 400 });
	}

	try {
		const signatures = await getReportSignatures({
			agency,
			type,
			year,
			user
		});
		return json({ signatures });
	} catch (error) {
		const status =
			typeof error === 'object' && error && 'status' in error
				? Number((error as { status?: unknown }).status)
				: 500;
		const message =
			status === 401
				? 'Unauthorized'
				: status === 403
					? 'Forbidden'
					: status === 404
						? 'Report not found'
						: 'Failed to load report signatures';
		return json({ error: message }, { status });
	}
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const agency = parseAgency(params.agency);
	const type = parseType(params.type);
	const year = parseYear(params.year);
	if (!agency || !type || year == null) {
		return json({ error: 'Invalid request parameters' }, { status: 400 });
	}

	try {
		const body = parseBody(await request.json().catch(() => null));
		const signature = await createReportSignature({
			agency,
			type,
			year,
			user,
			body,
			request
		});
		return json({ signature }, { status: 201 });
	} catch (error) {
		const status =
			typeof error === 'object' && error && 'status' in error
				? Number((error as { status?: unknown }).status)
				: 500;
		const message =
			status === 401
				? 'Unauthorized'
				: status === 403
					? 'Forbidden'
					: status === 404
						? 'Report not found'
						: status === 409
							? 'An active signature already exists for this role.'
							: status === 400
								? (error as Error).message
								: 'Failed to save signature';
		return json({ error: message }, { status });
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const agency = parseAgency(params.agency);
	const type = parseType(params.type);
	const year = parseYear(params.year);
	if (!agency || !type || year == null) {
		return json({ error: 'Invalid request parameters' }, { status: 400 });
	}

	try {
		const body = parseBody(await request.json().catch(() => null));
		const signature = await replaceReportSignature({
			agency,
			type,
			year,
			user,
			body,
			request
		});
		return json({ signature });
	} catch (error) {
		const status =
			typeof error === 'object' && error && 'status' in error
				? Number((error as { status?: unknown }).status)
				: 500;
		const message =
			status === 401
				? 'Unauthorized'
				: status === 403
					? 'Forbidden'
					: status === 404
						? 'Report not found'
						: status === 400
							? (error as Error).message
							: 'Failed to replace signature';
		return json({ error: message }, { status });
	}
};

export const DELETE: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const agency = parseAgency(params.agency);
	const type = parseType(params.type);
	const year = parseYear(params.year);
	if (!agency || !type || year == null) {
		return json({ error: 'Invalid request parameters' }, { status: 400 });
	}

	const body = (await request.json().catch(() => null)) as {
		role?: unknown;
		reason?: unknown;
	} | null;
	const role = parseReportSignatureRole(body?.role);
	if (!role) {
		return json({ error: 'A valid signature role is required.' }, { status: 400 });
	}

	try {
		const signature = await revokeReportSignature({
			agency,
			type,
			year,
			role,
			user,
			request,
			reason: typeof body?.reason === 'string' ? body.reason : undefined
		});
		if (!signature) {
			return json({ error: 'No active signature was found for this role.' }, { status: 404 });
		}
		return json({ signature });
	} catch (error) {
		const status =
			typeof error === 'object' && error && 'status' in error
				? Number((error as { status?: unknown }).status)
				: 500;
		const message =
			status === 401
				? 'Unauthorized'
				: status === 403
					? 'Forbidden'
					: status === 404
						? 'Report not found'
						: status === 400
							? (error as Error).message
							: 'Failed to revoke signature';
		return json({ error: message }, { status });
	}
};
