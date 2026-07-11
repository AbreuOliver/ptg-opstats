import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import crypto from 'node:crypto';
import { getFormsReportPool } from '$lib/server/formsReport/db';
import type { AppRole } from '$lib/server/rbac';
import {
	MAX_VISIBLE_TRANSIT_SYSTEM_ID,
	TEST_TRANSIT_SYSTEM_ID
} from '$lib/data/transitSystemVisibility';

export type AuthorizedUserRow = {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	fullName: string;
	displayName: string;
	email: string;
	isActive: boolean;
	role: AppRole | string;
	systemInfoId: number | null;
	agencyName: string;
	agencySystemId: number | null;
	canToggleActive: boolean;
	toggleDisabledReason: string | null;
	canDelete: boolean;
	deleteDisabledReason: string | null;
};

type RawAuthorizedUserRow = RowDataPacket & {
	id: number;
	email: string;
	username: string;
	first_name: string | null;
	last_name: string | null;
	full_name: string | null;
	is_active: number | boolean;
	role: string;
	system_info_id: number | null;
	agency_name: string | null;
	agency_system_id: number | null;
};

type ActorRoleRow = RowDataPacket & {
	id: number;
	role: string;
	system_info_id: number | null;
};

type TargetRoleRow = RowDataPacket & {
	id: number;
	role: string;
	system_info_id: number | null;
};

type UsernameRow = RowDataPacket & {
	username: string;
};

export type SystemInfoOption = {
	id: number;
	systemId: number | null;
	name: string;
};

type RawSystemInfoOption = RowDataPacket & {
	id: number;
	system_id: number | null;
	name: string;
};

function parseRole(value: string | null | undefined): AppRole | string {
	const normalized = (value ?? '').trim().toLowerCase();
	if (normalized === 'super_admin' || normalized === 'admin' || normalized === 'user') return normalized;
	return normalized || 'user';
}

function requireAppRole(value: FormDataEntryValue | null): AppRole {
	const role = parseRole(typeof value === 'string' ? value : null);
	if (role === 'super_admin' || role === 'admin' || role === 'user') return role;
	throw new Error('Invalid user status.');
}

function normalizeEmail(value: FormDataEntryValue | null): string {
	if (typeof value !== 'string') throw new Error('Email is required.');
	const email = value.trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
	return email;
}

function normalizeName(value: FormDataEntryValue | null): string {
	return typeof value === 'string' ? value.trim().slice(0, 150) : '';
}

function requireName(value: FormDataEntryValue | null, label: string): string {
	const normalized = normalizeName(value);
	if (!normalized) throw new Error(`${label} is required.`);
	return normalized;
}

function requireSystemInfoId(value: FormDataEntryValue | null): number {
	const id = Number(value);
	if (!Number.isInteger(id) || id <= 0) throw new Error('Transit agency is required.');
	return id;
}

function usernameBaseFromEmail(email: string): string {
	return (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9@.+_-]/g, '').slice(0, 140) || 'user';
}

function canActorToggleUser(actorRows: ActorRoleRow[], targetRows: TargetRoleRow[]): boolean {
	if (actorRows.length === 0 || targetRows.length === 0) return false;
	const actorId = Number(actorRows[0].id);
	const targetId = Number(targetRows[0].id);
	if (actorId === targetId) return false;

	if (actorRows.some((row) => parseRole(row.role) === 'super_admin')) return true;
	if (targetRows.some((row) => parseRole(row.role) === 'super_admin')) return false;

	return actorRows.some(
		(actor) =>
			parseRole(actor.role) === 'admin' &&
			targetRows.some((target) => actor.system_info_id != null && actor.system_info_id === target.system_info_id)
	);
}

function disabledReason(actorRows: ActorRoleRow[], targetRows: TargetRoleRow[]): string | null {
	if (actorRows.length === 0) return 'No app role is available for the signed-in user.';
	if (targetRows.length === 0) return 'Target user does not have an app role assignment.';
	const actorId = Number(actorRows[0].id);
	const targetId = Number(targetRows[0].id);
	const actorIsSuperAdmin = actorRows.some((row) => parseRole(row.role) === 'super_admin');
	const actorIsAdmin = actorRows.some((row) => parseRole(row.role) === 'admin');

	if (actorId === targetId) return 'Users cannot activate or deactivate themselves.';
	if (actorIsSuperAdmin) return null;
	if (!actorIsAdmin) return 'Normal users cannot activate or deactivate users.';
	if (targetRows.some((row) => parseRole(row.role) === 'super_admin')) {
		return 'Admins cannot activate or deactivate super admins.';
	}
	if (
		actorRows.some(
			(actor) =>
				parseRole(actor.role) === 'admin' &&
				targetRows.some((target) => actor.system_info_id != null && actor.system_info_id === target.system_info_id)
		)
	) {
		return null;
	}
	return 'Admins can only activate or deactivate users assigned to their own agency.';
}

