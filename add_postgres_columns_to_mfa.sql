-- Migration: Add missing columns from postgres database to mfa database users table
-- This adds columns that exist in postgres but are missing in mfa

BEGIN;

-- Add name column
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- Add username column (unique)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add emailVerified column (timestamp without timezone)
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);

-- Add image column
ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;

-- Add password column (for compatibility, though mfa uses hashed_password)
-- Note: You might want to sync this with hashed_password or keep them separate
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Add bio column
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add verification token columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS "verificationToken" TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "verificationExpires" TIMESTAMP(3);

-- Add reset token columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetToken" TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetTokenExpires" TIMESTAMP(3);

-- Add created_at and updatedAt (timestamp without timezone to match postgres)
-- Note: These will coexist with created_at/updated_at (with timezone)
ALTER TABLE users ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_verificationToken ON users("verificationToken") WHERE "verificationToken" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_resetToken ON users("resetToken") WHERE "resetToken" IS NOT NULL;

-- Update existing rows to have created_at/updatedAt from created_at/updated_at
UPDATE users 
SET "created_at" = created_at, 
    "updatedAt" = updated_at 
WHERE "created_at" IS NULL OR "updatedAt" IS NULL;

-- Comments
COMMENT ON COLUMN users.name IS 'User display name (optional)';
COMMENT ON COLUMN users.username IS 'Unique username (optional)';
COMMENT ON COLUMN users."emailVerified" IS 'DateTime when email was verified (NextAuth compatible)';
COMMENT ON COLUMN users.image IS 'User profile image URL';
COMMENT ON COLUMN users.password IS 'Password field for compatibility (consider using hashed_password)';
COMMENT ON COLUMN users.bio IS 'User biography/description';
COMMENT ON COLUMN users."verificationToken" IS 'Email verification token';
COMMENT ON COLUMN users."verificationExpires" IS 'Verification token expiration';
COMMENT ON COLUMN users."resetToken" IS 'Password reset token';
COMMENT ON COLUMN users."resetTokenExpires" IS 'Reset token expiration';
COMMENT ON COLUMN users."created_at" IS 'Timestamp without timezone (Prisma compatible)';
COMMENT ON COLUMN users."updatedAt" IS 'Timestamp without timezone (Prisma compatible)';

COMMIT;

SELECT 'Migration completed: Added postgres database columns to mfa users table' as status;
