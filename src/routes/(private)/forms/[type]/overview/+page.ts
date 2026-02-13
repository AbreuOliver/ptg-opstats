import { error, redirect } from '@sveltejs/kit';

const VALID_TYPES = new Set(['urban', 'rural']);

export async function load({ params }) {
	const { type } = params;

	if (!VALID_TYPES.has(type)) {
		throw error(404, 'Invalid form type');
	}

	const currentYear = new Date().getFullYear();
	throw redirect(302, `/forms/${type}/${currentYear}/overview`);
}
