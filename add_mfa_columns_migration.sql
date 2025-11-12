-- Migration: Add MFA database columns to users table
-- Run this SQL in your PostgreSQL database to add missing columns

BEGIN;

-- Add full_name column (from MFA db)
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Add is_active column (from MFA db)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add email_verified as boolean (from MFA db)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Add mfa_enabled column (snake_case version)
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;

-- Add mfa_secret column (snake_case version)
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret TEXT;

-- Add mfa_backup_codes column (snake_case version)
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT;

-- Add last_login column (snake_case version)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP(3);

-- Update existing data to set defaults
UPDATE users SET is_active = true WHERE is_active IS NULL;
UPDATE users SET email_verified = false WHERE email_verified IS NULL;
UPDATE users SET mfa_enabled = false WHERE mfa_enabled IS NULL;
UPDATE users SET full_name = COALESCE(full_name, split_part(email, '@', 1));

-- Make is_active NOT NULL after setting defaults
ALTER TABLE users ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;
ALTER TABLE users ALTER COLUMN mfa_enabled SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled);

-- Comments
COMMENT ON COLUMN users.full_name IS 'Full name of the user';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN users.email_verified IS 'Whether the email has been verified (boolean)';
COMMENT ON COLUMN users.mfa_enabled IS 'Whether MFA is enabled for this user';
COMMENT ON COLUMN users.mfa_secret IS 'Encrypted TOTP secret for MFA';
COMMENT ON COLUMN users.mfa_backup_codes IS 'Encrypted backup codes (JSON array)';
COMMENT ON COLUMN users.last_login IS 'Timestamp of last successful login';

COMMIT;

SELECT 'Migration completed: Added MFA database columns to users table' as status;
