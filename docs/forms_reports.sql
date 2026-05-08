CREATE TABLE IF NOT EXISTS forms_reports (
    agency VARCHAR(255) NOT NULL,
    form_type ENUM('urban', 'rural') NOT NULL,
    operating_year INT NOT NULL,
    slices JSON NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL,
    PRIMARY KEY (agency, form_type, operating_year),
    INDEX forms_reports_updated_at_idx (updated_at)
);
