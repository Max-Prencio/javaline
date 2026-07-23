-- ══════════════════════════════════════════════════════════════════════
-- V4: Account Lockout + Password Reset Tokens
-- Applied: 2026-07-23
-- ══════════════════════════════════════════════════════════════════════

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_at             TIMESTAMP,
  ADD COLUMN IF NOT EXISTS password_reset_token  VARCHAR(200),
  ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

CREATE INDEX IF NOT EXISTS ix_users_status_locked
  ON users (status) WHERE status = 'locked';

CREATE INDEX IF NOT EXISTS ix_users_reset_token
  ON users (password_reset_token) WHERE password_reset_token IS NOT NULL;

SELECT 'V4 account lockout applied' AS result;
