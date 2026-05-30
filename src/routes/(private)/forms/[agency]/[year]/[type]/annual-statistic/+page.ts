import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => {
	const suffix = `${url.search}${url.hash}`;
	throw redirect(
		307,
		`/forms/${params.agency}/${params.year}/${params.type}/annual-statistics${suffix}`
	);
};
