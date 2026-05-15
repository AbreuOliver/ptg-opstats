import type { User } from '@supabase/supabase-js';
import { isValidAgencyName, normalizeAgencyName } from '$lib/features/forms/persistence/agency';
import { getAccessControlRepository } from '$lib/server/accessControl/repository';

export type AppRole = 'super_admin' | 'admin' | 'user';

export type UserScope = {
	role: AppRole;
	isSuperAdmin: boolean;
	transitSystem: string | null;
	allowedTransitSystems: string[];
};

function normalizeRole(value: unknown): AppRole | null {
	if (typeof value !== 'string') return null;
	const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
	if (normalized === 'super_admin' || normalized === 'superadmin') return 'super_admin';
	if (normalized === 'admin') return 'admin';
	if (normalized === 'user') return 'user';
	return null;
}

function readRole(user: User): AppRole {
	const app = user.app_metadata ?? {};
	const meta = user.user_metadata ?? {};

	const candidates = [app.role, app.user_role, app.app_role, meta.role, meta.user_role, meta.app_role];
	for (const candidate of candidates) {
		const parsed = normalizeRole(candidate);
		if (parsed) return parsed;
	}

	const email = (user.email ?? '').toLowerCase();
	if (email === 'orabreu@ncsu.edu' || email === 'jscott@ncsu.edu') return 'super_admin';
	return 'admin';
}

function normalizeAgencyArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	const out: string[] = [];
	for (const item of value) {
		if (typeof item !== 'string') continue;
		if (!isValidAgencyName(item)) continue;
		const normalized = normalizeAgencyName(item);
		if (!out.includes(normalized)) out.push(normalized);
	}
	return out;
}

function readTransitSystem(user: User): string | null {
	const app = user.app_metadata ?? {};
	const meta = user.user_metadata ?? {};
	const candidates = [
		app.transit_system,
		app.transitSystem,
		app.agency,
		app.agencyName,
		meta.transit_system,
		meta.transitSystem,
		meta.agency,
		meta.agencyName
	];

	for (const candidate of candidates) {
		if (typeof candidate !== 'string') continue;
		if (!isValidAgencyName(candidate)) continue;
		return normalizeAgencyName(candidate);
	}

	return null;
}

export function getUserScope(user: User | null): UserScope {
	if (!user) {
		return {
			role: 'user',
			isSuperAdmin: false,
			transitSystem: null,
			allowedTransitSystems: []
		};
	}

	const role = readRole(user);
	const isSuperAdmin = role === 'super_admin';
	const transitSystem = readTransitSystem(user);
	const app = user.app_metadata ?? {};
	const meta = user.user_metadata ?? {};
	const allowedTransitSystems = [
		...normalizeAgencyArray(app.allowed_transit_systems),
		...normalizeAgencyArray(meta.allowed_transit_systems)
	];

	if (transitSystem && !allowedTransitSystems.includes(transitSystem)) {
		allowedTransitSystems.push(transitSystem);
	}

	return {
		role,
		isSuperAdmin,
		transitSystem,
		allowedTransitSystems
	};
}

export function canAccessAgency(scope: UserScope, agency: string): boolean {
	const normalizedAgency = normalizeAgencyName(agency);
	if (scope.isSuperAdmin) return true;
	if (!scope.transitSystem) return false;
	return scope.transitSystem === normalizedAgency;
}

export async function resolveUserScope(user: User | null): Promise<UserScope> {
	const fallback = getUserScope(user);
	if (!user) return fallback;
	if (process.env.RBAC_USE_RDS_MAPPING !== 'true') return fallback;

	const email = user.email?.trim().toLowerCase();
	if (!email) return fallback;

	try {
		const mapping = await getAccessControlRepository().getUserAccessByEmail(email);
		if (!mapping || !mapping.isActive) return fallback;

		const isSuperAdmin = mapping.role === 'super_admin';
		const transitSystem = mapping.transitSystem;
		const allowedTransitSystems = transitSystem ? [transitSystem] : [];

		return {
			role: mapping.role,
			isSuperAdmin,
			transitSystem,
			allowedTransitSystems
		};
	} catch (error) {
		console.error('Failed to resolve RBAC from RDS mapping, using fallback claims.', error);
		return fallback;
	}
}
