CREATE TABLE IF NOT EXISTS forms_reports (
    agency TEXT NOT NULL,
    form_type TEXT NOT NULL CHECK (form_type IN ('urban', 'rural')),
    operating_year INTEGER NOT NULL,
    slices JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT,
    PRIMARY KEY (agency, form_type, operating_year)
);

CREATE INDEX IF NOT EXISTS forms_reports_updated_at_idx
    ON forms_reports (updated_at DESC);
