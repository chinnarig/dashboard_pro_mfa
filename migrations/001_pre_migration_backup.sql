-- =============================================
-- PRE-MIGRATION BACKUP SCRIPT
-- =============================================
-- Run this BEFORE the migration to create backups
--
-- Usage:
--   psql -h <host> -U <user> -d <database> -f 001_pre_migration_backup.sql
-- =============================================

\echo '==========================================';
\echo 'PRE-MIGRATION BACKUP AND VALIDATION';
\echo '==========================================';
\echo '';

-- Set timezone
SET timezone = 'UTC';

-- Create backup schema if not exists
CREATE SCHEMA IF NOT EXISTS migration_backup;

\echo 'Creating backup tables...';

-- Backup existing tables (if they exist)
DO $$
BEGIN
    -- Backup companies table if exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companies') THEN
        DROP TABLE IF EXISTS migration_backup.companies_backup;
        CREATE TABLE migration_backup.companies_backup AS SELECT * FROM companies;
        RAISE NOTICE 'Backed up % rows from companies', (SELECT COUNT(*) FROM migration_backup.companies_backup);
    END IF;

    -- Backup users table if exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP TABLE IF EXISTS migration_backup.users_backup;
        CREATE TABLE migration_backup.users_backup AS SELECT * FROM users;
        RAISE NOTICE 'Backed up % rows from users', (SELECT COUNT(*) FROM migration_backup.users_backup);
    END IF;

    -- Backup agents table if exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agents') THEN
        DROP TABLE IF EXISTS migration_backup.agents_backup;
        CREATE TABLE migration_backup.agents_backup AS SELECT * FROM agents;
        RAISE NOTICE 'Backed up % rows from agents', (SELECT COUNT(*) FROM migration_backup.agents_backup);
    END IF;

    -- Backup call_logs table if exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'call_logs') THEN
        DROP TABLE IF EXISTS migration_backup.call_logs_backup;
        CREATE TABLE migration_backup.call_logs_backup AS SELECT * FROM call_logs;
        RAISE NOTICE 'Backed up % rows from call_logs', (SELECT COUNT(*) FROM migration_backup.call_logs_backup);
    END IF;

    -- Backup audit_logs table if exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        DROP TABLE IF EXISTS migration_backup.audit_logs_backup;
        CREATE TABLE migration_backup.audit_logs_backup AS SELECT * FROM audit_logs;
        RAISE NOTICE 'Backed up % rows from audit_logs', (SELECT COUNT(*) FROM migration_backup.audit_logs_backup);
    END IF;
END $$;

-- Create migration log table
CREATE TABLE IF NOT EXISTS migration_backup.migration_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255),
    status VARCHAR(50),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    notes TEXT
);

-- Log the backup
INSERT INTO migration_backup.migration_log (migration_name, status, notes)
VALUES ('001_pre_migration_backup', 'completed', 'Pre-migration backup completed successfully');

\echo '';
\echo 'Backup completed successfully!';
\echo 'Backup schema: migration_backup';
\echo '';
\echo 'Validating current schema...';

-- Display current table counts
\echo '';
\echo 'Current table row counts:';
SELECT
    CASE
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companies')
        THEN (SELECT COUNT(*) FROM companies)
        ELSE 0
    END AS companies_count,
    CASE
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')
        THEN (SELECT COUNT(*) FROM users)
        ELSE 0
    END AS users_count,
    CASE
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agents')
        THEN (SELECT COUNT(*) FROM agents)
        ELSE 0
    END AS agents_count,
    CASE
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'call_logs')
        THEN (SELECT COUNT(*) FROM call_logs)
        ELSE 0
    END AS call_logs_count;

\echo '';
\echo '==========================================';
\echo 'BACKUP COMPLETE - Ready for migration';
\echo '==========================================';
