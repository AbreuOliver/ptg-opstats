import { error } from '@sveltejs/kit';

export async function load({ params }) {
	if (params.type !== 'rural') {
		throw error(404, 'Not found');
	}
}
