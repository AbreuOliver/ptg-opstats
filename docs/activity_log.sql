CREATE TABLE IF NOT EXISTS activity_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_email VARCHAR(255) NULL,
    system_id INT NULL,
    agency VARCHAR(255) NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NULL,
    entity_id VARCHAR(255) NULL,
    metadata JSON NULL,
    INDEX activity_log_created_at_idx (created_at),
    INDEX activity_log_user_email_idx (user_email),
    INDEX activity_log_system_id_idx (system_id),
    INDEX activity_log_agency_idx (agency),
    INDEX activity_log_action_idx (action)
);
