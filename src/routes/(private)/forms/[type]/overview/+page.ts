import { error, redirect } from '@sveltejs/kit';

const VALID_TYPES = new Set(['urban', 'rural']);

export async function load({ params }) {
	const { type } = params;

	if (!VALID_TYPES.has(type)) {
		throw error(404, 'Invalid form type');
	}

	const now = new Date();
	const fiscalYear = now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear();
	throw redirect(302, `/forms/${type}/${fiscalYear}/overview`);
}
