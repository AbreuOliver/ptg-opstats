import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getFormsReportPool } from '$lib/server/formsReport/db';
import type {
	ReportCertificationContext,
	ReportSignatureMethod,
	ReportSignatureRecord,
	ReportSignatureRole,
	ReportSignatureStrokeData
} from './types';
import { isReportSignatureActive } from './utils';

const TABLE_NAME = 'report_signatures';
const CREATE_TABLE_SQL = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
	id BIGINT NOT NULL AUTO_INCREMENT,
	report_key VARCHAR(255) NOT NULL,
	agency VARCHAR(255) NOT NULL,
	form_type ENUM('urban', 'rural') NOT NULL,
	operating_year INT NOT NULL,
	organization_id BIGINT NOT NULL,
	role ENUM('AUTHORIZED_OFFICIAL', 'FINANCIAL_MANAGER', 'TAB_CHAIRPERSON') NOT NULL,
	signer_user_id BIGINT NOT NULL,
	signer_name VARCHAR(255) NOT NULL,
	signer_email VARCHAR(255) NOT NULL,
	signature_method ENUM('HANDWRITTEN_CANVAS') NOT NULL,
	signature_image LONGTEXT NOT NULL,
	signature_stroke_data JSON NOT NULL,
	document_hash CHAR(64) NOT NULL,
	record_integrity_hash CHAR(64) NOT NULL,
	consent_text TEXT NOT NULL,
	supporting_text TEXT NOT NULL,
	signed_at DATETIME(6) NOT NULL,
	signer_locale VARCHAR(100) NULL,
	signer_time_zone VARCHAR(64) NULL,
	signer_utc_offset_minutes SMALLINT NULL,
	ip_address VARCHAR(45) NULL,
	user_agent TEXT NULL,
	accept_language TEXT NULL,
	created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
	revoked_at DATETIME(6) NULL,
	revoked_by_user_id BIGINT NULL,
	revocation_reason VARCHAR(255) NULL,
	invalidated_at DATETIME(6) NULL,
	invalidation_reason VARCHAR(255) NULL,
	active_key TINYINT GENERATED ALWAYS AS (
		CASE
			WHEN revoked_at IS NULL AND invalidated_at IS NULL THEN 1
			ELSE NULL
		END
	) STORED,
	PRIMARY KEY (id),
	UNIQUE KEY report_signature_active_idx (report_key, role, active_key),
	KEY report_signature_report_idx (report_key, signed_at),
	KEY report_signature_org_idx (organization_id, signed_at),
	KEY report_signature_role_idx (role, signed_at)
)`;
type ReportSignatureRow = RowDataPacket & {
	id: number;
	report_key: string;
	agency: string;
	form_type: 'urban' | 'rural';
	operating_year: number;
	organization_id: number;
	role: ReportSignatureRole;
	signer_user_id: number;
	signer_name: string;
	signer_email: string;
	signature_method: ReportSignatureMethod;
	signature_image: string;
	signature_stroke_data: string | ReportSignatureStrokeData;
	document_hash: string;
	record_integrity_hash: string;
	consent_text: string;
	supporting_text: string;
	signed_at: string | Date;
	signer_locale: string | null;
	signer_time_zone: string | null;
	signer_utc_offset_minutes: number | null;
	ip_address: string | null;
	user_agent: string | null;
	accept_language: string | null;
	created_at: string | Date;
	revoked_at: string | Date | null;
	revoked_by_user_id: number | null;
	revocation_reason: string | null;
	invalidated_at: string | Date | null;
	invalidation_reason: string | null;
};

function toIsoTimestamp(value: string | Date | null): string | null {
	if (value == null) return null;
	return new Date(value).toISOString();
}

function mapRow(row: ReportSignatureRow): ReportSignatureRecord {
	return {
		reportKey: row.report_key,
		agency: row.agency,
		type: row.form_type,
		year: Number(row.operating_year),
		organizationId: Number(row.organization_id),
		id: Number(row.id),
		role: row.role,
		signerUserId: Number(row.signer_user_id),
		signerName: row.signer_name,
		signerEmail: row.signer_email,
		signatureMethod: row.signature_method,
		signatureImage: row.signature_image,
		signatureStrokeData:
			typeof row.signature_stroke_data === 'string'
				? (JSON.parse(row.signature_stroke_data) as ReportSignatureStrokeData)
				: row.signature_stroke_data,
		documentHash: row.document_hash,
		recordIntegrityHash: row.record_integrity_hash,
		consentText: row.consent_text,
		supportingText: row.supporting_text,
		signedAt: new Date(row.signed_at).toISOString(),
		signerLocale: row.signer_locale,
		signerTimeZone: row.signer_time_zone,
		signerUtcOffsetMinutes: row.signer_utc_offset_minutes,
		ipAddress: row.ip_address,
		userAgent: row.user_agent,
		acceptLanguage: row.accept_language,
		createdAt: new Date(row.created_at).toISOString(),
		revokedAt: toIsoTimestamp(row.revoked_at),
		revokedByUserId: row.revoked_by_user_id == null ? null : Number(row.revoked_by_user_id),
		revocationReason: row.revocation_reason,
		invalidatedAt: toIsoTimestamp(row.invalidated_at),
		invalidationReason: row.invalidation_reason
	};
}

function reportKey(input: ReportCertificationContext): string {
	return `${input.agency}:${input.type}:${input.year}`;
}

function parseDateTimeInput(value: string): string {
	return new Date(value).toISOString().slice(0, 19).replace('T', ' ');
}

function utcDateTimeSql(columnName: string): string {
	return `DATE_FORMAT(${columnName}, '%Y-%m-%dT%H:%i:%s.%fZ')`;
}

class TransactionReportSignatureStorage {
	private schemaReady: Promise<void> | null = null;

	constructor(private readonly pool: Pool) {}

	private async ensureSchema(): Promise<void> {
		if (!this.schemaReady) {
			this.schemaReady = this.pool
				.query(CREATE_TABLE_SQL)
				.then(async () => {
					const [rows] = await this.pool.query<RowDataPacket[]>(
						`SELECT COLUMN_NAME
						   FROM INFORMATION_SCHEMA.COLUMNS
						  WHERE TABLE_SCHEMA = DATABASE()
						    AND TABLE_NAME = ?
						    AND COLUMN_NAME IN ('signer_locale', 'signer_time_zone', 'signer_utc_offset_minutes')`,
						[TABLE_NAME]
					);
					const presentColumns = new Set(rows.map((row) => String(row.COLUMN_NAME)));
					const missingColumns = [
						!presentColumns.has('signer_locale')
							? 'ADD COLUMN signer_locale VARCHAR(100) NULL'
							: null,
						!presentColumns.has('signer_time_zone')
							? 'ADD COLUMN signer_time_zone VARCHAR(64) NULL'
							: null,
						!presentColumns.has('signer_utc_offset_minutes')
							? 'ADD COLUMN signer_utc_offset_minutes SMALLINT NULL'
							: null
					].filter(Boolean);
					if (missingColumns.length > 0) {
						await this.pool.query(`ALTER TABLE ${TABLE_NAME} ${missingColumns.join(', ')}`);
					}
				})
				.then(() => undefined);
		}
		await this.schemaReady;
	}

	private async withTransaction<T>(
		callback: (connection: PoolConnection) => Promise<T>
	): Promise<T> {
		await this.ensureSchema();
		const connection = await this.pool.getConnection();
		try {
			await connection.beginTransaction();
			const result = await callback(connection);
			await connection.commit();
			return result;
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	private async getByIdOnConnection(
		connection: Pool | PoolConnection,
		id: number
	): Promise<ReportSignatureRecord | null> {
		const [rows] = await connection.query<ReportSignatureRow[]>(
			`SELECT
			        id,
			        report_key,
			        agency,
			        form_type,
			        operating_year,
			        organization_id,
			        role,
			        signer_user_id,
			        signer_name,
			        signer_email,
			        signature_method,
			        signature_image,
			        signature_stroke_data,
			        document_hash,
			        record_integrity_hash,
			        consent_text,
			        supporting_text,
			        ${utcDateTimeSql('signed_at')} AS signed_at,
			        signer_locale,
			        signer_time_zone,
			        signer_utc_offset_minutes,
			        ip_address,
			        user_agent,
			        accept_language,
			        ${utcDateTimeSql('created_at')} AS created_at,
			        ${utcDateTimeSql('revoked_at')} AS revoked_at,
			        revoked_by_user_id,
			        revocation_reason,
			        ${utcDateTimeSql('invalidated_at')} AS invalidated_at,
			        invalidation_reason
			   FROM ${TABLE_NAME}
			  WHERE id = ?
			  LIMIT 1`,
			[id]
		);
		return rows[0] ? mapRow(rows[0]) : null;
	}

	async listByReport(input: ReportCertificationContext): Promise<ReportSignatureRecord[]> {
		await this.ensureSchema();
		const [rows] = await this.pool.query<ReportSignatureRow[]>(
			`SELECT
			        id,
			        report_key,
			        agency,
			        form_type,
			        operating_year,
			        organization_id,
			        role,
			        signer_user_id,
			        signer_name,
			        signer_email,
			        signature_method,
			        signature_image,
			        signature_stroke_data,
			        document_hash,
			        record_integrity_hash,
			        consent_text,
			        supporting_text,
			        ${utcDateTimeSql('signed_at')} AS signed_at,
			        signer_locale,
			        signer_time_zone,
			        signer_utc_offset_minutes,
			        ip_address,
			        user_agent,
			        accept_language,
			        ${utcDateTimeSql('created_at')} AS created_at,
			        ${utcDateTimeSql('revoked_at')} AS revoked_at,
			        revoked_by_user_id,
			        revocation_reason,
			        ${utcDateTimeSql('invalidated_at')} AS invalidated_at,
			        invalidation_reason
			   FROM ${TABLE_NAME}
			  WHERE report_key = ?
			  ORDER BY signed_at DESC, id DESC`,
			[reportKey(input)]
		);
		return rows.map(mapRow);
	}

	async getActiveByRole(
		input: ReportCertificationContext,
		role: ReportSignatureRole
	): Promise<ReportSignatureRecord | null> {
		await this.ensureSchema();
		const [rows] = await this.pool.query<ReportSignatureRow[]>(
			`SELECT
			        id,
			        report_key,
			        agency,
			        form_type,
			        operating_year,
			        organization_id,
			        role,
			        signer_user_id,
			        signer_name,
			        signer_email,
			        signature_method,
			        signature_image,
			        signature_stroke_data,
			        document_hash,
			        record_integrity_hash,
			        consent_text,
			        supporting_text,
			        ${utcDateTimeSql('signed_at')} AS signed_at,
			        signer_locale,
			        signer_time_zone,
			        signer_utc_offset_minutes,
			        ip_address,
			        user_agent,
			        accept_language,
			        ${utcDateTimeSql('created_at')} AS created_at,
			        ${utcDateTimeSql('revoked_at')} AS revoked_at,
			        revoked_by_user_id,
			        revocation_reason,
			        ${utcDateTimeSql('invalidated_at')} AS invalidated_at,
			        invalidation_reason
			   FROM ${TABLE_NAME}
			  WHERE report_key = ?
			    AND role = ?
			    AND revoked_at IS NULL
			    AND invalidated_at IS NULL
			  ORDER BY signed_at DESC, id DESC
			  LIMIT 1`,
			[reportKey(input), role]
		);
		return rows[0] ? mapRow(rows[0]) : null;
	}

	async getById(id: number): Promise<ReportSignatureRecord | null> {
		await this.ensureSchema();
		return this.getByIdOnConnection(this.pool, id);
	}

	async create(input: {
		context: ReportCertificationContext;
		role: ReportSignatureRole;
		signerUserId: number;
		signerName: string;
		signerEmail: string;
		signatureMethod: ReportSignatureMethod;
		signatureImage: string;
		signatureStrokeData: ReportSignatureStrokeData;
		documentHash: string;
		recordIntegrityHash: string;
		consentText: string;
		supportingText: string;
		signedAt: string;
		ipAddress: string | null;
		userAgent: string | null;
		acceptLanguage: string | null;
		signerLocale: string | null;
		signerTimeZone: string | null;
		signerUtcOffsetMinutes: number | null;
	}): Promise<ReportSignatureRecord> {
		return this.withTransaction(async (connection) => {
			const [activeRows] = await connection.query<ReportSignatureRow[]>(
				`SELECT id
				   FROM ${TABLE_NAME}
				  WHERE report_key = ?
				    AND role = ?
				    AND revoked_at IS NULL
				    AND invalidated_at IS NULL
				  LIMIT 1
				  FOR UPDATE`,
				[reportKey(input.context), input.role]
			);
			if (activeRows.length > 0) {
				const error = new Error('An active signature already exists for this role.');
				error.name = 'ReportSignatureConflictError';
				throw error;
			}

			const [result] = await connection.query<ResultSetHeader>(
				`INSERT INTO ${TABLE_NAME}
				   (report_key, agency, form_type, operating_year, organization_id, role, signer_user_id, signer_name, signer_email, signature_method, signature_image, signature_stroke_data, document_hash, record_integrity_hash, consent_text, supporting_text, signed_at, signer_locale, signer_time_zone, signer_utc_offset_minutes, ip_address, user_agent, accept_language)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					reportKey(input.context),
					input.context.agency,
					input.context.type,
					input.context.year,
					input.context.organizationId,
					input.role,
					input.signerUserId,
					input.signerName,
					input.signerEmail,
					input.signatureMethod,
					input.signatureImage,
					JSON.stringify(input.signatureStrokeData),
					input.documentHash,
					input.recordIntegrityHash,
					input.consentText,
					input.supportingText,
					parseDateTimeInput(input.signedAt),
					input.signerLocale,
					input.signerTimeZone,
					input.signerUtcOffsetMinutes,
					input.ipAddress,
					input.userAgent,
					input.acceptLanguage
				]
			);
			const record = await this.getByIdOnConnection(connection, Number(result.insertId));
			if (!record) {
				throw new Error('Failed to read back saved report signature.');
			}
			return record;
		});
	}

	async replace(input: {
		context: ReportCertificationContext;
		role: ReportSignatureRole;
		signerUserId: number;
		signerName: string;
		signerEmail: string;
		signatureMethod: ReportSignatureMethod;
		signatureImage: string;
		signatureStrokeData: ReportSignatureStrokeData;
		documentHash: string;
		recordIntegrityHash: string;
		consentText: string;
		supportingText: string;
		signedAt: string;
		ipAddress: string | null;
		userAgent: string | null;
		acceptLanguage: string | null;
		signerLocale: string | null;
		signerTimeZone: string | null;
		signerUtcOffsetMinutes: number | null;
	revocationReason: string;
	}): Promise<ReportSignatureRecord> {
		return this.withTransaction(async (connection) => {
			const [activeRows] = await connection.query<ReportSignatureRow[]>(
				`SELECT *
				   FROM ${TABLE_NAME}
				  WHERE report_key = ?
				    AND role = ?
				    AND revoked_at IS NULL
				    AND invalidated_at IS NULL
				  ORDER BY signed_at DESC, id DESC
				  LIMIT 1
				  FOR UPDATE`,
				[reportKey(input.context), input.role]
			);
			const activeRecord = activeRows[0] ? mapRow(activeRows[0]) : null;
			if (activeRecord) {
				await connection.query<ResultSetHeader>(
					`UPDATE ${TABLE_NAME}
					    SET revoked_at = ?, revoked_by_user_id = ?, revocation_reason = ?
					  WHERE id = ?`,
					[
						parseDateTimeInput(input.signedAt),
						input.signerUserId,
						input.revocationReason,
						activeRecord.id
					]
				);
			}

			const [result] = await connection.query<ResultSetHeader>(
				`INSERT INTO ${TABLE_NAME}
				   (report_key, agency, form_type, operating_year, organization_id, role, signer_user_id, signer_name, signer_email, signature_method, signature_image, signature_stroke_data, document_hash, record_integrity_hash, consent_text, supporting_text, signed_at, signer_locale, signer_time_zone, signer_utc_offset_minutes, ip_address, user_agent, accept_language)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					reportKey(input.context),
					input.context.agency,
					input.context.type,
					input.context.year,
					input.context.organizationId,
					input.role,
					input.signerUserId,
					input.signerName,
					input.signerEmail,
					input.signatureMethod,
					input.signatureImage,
					JSON.stringify(input.signatureStrokeData),
					input.documentHash,
					input.recordIntegrityHash,
					input.consentText,
					input.supportingText,
					parseDateTimeInput(input.signedAt),
					input.signerLocale,
					input.signerTimeZone,
					input.signerUtcOffsetMinutes,
					input.ipAddress,
					input.userAgent,
					input.acceptLanguage
				]
			);
			const record = await this.getByIdOnConnection(connection, Number(result.insertId));
			if (!record) {
				throw new Error('Failed to read back replaced report signature.');
			}
			return record;
		});
	}

	async revoke(input: {
		context: ReportCertificationContext;
		role: ReportSignatureRole;
		revokedByUserId: number;
		revokedAt: string;
		revocationReason: string;
	}): Promise<ReportSignatureRecord | null> {
		return this.withTransaction(async (connection) => {
			const [rows] = await connection.query<ReportSignatureRow[]>(
				`SELECT *
				   FROM ${TABLE_NAME}
				  WHERE report_key = ?
				    AND role = ?
				    AND revoked_at IS NULL
				    AND invalidated_at IS NULL
				  ORDER BY signed_at DESC, id DESC
				  LIMIT 1
				  FOR UPDATE`,
				[reportKey(input.context), input.role]
			);
			const activeRecord = rows[0] ? mapRow(rows[0]) : null;
			if (!activeRecord) return null;

			await connection.query<ResultSetHeader>(
				`UPDATE ${TABLE_NAME}
				    SET revoked_at = ?, revoked_by_user_id = ?, revocation_reason = ?
				  WHERE id = ?`,
				[
					parseDateTimeInput(input.revokedAt),
					input.revokedByUserId,
					input.revocationReason,
					activeRecord.id
				]
			);

			const refreshed = await this.getByIdOnConnection(connection, activeRecord.id);
			if (!refreshed) return null;
			return refreshed;
		});
	}

	async invalidateMatchingActiveSignatures(input: {
		context: ReportCertificationContext;
		documentHash: string;
		invalidatedByUserId: number | null;
		invalidatedAt: string;
		invalidationReason: string;
	}): Promise<ReportSignatureRecord[]> {
		return this.withTransaction(async (connection) => {
			const [rows] = await connection.query<ReportSignatureRow[]>(
				`SELECT *
				   FROM ${TABLE_NAME}
				  WHERE report_key = ?
				    AND revoked_at IS NULL
				    AND invalidated_at IS NULL
				    AND document_hash <> ?
				  ORDER BY signed_at DESC, id DESC
				  FOR UPDATE`,
				[reportKey(input.context), input.documentHash]
			);

			if (rows.length === 0) return [];

			await connection.query<ResultSetHeader>(
				`UPDATE ${TABLE_NAME}
				    SET invalidated_at = ?, revoked_by_user_id = COALESCE(?, revoked_by_user_id), invalidation_reason = ?
				  WHERE report_key = ?
				    AND revoked_at IS NULL
				    AND invalidated_at IS NULL
				    AND document_hash <> ?`,
				[
					parseDateTimeInput(input.invalidatedAt),
					input.invalidatedByUserId,
					input.invalidationReason,
					reportKey(input.context),
					input.documentHash
				]
			);

			return rows.map(mapRow);
		});
	}

	async listActiveByReport(input: ReportCertificationContext): Promise<ReportSignatureRecord[]> {
		await this.ensureSchema();
		const rows = await this.listByReport(input);
		return rows.filter((row) => isReportSignatureActive(row));
	}
}

let singleton: TransactionReportSignatureStorage | null = null;

export function getReportSignatureStorage(): TransactionReportSignatureStorage {
	if (!singleton) singleton = new TransactionReportSignatureStorage(getFormsReportPool());
	return singleton;
}