function deleteDisabledReason(actorRows: ActorRoleRow[], targetRows: TargetRoleRow[]): string | null {
	if (actorRows.length === 0) return 'No app role is available for the signed-in user.';
	if (targetRows.length === 0) return 'Target user does not have an app role assignment.';
	const actorId = Number(actorRows[0].id);
	const targetId = Number(targetRows[0].id);
	if (actorId === targetId) return 'Users cannot delete themselves.';
	if (actorRows.some((row) => parseRole(row.role) === 'super_admin')) return null;
	if (targetRows.some((row) => parseRole(row.role) === 'super_admin')) {
		return 'Admins cannot delete super admins.';
	}
	if (
		actorRows.some(
			(actor) =>
				parseRole(actor.role) === 'admin' &&
				targetRows.some((target) => actor.system_info_id != null && actor.system_info_id === target.system_info_id)
		)
	) {
		return null;
	}
	return 'Admins can only delete users assigned to their own agency.';
}

async function getActorRoleRowsByEmail(email: string): Promise<ActorRoleRow[]> {
	const pool = getFormsReportPool();
	const [rows] = await pool.query<ActorRoleRow[]>(
		`SELECT u.id, r.role, r.system_info_id
		   FROM auth_user u
		   JOIN app_user_system_roles r
		     ON r.user_id = u.id
		  WHERE LOWER(u.email) = LOWER(?)`,
		[email]
	);
	return rows;
}

async function getTargetRoleRows(userId: number): Promise<TargetRoleRow[]> {
	const pool = getFormsReportPool();
	const [rows] = await pool.query<TargetRoleRow[]>(
		`SELECT u.id, r.role, r.system_info_id
		   FROM auth_user u
		   JOIN app_user_system_roles r
		     ON r.user_id = u.id
		  WHERE u.id = ?`,
		[userId]
	);
	return rows;
}

async function nextAvailableUsername(baseEmail: string): Promise<string> {
	const pool = getFormsReportPool();
	const base = usernameBaseFromEmail(baseEmail);
	const [rows] = await pool.query<UsernameRow[]>(
		`SELECT username FROM auth_user WHERE username = ? OR username LIKE ?`,
		[base, `${base}-%`]
	);
	const used = new Set(rows.map((row) => row.username));
	if (!used.has(base)) return base;
	for (let i = 2; i < 10000; i += 1) {
		const candidate = `${base}-${i}`;
		if (!used.has(candidate) && candidate.length <= 150) return candidate;
	}
	return `${base.slice(0, 120)}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function isSuperAdminEmail(email: string): Promise<boolean> {
	const actorRows = await getActorRoleRowsByEmail(email);
	return actorRows.some((row) => parseRole(row.role) === 'super_admin');
}

export async function canCreateUsersEmail(email: string): Promise<boolean> {
	const actorRows = await getActorRoleRowsByEmail(email);
	return actorRows.some((row) => {
		const role = parseRole(row.role);
		return role === 'super_admin' || role === 'admin';
	});
}

export async function authorizedUserEmailExists(emailInput: string): Promise<boolean> {
	const email = normalizeEmail(emailInput);
	const pool = getFormsReportPool();
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT u.id
		   FROM auth_user u
		   JOIN app_user_system_roles r
		     ON r.user_id = u.id
		  WHERE LOWER(u.email) = LOWER(?)
		  LIMIT 1`,
		[email]
	);
	return rows.length > 0;
}

export async function listSystemInfoOptions(): Promise<SystemInfoOption[]> {
	const pool = getFormsReportPool();
	const [rows] = await pool.query<RawSystemInfoOption[]>(
		`SELECT ID AS id, SystemID AS system_id, SystemName AS name
		   FROM tblAll_SystemInfo
		  WHERE SystemName IS NOT NULL
		    AND TRIM(SystemName) <> ''
		    AND (SystemID <= ? OR SystemID = ?)
		  ORDER BY SystemName`,
		[MAX_VISIBLE_TRANSIT_SYSTEM_ID, TEST_TRANSIT_SYSTEM_ID]
	);
	return rows.map((row) => ({
		id: Number(row.id),
		systemId: row.system_id == null ? null : Number(row.system_id),
		name: row.name
	}));
}

