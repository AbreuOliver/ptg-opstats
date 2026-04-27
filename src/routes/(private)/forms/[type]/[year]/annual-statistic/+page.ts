import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => {
	const suffix = `${url.search}${url.hash}`;
	throw redirect(307, `/forms/${params.type}/${params.year}/annual-statistics${suffix}`);
};
