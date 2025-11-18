-- =============================================
-- ROLLBACK SCRIPT
-- =============================================
-- Rolls back the migration to the previous state
--
-- WARNING: This will DROP new tables and restore from backup
-- Only run this if migration failed or needs to be reverted
--
-- Prerequisites:
--   1. Backup tables exist in migration_backup schema
--   2. Run this ONLY if you need to rollback
--
-- Usage:
--   psql -h <host> -U <user> -d <database> -f 003_rollback.sql
-- =============================================

\echo '==========================================';
\echo 'WARNING: STARTING ROLLBACK PROCESS';
\echo '==========================================';
\echo '';
\echo 'This will:';
\echo '  1. Drop new tables (phone_numbers, prompts, sso_providers, etc.)';
\echo '  2. Restore from migration_backup schema';
\echo '  3. Revert column changes';
\echo '';
\echo 'Press Ctrl+C within 5 seconds to cancel...';
SELECT pg_sleep(5);

BEGIN;

-- Log rollback start
INSERT INTO migration_backup.migration_log (migration_name, status, notes)
VALUES ('003_rollback', 'started', 'Rollback process started');

\echo 'Step 1: Dropping audit triggers...';

DROP TRIGGER IF EXISTS audit_agents_trigger ON agents;
DROP TRIGGER IF EXISTS audit_phone_numbers_trigger ON phone_numbers;
DROP TRIGGER IF EXISTS audit_prompts_trigger ON prompts;
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
DROP TRIGGER IF EXISTS audit_projects_trigger ON projects;

\echo 'Step 2: Dropping views...';

DROP VIEW IF EXISTS v_agent_statistics;
DROP VIEW IF EXISTS v_recent_calls;
DROP VIEW IF EXISTS v_daily_call_volume;
DROP VIEW IF EXISTS v_phone_numbers_availability;

\echo 'Step 3: Dropping new tables...';

DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS call_dispositions CASCADE;
DROP TABLE IF EXISTS prompts CASCADE;
DROP TABLE IF EXISTS phone_numbers CASCADE;
DROP TABLE IF EXISTS sso_providers CASCADE;

\echo 'Step 4: Restoring backed up tables...';

-- Restore companies table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables
               WHERE table_schema = 'migration_backup' AND table_name = 'companies_backup') THEN

        -- Drop projects table if it was created
        DROP TABLE IF EXISTS projects CASCADE;

        -- Restore companies
        CREATE TABLE companies AS SELECT * FROM migration_backup.companies_backup;

        -- Recreate primary key and constraints
        ALTER TABLE companies ADD PRIMARY KEY (id);
        CREATE UNIQUE INDEX IF NOT EXISTS companies_domain_key ON companies(domain);
        CREATE UNIQUE INDEX IF NOT EXISTS companies_api_key_key ON companies(api_key);
        CREATE INDEX IF NOT EXISTS idx_companies_api_key ON companies(api_key);

        RAISE NOTICE 'Restored companies table with % rows',
            (SELECT COUNT(*) FROM companies);
    END IF;
END $$;

\echo 'Step 5: Restoring users table...';

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables
               WHERE table_schema = 'migration_backup' AND table_name = 'users_backup') THEN

        -- Store current users that might have been added during migration
        CREATE TEMP TABLE temp_new_users AS
        SELECT * FROM users
        WHERE NOT EXISTS (
            SELECT 1 FROM migration_backup.users_backup ub WHERE ub.id = users.id
        );

        -- Drop current users table
        DROP TABLE IF EXISTS users CASCADE;

        -- Restore from backup
        CREATE TABLE users AS SELECT * FROM migration_backup.users_backup;

        -- Recreate constraints
        ALTER TABLE users ADD PRIMARY KEY (id);
        CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users(email);
        CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users(username);

        -- Restore foreign keys if companies exist
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companies') THEN
            ALTER TABLE users ADD CONSTRAINT users_company_id_fkey
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
        END IF;

        -- Re-insert any new users that were added during migration
        INSERT INTO users SELECT * FROM temp_new_users ON CONFLICT (id) DO NOTHING;

        DROP TABLE temp_new_users;

        RAISE NOTICE 'Restored users table with % rows',
            (SELECT COUNT(*) FROM users);
    END IF;
END $$;

\echo 'Step 6: Restoring agents table...';

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables
               WHERE table_schema = 'migration_backup' AND table_name = 'agents_backup') THEN

        -- Store new agents
        CREATE TEMP TABLE temp_new_agents AS
        SELECT * FROM agents
        WHERE NOT EXISTS (
            SELECT 1 FROM migration_backup.agents_backup ab WHERE ab.id = agents.id
        );

        -- Drop current agents
        DROP TABLE IF EXISTS agents CASCADE;

        -- Restore from backup
        CREATE TABLE agents AS SELECT * FROM migration_backup.agents_backup;

        -- Recreate constraints
        ALTER TABLE agents ADD PRIMARY KEY (id);
        CREATE UNIQUE INDEX IF NOT EXISTS agents_livekit_agent_name_key
            ON agents(livekit_agent_name);

        -- Re-insert new agents
        INSERT INTO agents SELECT * FROM temp_new_agents ON CONFLICT (id) DO NOTHING;

        DROP TABLE temp_new_agents;

        RAISE NOTICE 'Restored agents table with % rows',
            (SELECT COUNT(*) FROM agents);
    END IF;