export async function listAuthorizedUsers(currentUserEmail: string): Promise<AuthorizedUserRow[]> {
	const pool = getFormsReportPool();
	const actorRows = await getActorRoleRowsByEmail(currentUserEmail);
	const actorIsSuperAdmin = actorRows.some((row) => parseRole(row.role) === 'super_admin');
	const actorAdminSystemInfoIds = [
		...new Set(
			actorRows
				.filter((row) => parseRole(row.role) === 'admin' && row.system_info_id != null)
				.map((row) => Number(row.system_info_id))
		)
	];

	if (!actorIsSuperAdmin && actorAdminSystemInfoIds.length === 0) {
		return [];
	}

	const scopedWhere = actorIsSuperAdmin
		? `WHERE (r.role = 'super_admin' OR s.SystemID <= ? OR s.SystemID = ?)`
		: `WHERE r.role <> 'super_admin'
		     AND r.system_info_id IN (${actorAdminSystemInfoIds.map(() => '?').join(', ')})
		     AND (s.SystemID <= ? OR s.SystemID = ?)`;
	const scopedParams = actorIsSuperAdmin
		? [MAX_VISIBLE_TRANSIT_SYSTEM_ID, TEST_TRANSIT_SYSTEM_ID]
		: [...actorAdminSystemInfoIds, MAX_VISIBLE_TRANSIT_SYSTEM_ID, TEST_TRANSIT_SYSTEM_ID];
	const [rows] = await pool.query<RawAuthorizedUserRow[]>(
		`SELECT
			u.id,
			u.first_name,
			u.last_name,
			CONCAT(
				COALESCE(u.first_name, ''),
				CASE
					WHEN u.first_name <> '' AND u.last_name <> '' THEN ' '
					ELSE ''
				END,
				COALESCE(u.last_name, '')
			) AS full_name,
			u.email,
			u.username,
			u.is_active,
			r.role,
			r.system_info_id,
			s.SystemName AS agency_name,
			s.SystemID AS agency_system_id
		 FROM auth_user u
		 JOIN app_user_system_roles r
		   ON r.user_id = u.id
		 LEFT JOIN tblAll_SystemInfo s
		   ON s.ID = r.system_info_id
		 ${scopedWhere}
		 ORDER BY
		   CASE r.role
		     WHEN 'super_admin' THEN 1
		     WHEN 'admin' THEN 2
		     WHEN 'user' THEN 3
		     ELSE 4
		   END,
		   full_name,
		   u.email`,
		scopedParams
	);

	const targetRowsByUserId = new Map<number, TargetRoleRow[]>();
	for (const row of rows) {
		const userRows = targetRowsByUserId.get(Number(row.id)) ?? [];
		userRows.push({
			id: row.id,
			role: row.role,
			system_info_id: row.system_info_id
		} as TargetRoleRow);
		targetRowsByUserId.set(Number(row.id), userRows);
	}

	return rows.map((row) => {
		const targetRows = targetRowsByUserId.get(Number(row.id)) ?? [];
		const reason = disabledReason(actorRows, targetRows);
		const deleteReason = deleteDisabledReason(actorRows, targetRows);
		const role = parseRole(row.role);
		const fullName = (row.full_name ?? '').trim();
		const email = row.email ?? '';
		return {
			id: Number(row.id),
			username: row.username ?? '',
			firstName: row.first_name ?? '',
			lastName: row.last_name ?? '',
			fullName,
			displayName: fullName || email,
			email,
			isActive: Boolean(row.is_active),
			role,
			systemInfoId: row.system_info_id == null ? null : Number(row.system_info_id),
			agencyName: role === 'super_admin' ? 'Statewide' : (row.agency_name ?? 'Unassigned'),
			agencySystemId: row.agency_system_id == null ? null : Number(row.agency_system_id),
			canToggleActive: reason == null && canActorToggleUser(actorRows, targetRows),
			toggleDisabledReason: reason,
			canDelete: deleteReason == null,
			deleteDisabledReason: deleteReason
		};
	});
}

export async function setUserActive(args: {
	actorEmail: string;
	targetUserId: number;
	active: boolean;
}): Promise<void> {
	const actorRows = await getActorRoleRowsByEmail(args.actorEmail);
	const targetRows = await getTargetRoleRows(args.targetUserId);
	if (targetRows.length === 0) {
		throw new Error('Target user does not have an app role assignment.');
	}

	const mayUpdate = canActorToggleUser(actorRows, targetRows);
	if (!mayUpdate) {
		throw new Error('You do not have permission to change this user status.');
	}

	const pool = getFormsReportPool();
	const [result] = await pool.query<ResultSetHeader>(
		`UPDATE auth_user SET is_active = ? WHERE id = ?`,
		[args.active ? 1 : 0, args.targetUserId]
	);

	if (result.affectedRows !== 1) {
		throw new Error('User status was not updated.');
	}
}

