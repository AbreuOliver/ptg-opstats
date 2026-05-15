import type { Pool, RowDataPacket } from 'mysql2/promise';
import { getFormsReportPool } from '$lib/server/formsReport/db';
import type { AccessControlRepository, UserAccessMapping } from './types';
import type { AppRole } from '$lib/server/rbac';
import { isValidAgencyName, normalizeAgencyName } from '$lib/features/forms/persistence/agency';

const TABLE_NAME = 'auth_user_access';

function parseRole(value: string): AppRole {
	const normalized = value.trim().toLowerCase();
	if (normalized === 'super_admin' || normalized === 'admin' || normalized === 'user') {
		return normalized;
	}
	return 'user';
}

function mapRowToAccess(row: {
	email: string;
	role: string;
	transit_system: string | null;
	can_manage_users: boolean | number;
	is_active: boolean | number;
}): UserAccessMapping {
	return {
		email: row.email.toLowerCase(),
		role: parseRole(row.role),
		transitSystem:
			row.transit_system && isValidAgencyName(row.transit_system)
				? normalizeAgencyName(row.transit_system)
				: null,
		canManageUsers: Boolean(row.can_manage_users),
		isActive: Boolean(row.is_active)
	};
}

class PostgresAccessControlRepository implements AccessControlRepository {
	constructor(private readonly pool: Pool) {}

	async getUserAccessByEmail(email: string): Promise<UserAccessMapping | null> {
		const normalizedEmail = email.trim().toLowerCase();
		const [rows] = await this.pool.query<
			(RowDataPacket & {
			email: string;
			role: string;
			transit_system: string | null;
			can_manage_users: number | boolean;
			is_active: number | boolean;
		})[]
		>(
			`SELECT email, role, transit_system, can_manage_users, is_active
			   FROM ${TABLE_NAME}
			  WHERE email = ?
			  LIMIT 1`,
			[normalizedEmail]
		);

		if (rows.length === 0) return null;
		return mapRowToAccess(rows[0]);
	}
}

let repoSingleton: AccessControlRepository | null = null;

export function getAccessControlRepository(): AccessControlRepository {
	if (!repoSingleton) {
		repoSingleton = new PostgresAccessControlRepository(getFormsReportPool());
	}
	return repoSingleton;
}
