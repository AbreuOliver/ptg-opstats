import type { RowDataPacket } from 'mysql2/promise';
import { getFormsReportPool } from '$lib/server/formsReport/db';

export type AuthUserRow = {
	id: number;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	isActive: boolean;
	isStaff: boolean;
	isSuperuser: boolean;
	lastLogin: string | null;
	dateJoined: string | null;
};

type RawAuthUserRow = RowDataPacket & {
	id: number;
	username: string;
	email: string;
	first_name: string;
	last_name: string;
	is_active: number;
	is_staff: number;
	is_superuser: number;
	last_login: Date | string | null;
	date_joined: Date | string | null;
};

export async function listAuthUsers(limit = 500): Promise<AuthUserRow[]> {
	const pool = getFormsReportPool();
	const [rows] = await pool.query<RawAuthUserRow[]>(
		`SELECT id, username, email, first_name, last_name, is_active, is_staff, is_superuser, last_login, date_joined
		 FROM auth_user
		 ORDER BY id ASC
		 LIMIT ?`,
		[limit]
	);

	return rows.map((row) => ({
		id: Number(row.id),
		username: row.username ?? '',
		email: row.email ?? '',
		firstName: row.first_name ?? '',
		lastName: row.last_name ?? '',
		isActive: Boolean(row.is_active),
		isStaff: Boolean(row.is_staff),
		isSuperuser: Boolean(row.is_superuser),
		lastLogin: row.last_login ? new Date(row.last_login).toISOString() : null,
		dateJoined: row.date_joined ? new Date(row.date_joined).toISOString() : null
	}));
}