export async function createAuthorizedUser(args: {
	actorEmail: string;
	firstName: FormDataEntryValue | null;
	lastName: FormDataEntryValue | null;
	email: FormDataEntryValue | null;
	role: FormDataEntryValue | null;
	systemInfoId: FormDataEntryValue | null;
	active: boolean;
}): Promise<void> {
	const actorRows = await getActorRoleRowsByEmail(args.actorEmail);
	const actorIsSuperAdmin = actorRows.some((row) => parseRole(row.role) === 'super_admin');
	const actorAdminSystemInfoIds = [
		...new Set(
			actorRows
				.filter((row) => parseRole(row.role) === 'admin' && row.system_info_id != null)
				.map((row) => Number(row.system_info_id))
		)
	];
	if (!actorIsSuperAdmin && actorAdminSystemInfoIds.length === 0) {
		throw new Error('Only admins and super admins can create users.');
	}

	const email = normalizeEmail(args.email);
	const firstName = requireName(args.firstName, 'First name');
	const lastName = requireName(args.lastName, 'Last name');
	const role = requireAppRole(args.role);
	if (!actorIsSuperAdmin && role === 'super_admin') {
		throw new Error('Admins cannot create super admin users.');
	}
	let resolvedSystemInfoId: number | null = null;
	if (role === 'super_admin') {
		resolvedSystemInfoId = null;
	} else if (actorIsSuperAdmin) {
		resolvedSystemInfoId = requireSystemInfoId(args.systemInfoId);
	} else {
		resolvedSystemInfoId = actorAdminSystemInfoIds[0] ?? null;
	}
	if (role !== 'super_admin' && resolvedSystemInfoId == null) {
		throw new Error('Transit agency is required.');
	}
	if (role !== 'super_admin' && !actorIsSuperAdmin) {
		if (resolvedSystemInfoId == null) {
			throw new Error('Transit agency is required.');
		}
		if (!actorAdminSystemInfoIds.includes(resolvedSystemInfoId)) {
			throw new Error('Admins can only create users for their own agency.');
		}
	}
	const username = await nextAvailableUsername(email);
	const unusablePassword = `!${crypto.randomUUID().replace(/-/g, '')}`;
	const pool = getFormsReportPool();
	const conn = await pool.getConnection();

	try {
		await conn.beginTransaction();
		const [existing] = await conn.query<RowDataPacket[]>(
			`SELECT id FROM auth_user WHERE LOWER(email) = LOWER(?) LIMIT 1`,
			[email]
		);
		if (existing.length > 0) {
			throw new Error('A user with this email address already exists.');
		}
		const [systemRows] = await conn.query<RowDataPacket[]>(
			`SELECT ID
			   FROM tblAll_SystemInfo
			  WHERE ID = ?
			    AND (SystemID <= ? OR SystemID = ?)
			  LIMIT 1`,
			[resolvedSystemInfoId, MAX_VISIBLE_TRANSIT_SYSTEM_ID, TEST_TRANSIT_SYSTEM_ID]
		);
		if (role !== 'super_admin' && systemRows.length === 0) {
			throw new Error('Select a valid transit agency.');
		}

		const [result] = await conn.query<ResultSetHeader>(
			`INSERT INTO auth_user
				(password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined)
			 VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, NOW(6))`,
			[
				unusablePassword,
				role === 'super_admin' ? 1 : 0,
				username,
				firstName,
				lastName,
				email,
				role === 'super_admin' || role === 'admin' ? 1 : 0,
				args.active ? 1 : 0
			]
		);

		await conn.query(
			`INSERT INTO app_user_system_roles (user_id, system_info_id, role)
			 VALUES (?, ?, ?)`,
			[result.insertId, resolvedSystemInfoId, role]
		);
		await conn.commit();
	} catch (error) {
		await conn.rollback();
		throw error;
	} finally {
		conn.release();
	}
}

export async function deleteAuthorizedUser(args: {
	actorEmail: string;
	targetUserId: number;
	confirmation: FormDataEntryValue | null;
}): Promise<void> {
	if (typeof args.confirmation !== 'string' || args.confirmation.trim().toLowerCase() !== 'delete') {
		throw new Error('Type Delete to confirm this action.');
	}

	const actorRows = await getActorRoleRowsByEmail(args.actorEmail);
	const targetRows = await getTargetRoleRows(args.targetUserId);
	const reason = deleteDisabledReason(actorRows, targetRows);
	if (reason) throw new Error(reason);

	const pool = getFormsReportPool();
	const conn = await pool.getConnection();
	try {
		await conn.beginTransaction();
		await conn.query(`DELETE FROM app_user_system_roles WHERE user_id = ?`, [args.targetUserId]);
		const [result] = await conn.query<ResultSetHeader>(`DELETE FROM auth_user WHERE id = ?`, [
			args.targetUserId
		]);
		if (result.affectedRows !== 1) {
			throw new Error('User was not deleted.');
		}
		await conn.commit();
	} catch (error) {
		await conn.rollback();
		throw error;
	} finally {
		conn.release();
	}
}
