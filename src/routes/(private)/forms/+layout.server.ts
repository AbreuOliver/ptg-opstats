import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import {
	isValidAgencyName,
	normalizeAgencyName,
	toAgencyPathSegment
} from '$lib/features/forms/persistence/agency';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const scope = locals.userScope;
	const requestedAgency = url.searchParams.get('agency');
	const normalizedRequestedAgency =
		requestedAgency && isValidAgencyName(requestedAgency)
			? normalizeAgencyName(requestedAgency)
			: null;

	if (scope.isSuperAdmin) {
		return {
			rbac: {
				isSuperAdmin: true,
				role: scope.role,
				selectedAgency: normalizedRequestedAgency ?? scope.transitSystem ?? null,
				allowedTransitSystems: scope.allowedTransitSystems
			}
		};
	}

	if (!scope.transitSystem) {
		throw error(403, 'Transit system is not configured for this account.');
	}

	if (url.pathname === '/forms') {
		const target = `/forms/${toAgencyPathSegment(scope.transitSystem)}${url.search}`;
		throw redirect(302, target);
	}

	if (
		requestedAgency &&
		normalizedRequestedAgency &&
		normalizedRequestedAgency !== scope.transitSystem
	) {
		const params = new URLSearchParams(url.searchParams);
		params.delete('agency');
		const target = `${url.pathname}${params.size > 0 ? `?${params.toString()}` : ''}`;
		throw redirect(302, target);
	}

	return {
		rbac: {
			isSuperAdmin: false,
			role: scope.role,
			selectedAgency: scope.transitSystem,
			allowedTransitSystems: [scope.transitSystem]
		}
	};
};
