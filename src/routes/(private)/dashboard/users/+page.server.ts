import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	throw redirect(302, `/users${url.search}`);
};

export const actions: Actions = {};
