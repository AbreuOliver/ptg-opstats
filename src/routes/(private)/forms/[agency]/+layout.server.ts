import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { canAccessAgency } from '$lib/server/rbac';
import {
	fromAgencyPathSegment,
	isValidAgencyName
} from '$lib/features/forms/persistence/agency';

export const load: LayoutServerLoad = async ({ params, locals, url }) => {
	const scope = locals.userScope;
	const candidates = Array.from(
		new Set([...(scope.allowedTransitSystems ?? []), ...(scope.transitSystem ? [scope.transitSystem] : [])])
	);
	const agency = fromAgencyPathSegment(params.agency ?? '', candidates);
	if (!isValidAgencyName(agency)) {
		throw error(404, 'Invalid transit agency');
	}
	if (!canAccessAgency(scope, agency)) {
		throw error(403, 'You do not have access to this transit agency.');
	}

	if (url.searchParams.has('agency')) {
		const next = new URL(url);
		next.searchParams.delete('agency');
		throw redirect(302, `${next.pathname}${next.search}${next.hash}`);
	}

	return {
		rbac: {
			isSuperAdmin: scope.isSuperAdmin,
			role: scope.role,
			selectedAgency: agency,
			allowedTransitSystems: scope.allowedTransitSystems
		}
	};
};
