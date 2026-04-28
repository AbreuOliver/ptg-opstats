// src/routes/(app)/forms/[type]/[year]/+page.ts

import { error, redirect } from '@sveltejs/kit';

export async function load({ url, params }) {
	const { type, year } = params;

	if (type !== 'urban' && type !== 'rural') {
		throw error(404, 'Invalid form type');
	}

	const yearNumber = Number.parseInt(year, 10);
	if (!Number.isFinite(yearNumber)) {
		throw error(404, 'Invalid year');
	}

	const now = new Date();
	const month = now.getMonth();
	const fiscalYear = month < 6 ? now.getFullYear() - 1 : now.getFullYear();
	const editableYears = month >= 6 && month <= 8 ? [fiscalYear, fiscalYear - 1] : [fiscalYear];

	if (!editableYears.includes(yearNumber)) {
		throw error(404, 'Year is not currently editable');
	}

	if (url.pathname === `/forms/${type}/${year}`) {
		throw redirect(302, `/forms/${type}/${year}/overview`);
	}

	return {
		year: yearNumber
	};
}
