import type { RowDataPacket } from 'mysql2/promise';
import {
	canonicalizeTransitAgencyKey,
	isValidAgencyName
} from '$lib/features/forms/persistence/agency';
import { getFormsReportPool } from '$lib/server/formsReport/db';
import type { AuthenticatedAppUser } from '$lib/server/auth/user';
import { isVisibleTransitSystemId } from '$lib/data/transitSystemVisibility';

export type AppRole = 'super_admin' | 'admin' | 'user';

export type UserScope = {
	role: AppRole;
	isSuperAdmin: boolean;
	transitSystem: string | null;
	allowedTransitSystems: string[];
};

function normalizeRole(value: unknown): AppRole | null {
	if (typeof value !== 'string') return null;
	const normalized = value
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, '_');
	if (normalized === 'super_admin' || normalized === 'superadmin') return 'super_admin';
	if (normalized === 'admin') return 'admin';
	if (normalized === 'user') return 'user';
	return null;
}

function rolePriority(role: AppRole): number {
	if (role === 'super_admin') return 3;
	if (role === 'admin') return 2;
	return 1;
}

function emptyUserScope(): UserScope {
	return {
		role: 'user',
		isSuperAdmin: false,
		transitSystem: null,
		allowedTransitSystems: []
	};
}

export function canAccessAgency(scope: UserScope, agency: string): boolean {
	const normalizedAgency = canonicalizeTransitAgencyKey(agency);
	if (scope.isSuperAdmin) return true;
	return scope.allowedTransitSystems.includes(normalizedAgency);
}

type UserScopeRow = RowDataPacket & {
	role: string | null;
	agency_name: string | null;
	agency_system_id: number | null;
};

export async function resolveUserScope(user: AuthenticatedAppUser | null): Promise<UserScope> {
	if (!user?.email) return emptyUserScope();

	try {
		const pool = getFormsReportPool();
		const [rows] = await pool.query<UserScopeRow[]>(
			`SELECT r.role, s.SystemName AS agency_name, s.SystemID AS agency_system_id
			   FROM auth_user u
			   LEFT JOIN app_user_system_roles r
			     ON r.user_id = u.id
			   LEFT JOIN tblAll_SystemInfo s
			     ON s.ID = r.system_info_id
			  WHERE u.id = ?
			    AND LOWER(u.email) = LOWER(?)
			    AND u.is_active = 1`,
			[user.authUserId, user.email]
		);
		if (rows.length === 0) return emptyUserScope();

		let role: AppRole = 'user';
		const allowedTransitSystems: string[] = [];
		for (const row of rows) {
			const parsedRole = normalizeRole(row.role);
			if (parsedRole && rolePriority(parsedRole) > rolePriority(role)) {
				role = parsedRole;
			}
			if (
				row.agency_name &&
				isValidAgencyName(row.agency_name) &&
				isVisibleTransitSystemId(row.agency_system_id == null ? null : Number(row.agency_system_id))
			) {
				const agency = canonicalizeTransitAgencyKey(row.agency_name);
				if (!allowedTransitSystems.includes(agency)) allowedTransitSystems.push(agency);
			}
		}

		return {
			role,
			isSuperAdmin: role === 'super_admin',
			transitSystem: allowedTransitSystems[0] ?? null,
			allowedTransitSystems
		};
	} catch (error) {
		console.error('Failed to resolve RBAC from RDS auth_user roles.', error);
		return emptyUserScope();
	}
}
