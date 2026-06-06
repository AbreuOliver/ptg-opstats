import type { RowDataPacket } from 'mysql2/promise';
import { getFormsReportPool } from '$lib/server/formsReport/db';

export type AuthenticatedAppUser = {
	id: string;
	authUserId: number;
	email: string;
	username: string | null;
	firstName: string;
	lastName: string;
	app_metadata?: Record<string, unknown>;
	user_metadata?: Record<string, unknown>;
};

type AuthUserRow = RowDataPacket & {
	id: number;
	email: string;
	username: string | null;
	first_name: string | null;
	last_name: string | null;
};

export async function getActiveAuthUserBySession(args: {
	userId: number;
	email: string;
}): Promise<AuthenticatedAppUser | null> {
	const pool = getFormsReportPool();
	const [rows] = await pool.query<AuthUserRow[]>(
		`SELECT id, email, username, first_name, last_name
		   FROM auth_user
		  WHERE id = ?
		    AND LOWER(email) = LOWER(?)
		    AND is_active = 1
		  LIMIT 1`,
		[args.userId, args.email]
	);

	const row = rows[0];
	if (!row) return null;

	return {
		id: String(row.id),
		authUserId: Number(row.id),
		email: row.email.toLowerCase(),
		username: row.username ?? null,
		firstName: row.first_name ?? '',
		lastName: row.last_name ?? '',
		app_metadata: {},
		user_metadata: {}
	};
}
