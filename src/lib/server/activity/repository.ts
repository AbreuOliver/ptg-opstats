import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getFormsReportPool } from '$lib/server/formsReport/db';

const TABLE_NAME = 'activity_log';

export type ActivityAction =
	| 'auth.sign_in'
	| 'forms.save_failed'
	| 'forms.save_succeeded';

export type ActivityEvent = {
	id: number;
	createdAt: string;
	userEmail: string | null;
	userDisplayName: string | null;
	systemId: number | null;
	agency: string | null;
	action: string;
	entityType: string | null;
	entityId: string | null;
	metadata: Record<string, unknown> | null;
};

export type ActivityUserOption = {
	email: string;
	displayName: string;
};

type ActivityRow = RowDataPacket & {
	id: number;
	created_at: string;
	user_email: string | null;
	user_first_name: string | null;
	user_last_name: string | null;
	user_username: string | null;
	system_id: number | null;
	agency: string | null;
	action: string;
	entity_type: string | null;
	entity_id: string | null;
	metadata: string | Record<string, unknown> | null;
};

function parseMysqlUtcTimestamp(value: string): string {
	const normalized = value.trim().replace(' ', 'T');
	return new Date(`${normalized}Z`).toISOString();
}

function buildUserDisplayName(row: ActivityRow): string | null {
	const firstInitial = row.user_first_name?.trim().charAt(0).toUpperCase();
	const lastName = row.user_last_name?.trim();
	if (firstInitial && lastName) return `${firstInitial}. ${lastName}`;
	if (row.user_username?.trim()) return row.user_username.trim();
	if (row.user_email?.includes('@')) return row.user_email.split('@')[0];
	return row.user_email;
}

function mapRow(row: ActivityRow): ActivityEvent {
	return {
		id: Number(row.id),
		createdAt: parseMysqlUtcTimestamp(row.created_at),
		userEmail: row.user_email,
		userDisplayName: buildUserDisplayName(row),
		systemId: row.system_id == null ? null : Number(row.system_id),
		agency: row.agency,
		action: row.action,
		entityType: row.entity_type,
		entityId: row.entity_id,
		metadata:
			typeof row.metadata === 'string'
				? (JSON.parse(row.metadata) as Record<string, unknown>)
				: row.metadata
	};
}

class ActivityRepository {
	async log(input: {
		userEmail?: string | null;
		systemId?: number | null;
		agency?: string | null;
		action: ActivityAction;
		entityType?: string | null;
		entityId?: string | null;
		metadata?: Record<string, unknown> | null;
	}): Promise<void> {
		const pool = getFormsReportPool();
		await pool.query<ResultSetHeader>(
			`INSERT INTO ${TABLE_NAME}
			   (user_email, system_id, agency, action, entity_type, entity_id, metadata)
			 VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON))`,
			[
				input.userEmail ?? null,
				input.systemId ?? null,
				input.agency ?? null,
				input.action,
				input.entityType ?? null,
				input.entityId ?? null,
				JSON.stringify(input.metadata ?? {})
			]
		);
	}

	async listUsers(input: {
		agency?: string | null;
		systemId?: number | null;
	}): Promise<ActivityUserOption[]> {
		const pool = getFormsReportPool();
		const conditions: string[] = [
			'activity.user_email IS NOT NULL',
			"TRIM(activity.user_email) <> ''"
		];
		const params: unknown[] = [];

		if (input.systemId != null) {
			conditions.push('activity.system_id = ?');
			params.push(input.systemId);
		} else if (input.agency) {
			conditions.push('UPPER(TRIM(activity.agency)) = UPPER(TRIM(?))');
			params.push(input.agency);
		}

		const [rows] = await pool.query<ActivityRow[]>(
			`SELECT DISTINCT
			        activity.user_email,
			        auth_user.first_name AS user_first_name,
			        auth_user.last_name AS user_last_name,
			        auth_user.username AS user_username
		   FROM ${TABLE_NAME} activity
		   LEFT JOIN auth_user
		     ON LOWER(auth_user.email) = LOWER(activity.user_email)
		  WHERE ${conditions.join(' AND ')}
		    ORDER BY
			    COALESCE(auth_user.last_name, ''),
			    COALESCE(auth_user.first_name, ''),
			    COALESCE(auth_user.username, ''),
			    activity.user_email`,
			params
		);

		return rows.map((row) => ({
			email: row.user_email ?? '',
			displayName: buildUserDisplayName(row) ?? row.user_email ?? ''
		}));
	}

	async list(input: {
		agency?: string | null;
		systemId?: number | null;
		userEmail?: string | null;
		limit?: number;
	}): Promise<ActivityEvent[]> {
		const pool = getFormsReportPool();
		const conditions: string[] = [];
		const params: unknown[] = [];

		if (input.systemId != null) {
			conditions.push('activity.system_id = ?');
			params.push(input.systemId);
		} else if (input.agency) {
			conditions.push('UPPER(TRIM(activity.agency)) = UPPER(TRIM(?))');
			params.push(input.agency);
		}

		if (input.userEmail) {
			conditions.push('LOWER(activity.user_email) = LOWER(?)');
			params.push(input.userEmail);
		}

		const limit = Math.min(Math.max(input.limit ?? 100, 1), 250);
		params.push(limit);

		const [rows] = await pool.query<ActivityRow[]>(
			`SELECT activity.id,
			        DATE_FORMAT(activity.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
			        activity.user_email,
			        auth_user.first_name AS user_first_name,
			        auth_user.last_name AS user_last_name,
			        auth_user.username AS user_username,
			        activity.system_id,
			        activity.agency,
			        activity.action,
			        activity.entity_type,
			        activity.entity_id,
			        activity.metadata
			   FROM ${TABLE_NAME} activity
			   LEFT JOIN auth_user
			     ON LOWER(auth_user.email) = LOWER(activity.user_email)
			  ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
			  ORDER BY activity.created_at DESC, activity.id DESC
			  LIMIT ?`,
			params
		);

		return rows.map(mapRow);
	}
}

let singleton: ActivityRepository | null = null;

export function getActivityRepository(): ActivityRepository {
	if (!singleton) singleton = new ActivityRepository();
	return singleton;
}
