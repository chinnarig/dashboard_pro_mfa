-- Migration: Rename hashed_password to password and remove duplicate password column
-- This consolidates password storage into a single column

BEGIN;

-- First, if there's data in the password column that should be kept,
-- you might want to backup or merge it. For now, we'll just drop it.

-- Drop the password column (the one we just added)
ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Rename hashed_password to password
ALTER TABLE users RENAME COLUMN hashed_password TO password;

-- Update comment
COMMENT ON COLUMN users.password IS 'Hashed password for authentication';

COMMIT;

SELECT 'Migration completed: Renamed hashed_password to password' as status;
