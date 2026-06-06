-- Custom email OTP authentication for NC OpStats
-- Run on MySQL 8+ (AWS RDS)
--
-- If your auth_user.id column is not INT, adjust auth_otp_code.user_id to match before
-- applying the foreign key constraint.

CREATE TABLE IF NOT EXISTS auth_otp_code (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  code_hash CHAR(64) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  used_at DATETIME(6) NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_auth_otp_code_user
    FOREIGN KEY (user_id)
    REFERENCES auth_user(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_auth_otp_code_user_latest
  ON auth_otp_code (user_id, used_at, expires_at, created_at);

CREATE INDEX idx_auth_otp_code_cleanup
  ON auth_otp_code (created_at);