END $$;

\echo 'Step 7: Restoring call_logs table...';

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables
               WHERE table_schema = 'migration_backup' AND table_name = 'call_logs_backup') THEN

        -- Store new call logs
        CREATE TEMP TABLE temp_new_call_logs AS
        SELECT * FROM call_logs
        WHERE NOT EXISTS (
            SELECT 1 FROM migration_backup.call_logs_backup clb WHERE clb.id = call_logs.id
        );

        -- Drop current call_logs
        DROP TABLE IF EXISTS call_logs CASCADE;

        -- Restore from backup
        CREATE TABLE call_logs AS SELECT * FROM migration_backup.call_logs_backup;

        -- Recreate constraints
        ALTER TABLE call_logs ADD PRIMARY KEY (id);
        CREATE UNIQUE INDEX IF NOT EXISTS call_logs_livekit_room_id_key
            ON call_logs(livekit_room_id);

        -- Restore foreign keys
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agents') THEN
            ALTER TABLE call_logs ADD CONSTRAINT call_logs_agent_id_fkey
                FOREIGN KEY (agent_id) REFERENCES agents(id);
        END IF;

        -- Re-insert new call logs
        INSERT INTO call_logs SELECT * FROM temp_new_call_logs ON CONFLICT (id) DO NOTHING;

        DROP TABLE temp_new_call_logs;

        RAISE NOTICE 'Restored call_logs table with % rows',
            (SELECT COUNT(*) FROM call_logs);
    END IF;
END $$;

\echo 'Step 8: Restoring audit_logs table...';

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables
               WHERE table_schema = 'migration_backup' AND table_name = 'audit_logs_backup') THEN

        -- Keep new audit logs from migration
        CREATE TEMP TABLE temp_migration_audit_logs AS
        SELECT * FROM audit_logs
        WHERE created_at >= (SELECT started_at FROM migration_backup.migration_log
                            WHERE migration_name = '002_forward_migration');

        -- Drop current audit_logs
        DROP TABLE IF EXISTS audit_logs CASCADE;

        -- Restore from backup
        CREATE TABLE audit_logs AS SELECT * FROM migration_backup.audit_logs_backup;

        -- Recreate primary key
        ALTER TABLE audit_logs ADD PRIMARY KEY (id);

        -- Restore foreign keys
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companies') THEN
            ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_company_id_fkey
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
        END IF;

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
            ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id);
        END IF;

        -- Keep migration audit logs
        INSERT INTO audit_logs SELECT * FROM temp_migration_audit_logs ON CONFLICT (id) DO NOTHING;

        DROP TABLE temp_migration_audit_logs;

        RAISE NOTICE 'Restored audit_logs table with % rows',
            (SELECT COUNT(*) FROM audit_logs);
    END IF;
END $$;

\echo 'Step 9: Recreating original indexes...';

-- Recreate original indexes for users
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled);

-- Recreate original indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

\echo 'Step 10: Recreating original triggers...';

-- Recreate update_updated_at function if needed
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that had it
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agents') THEN
    DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
    CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END IF;

IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'call_logs') THEN
    DROP TRIGGER IF EXISTS update_call_logs_updated_at ON call_logs;
    CREATE TRIGGER update_call_logs_updated_at BEFORE UPDATE ON call_logs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END IF;

\echo 'Step 11: Cleaning up migration functions...';

DROP FUNCTION IF EXISTS search_transcripts(TEXT, INT);
DROP FUNCTION IF EXISTS get_available_phone_numbers(VARCHAR);
DROP FUNCTION IF EXISTS audit_table_changes();
DROP FUNCTION IF EXISTS calculate_call_duration();

-- Update migration log
UPDATE migration_backup.migration_log
SET status = 'completed', completed_at = CURRENT_TIMESTAMP
WHERE migration_name = '003_rollback' AND status = 'started';

INSERT INTO migration_backup.migration_log (migration_name, status, notes)
VALUES ('rollback_completed', 'completed', 'Database rolled back to pre-migration state');

\echo '';
\echo '==========================================';
\echo 'ROLLBACK COMPLETED SUCCESSFULLY!';
\echo '==========================================';
\echo '';
\echo 'Database has been restored to pre-migration state';
\echo 'All backup data is still available in migration_backup schema';
\echo '';

-- Display table counts after rollback
SELECT
    CASE
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companies')
        THEN (SELECT COUNT(*) FROM companies)
        ELSE 0
    END AS companies,
    CASE
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')
        THEN (SELECT COUNT(*) FROM users)
        ELSE 0
    END AS users,
    CASE
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agents')
        THEN (SELECT COUNT(*) FROM agents)
        ELSE 0
    END AS agents,
    CASE
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'call_logs')
        THEN (SELECT COUNT(*) FROM call_logs)
        ELSE 0
    END AS call_logs;

COMMIT;

\echo '';
\echo 'Rollback transaction committed.';
\echo '';
\echo 'NOTE: To completely clean up, you may want to drop the migration_backup schema:';
\echo '  DROP SCHEMA migration_backup CASCADE;';
