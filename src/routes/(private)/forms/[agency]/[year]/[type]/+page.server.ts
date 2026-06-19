// src/routes/(app)/forms/[type]/[year]/+page.ts

import { error, redirect } from '@sveltejs/kit';
import { getCurrentFiscalYear } from '$lib/server/opstats/weekSatSunLoader';
import { isEditableFiscalYear } from '$lib/features/forms/shared/fiscalYearAccess';

export async function load({ url, params }) {
	const { agency, type, year } = params;

	if (type !== 'urban' && type !== 'rural') {
		throw error(404, 'Invalid form type');
	}

	const yearNumber = Number.parseInt(year, 10);
	if (!Number.isFinite(yearNumber)) {
		throw error(404, 'Invalid year');
	}

	const fiscalYear = getCurrentFiscalYear();

	if (url.pathname === `/forms/${agency}/${year}/${type}`) {
		const query = url.searchParams.toString();
		throw redirect(302, `/forms/${agency}/${year}/${type}/overview${query ? `?${query}` : ''}`);
	}

	return {
		year: yearNumber,
		currentFiscalYear: fiscalYear,
		isEditableYear: isEditableFiscalYear(yearNumber, fiscalYear)
	};
}
