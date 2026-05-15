import { error, redirect } from '@sveltejs/kit';

const VALID_TYPES = new Set(['urban', 'rural']);

export async function load({ params, url }) {
	const { type } = params;

	if (!VALID_TYPES.has(type)) {
		throw error(404, 'Invalid form type');
	}

	const now = new Date();
	const fiscalYear = now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear();
	const query = url.searchParams.toString();
	throw redirect(302, `/forms/${type}/${fiscalYear}/overview${query ? `?${query}` : ''}`);
}
