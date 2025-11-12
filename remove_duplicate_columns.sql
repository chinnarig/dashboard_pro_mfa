-- Migration: Remove duplicate timestamp columns
-- Remove created_at, updatedAt, emailVerified (keep created_at, updated_at, email_verified)

BEGIN;

-- Drop the duplicate columns
ALTER TABLE users DROP COLUMN IF EXISTS "created_at";
ALTER TABLE users DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE users DROP COLUMN IF EXISTS "emailVerified";

COMMIT;

SELECT 'Migration completed: Removed created_at, updatedAt, emailVerified columns' as status;
