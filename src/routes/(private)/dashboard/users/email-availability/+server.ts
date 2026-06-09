import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	throw redirect(302, `/users/email-availability${url.search}`);
};
