CREATE TABLE IF NOT EXISTS report_signatures (
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
);
