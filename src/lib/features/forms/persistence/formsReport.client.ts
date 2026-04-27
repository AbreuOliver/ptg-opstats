import type { FormType } from '$lib/features/forms/shared/types/capabilities.types';
import type { LocalFormSlices } from './formsReport.types';

export type FormsReportRecord = {
	agency: string;
	type: FormType;
	year: number;
	slices: LocalFormSlices;
	updatedAt: string;
	updatedBy: string | null;
};

async function parseJson<T>(res: Response): Promise<T> {
	const data = (await res.json().catch(() => null)) as T | null;
	if (!res.ok) {
		throw new Error(`Request failed (${res.status})`);
	}
	if (data == null) {
		throw new Error('Request returned an empty response');
	}
	return data;
}

function routeFor(agency: string, type: FormType, year: number): string {
	return `/api/forms-reports/${encodeURIComponent(agency)}/${type}/${year}`;
}

export async function loadFormsReport(params: {
	agency: string;
	type: FormType;
	year: number;
	signal?: AbortSignal;
}): Promise<FormsReportRecord | null> {
	const res = await fetch(routeFor(params.agency, params.type, params.year), {
		method: 'GET',
		headers: { accept: 'application/json' },
		signal: params.signal
	});
	const payload = await parseJson<{ report: FormsReportRecord | null }>(res);
	return payload.report;
}

export async function saveFormsReport(params: {
	agency: string;
	type: FormType;
	year: number;
	slices: LocalFormSlices;
}): Promise<FormsReportRecord> {
	const res = await fetch(routeFor(params.agency, params.type, params.year), {
		method: 'PUT',
		headers: {
			'content-type': 'application/json',
			accept: 'application/json'
		},
		body: JSON.stringify({ slices: params.slices })
	});
	const payload = await parseJson<{ report: FormsReportRecord }>(res);
	return payload.report;
}
