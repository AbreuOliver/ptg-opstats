-- RBAC mapping for NC OpStats
-- Run on MySQL 8+ (AWS RDS)

CREATE TABLE IF NOT EXISTS auth_user_access (
  email VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin', 'user') NOT NULL,
  transit_system VARCHAR(255) NULL,
  can_manage_users BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NULL,
  updated_by VARCHAR(255) NULL,
  PRIMARY KEY (email),
  CONSTRAINT auth_user_access_transit_required_for_non_super
    CHECK (role = 'super_admin' OR transit_system IS NOT NULL)
);

CREATE INDEX idx_auth_user_access_role ON auth_user_access(role);
CREATE INDEX idx_auth_user_access_transit ON auth_user_access(transit_system);

-- Optional table to track invite workflows (admin/super-admin adds users)
CREATE TABLE IF NOT EXISTS auth_user_invites (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL,
  transit_system VARCHAR(255) NOT NULL,
  invited_by VARCHAR(255) NOT NULL,
  invite_status ENUM('pending', 'accepted', 'expired', 'revoked') NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX idx_auth_user_invites_email ON auth_user_invites(email);
CREATE INDEX idx_auth_user_invites_transit ON auth_user_invites(transit_system);
CREATE INDEX idx_auth_user_invites_status ON auth_user_invites(invite_status);
