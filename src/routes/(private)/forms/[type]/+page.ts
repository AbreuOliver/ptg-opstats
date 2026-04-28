import { error } from '@sveltejs/kit';

const VALID_TYPES = new Set(['urban', 'rural']);

export async function load({ params }) {
	const { type } = params;

	if (!VALID_TYPES.has(type)) {
		throw error(404, 'Invalid form type');
	}

	const now = new Date();
	const month = now.getMonth();
	const fiscalYear = month < 6 ? now.getFullYear() - 1 : now.getFullYear();
	const editableYears = month >= 6 && month <= 8 ? [fiscalYear, fiscalYear - 1] : [fiscalYear];

	return {
		type,
		currentFiscalYear: fiscalYear,
		editableYears
	};
}
