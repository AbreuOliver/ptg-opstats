import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type {
	FormsReportKey,
	FormsReportRepository,
	PersistedFormsReport
} from './types';
import type { LocalFormSlices } from '$lib/features/forms/persistence/formsReport.types';
import { getFormsReportPool } from './db';

const TABLE_NAME = 'forms_reports';

function mapRowToReport(row: {
	agency: string;
	form_type: 'urban' | 'rural';
	operating_year: number;
	slices: LocalFormSlices | string;
	updated_at: string | Date;
	updated_by: string | null;
}): PersistedFormsReport {
	return {
		agency: row.agency,
		type: row.form_type,
		year: row.operating_year,
		slices: typeof row.slices === 'string' ? (JSON.parse(row.slices) as LocalFormSlices) : row.slices,
		updatedAt: new Date(row.updated_at).toISOString(),
		updatedBy: row.updated_by
	};
}

class PostgresFormsReportRepository implements FormsReportRepository {
	constructor(private readonly pool: Pool) {}

	async get(key: FormsReportKey): Promise<PersistedFormsReport | null> {
		const [rows] = await this.pool.query<
			(RowDataPacket & {
			agency: string;
			form_type: 'urban' | 'rural';
			operating_year: number;
			slices: LocalFormSlices | string;
			updated_at: string | Date;
			updated_by: string | null;
		})[]
		>(
			`SELECT agency, form_type, operating_year, slices, updated_at, updated_by
			 FROM ${TABLE_NAME}
			 WHERE agency = ? AND form_type = ? AND operating_year = ?
			 LIMIT 1`,
			[key.agency, key.type, key.year]
		);

		if (rows.length === 0) return null;
		return mapRowToReport(rows[0]);
	}

	async upsert(
		input: FormsReportKey & { slices: LocalFormSlices; updatedBy: string | null }
	): Promise<PersistedFormsReport> {
		await this.pool.query<ResultSetHeader>(
			`INSERT INTO ${TABLE_NAME} (agency, form_type, operating_year, slices, updated_by)
			 VALUES (?, ?, ?, CAST(? AS JSON), ?)
			 ON DUPLICATE KEY UPDATE slices = VALUES(slices),
			                         updated_by = VALUES(updated_by),
			                         updated_at = CURRENT_TIMESTAMP`,
			[input.agency, input.type, input.year, JSON.stringify(input.slices), input.updatedBy]
		);

		const saved = await this.get(input);
		if (!saved) {
			throw new Error('Failed to read back saved forms report row.');
		}
		return saved;
	}
}

let repoSingleton: FormsReportRepository | null = null;

export function getFormsReportRepository(): FormsReportRepository {
	if (!repoSingleton) {
		repoSingleton = new PostgresFormsReportRepository(getFormsReportPool());
	}
	return repoSingleton;
}
