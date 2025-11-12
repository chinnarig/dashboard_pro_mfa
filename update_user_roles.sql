-- Update User Roles to Match Enum Values
-- This script updates role values from lowercase to uppercase enum values

-- Step 1: Check current role column type
DO $$ 
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role';
    
    RAISE NOTICE 'Current role column type: %', col_type;
END $$;

-- Step 2: If role is currently an enum, we need to handle it differently
-- Drop the enum type if it exists (this will fail if the column is using it)
DO $$ 
BEGIN
    -- First change the column to text temporarily
    BEGIN
        ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50);
        RAISE NOTICE 'Converted role column to VARCHAR';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Column already VARCHAR or conversion failed: %', SQLERRM;
    END;
    
    -- Drop the old enum type if it exists
    BEGIN
        DROP TYPE IF EXISTS user_role CASCADE;
        RAISE NOTICE 'Dropped old user_role enum type';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No enum type to drop or drop failed: %', SQLERRM;
    END;
END $$;

-- Step 3: Update existing role values to uppercase
UPDATE users 
SET role = 'ADMIN' 
WHERE role IN ('admin', 'manager', 'Admin', 'Manager', 'MANAGER');

UPDATE users 
SET role = 'USER' 
WHERE role IN ('user', 'User', 'author', 'Author');

-- Step 4: Set NULL values to default USER role
UPDATE users SET role = 'USER' WHERE role IS NULL OR role = '';

-- Step 5: Create new enum type with correct values
CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');

-- Step 6: Convert column to use enum
ALTER TABLE users 
ALTER COLUMN role TYPE user_role 
USING role::user_role;

-- Step 7: Set constraints
ALTER TABLE users 
ALTER COLUMN role SET NOT NULL;

ALTER TABLE users 
ALTER COLUMN role SET DEFAULT 'USER';

-- Display updated roles
SELECT 
    email, 
    full_name, 
    role,
    CASE 
        WHEN role = 'ADMIN' THEN '✓ Admin'
        WHEN role = 'USER' THEN '✓ User'
        ELSE '✗ Invalid'
    END as role_status
FROM users
ORDER BY role, email;
