import { error } from '@sveltejs/kit';

const VALID_TYPES = new Set(['urban', 'rural']);

export async function load({ params, url, parent }) {
	const { type } = params;
	const parentData = await parent();

	if (!VALID_TYPES.has(type)) {
		throw error(404, 'Invalid form type');
	}

	const now = new Date();
	const month = now.getMonth();
	const fiscalYear = month < 6 ? now.getFullYear() - 1 : now.getFullYear();
	const editableYears = month >= 6 && month <= 8 ? [fiscalYear, fiscalYear - 1] : [fiscalYear];
	const rbac = (parentData as { rbac?: { isSuperAdmin?: boolean } }).rbac;
	const agencyParam = url.searchParams.get('agency');
	const agencyQuery = rbac?.isSuperAdmin && agencyParam ? `?agency=${encodeURIComponent(agencyParam)}` : '';

	return {
		type,
		currentFiscalYear: fiscalYear,
		editableYears,
		agencyQuery
	};
}
