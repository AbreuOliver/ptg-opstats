import type { Pool } from 'pg';
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
	slices: LocalFormSlices;
	updated_at: string | Date;
	updated_by: string | null;
}): PersistedFormsReport {
	return {
		agency: row.agency,
		type: row.form_type,
		year: row.operating_year,
		slices: row.slices,
		updatedAt: new Date(row.updated_at).toISOString(),
		updatedBy: row.updated_by
	};
}

class PostgresFormsReportRepository implements FormsReportRepository {
	constructor(private readonly pool: Pool) {}

	async get(key: FormsReportKey): Promise<PersistedFormsReport | null> {
		const result = await this.pool.query<{
			agency: string;
			form_type: 'urban' | 'rural';
			operating_year: number;
			slices: LocalFormSlices;
			updated_at: string | Date;
			updated_by: string | null;
		}>(
			`SELECT agency, form_type, operating_year, slices, updated_at, updated_by
			 FROM ${TABLE_NAME}
			 WHERE agency = $1 AND form_type = $2 AND operating_year = $3
			 LIMIT 1`,
			[key.agency, key.type, key.year]
		);

		if (result.rowCount === 0) return null;
		return mapRowToReport(result.rows[0]);
	}

	async upsert(
		input: FormsReportKey & { slices: LocalFormSlices; updatedBy: string | null }
	): Promise<PersistedFormsReport> {
		const result = await this.pool.query<{
			agency: string;
			form_type: 'urban' | 'rural';
			operating_year: number;
			slices: LocalFormSlices;
			updated_at: string | Date;
			updated_by: string | null;
		}>(
			`INSERT INTO ${TABLE_NAME} (agency, form_type, operating_year, slices, updated_by)
			 VALUES ($1, $2, $3, $4::jsonb, $5)
			 ON CONFLICT (agency, form_type, operating_year)
			 DO UPDATE SET slices = EXCLUDED.slices,
			               updated_by = EXCLUDED.updated_by,
			               updated_at = now()
			 RETURNING agency, form_type, operating_year, slices, updated_at, updated_by`,
			[input.agency, input.type, input.year, JSON.stringify(input.slices), input.updatedBy]
		);

		return mapRowToReport(result.rows[0]);
	}
}

let repoSingleton: FormsReportRepository | null = null;

export function getFormsReportRepository(): FormsReportRepository {
	if (!repoSingleton) {
		repoSingleton = new PostgresFormsReportRepository(getFormsReportPool());
	}
	return repoSingleton;
}
