-- =============================================
-- POST-MIGRATION VALIDATION SCRIPT
-- =============================================
-- Validates the migration was successful
--
-- Usage:
--   psql -h <host> -U <user> -d <database> -f 004_post_migration_validation.sql
-- =============================================

\echo '==========================================';
\echo 'POST-MIGRATION VALIDATION';
\echo '==========================================';
\echo '';

-- Create validation results table
CREATE TEMP TABLE validation_results (
    check_name VARCHAR(255),
    status VARCHAR(20),
    details TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

\echo 'Running validation checks...';
\echo '';

-- =============================================
-- CHECK 1: Table Existence
-- =============================================
\echo '1. Checking table existence...';

DO $$
DECLARE
    tables_ok BOOLEAN := true;
BEGIN
    -- Check projects table
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projects') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Table: projects', 'FAIL', 'Table does not exist');
        tables_ok := false;
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Table: projects', 'PASS', 'Table exists');
    END IF;

    -- Check phone_numbers table
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'phone_numbers') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Table: phone_numbers', 'FAIL', 'Table does not exist');
        tables_ok := false;
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Table: phone_numbers', 'PASS', 'Table exists');
    END IF;

    -- Check prompts table
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prompts') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Table: prompts', 'FAIL', 'Table does not exist');
        tables_ok := false;
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Table: prompts', 'PASS', 'Table exists');
    END IF;

    -- Check sso_providers table
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sso_providers') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Table: sso_providers', 'FAIL', 'Table does not exist');
        tables_ok := false;
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Table: sso_providers', 'PASS', 'Table exists');
    END IF;

    -- Check user_sessions table
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Table: user_sessions', 'FAIL', 'Table does not exist');
        tables_ok := false;
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Table: user_sessions', 'PASS', 'Table exists');
    END IF;

    -- Check security_events table
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_events') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Table: security_events', 'FAIL', 'Table does not exist');
        tables_ok := false;
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Table: security_events', 'PASS', 'Table exists');
    END IF;

    IF tables_ok THEN
        RAISE NOTICE 'All required tables exist';
    END IF;
END $$;

-- =============================================
-- CHECK 2: Column Existence
-- =============================================
\echo '2. Checking required columns...';

DO $$
BEGIN
    -- Check users table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ord_project_id') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column: users.ord_project_id', 'FAIL', 'Column missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column: users.ord_project_id', 'PASS', 'Column exists');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='sso_provider') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column: users.sso_provider', 'FAIL', 'Column missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column: users.sso_provider', 'PASS', 'Column exists');
    END IF;

    -- Check phone_numbers columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='phone_numbers' AND column_name='provider_sid') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column: phone_numbers.provider_sid', 'FAIL', 'Column missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column: phone_numbers.provider_sid', 'PASS', 'Column exists');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='phone_numbers' AND column_name='trunk_id') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column: phone_numbers.trunk_id', 'FAIL', 'Column missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column: phone_numbers.trunk_id', 'PASS', 'Column exists');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='phone_numbers' AND column_name='is_available') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column: phone_numbers.is_available', 'FAIL', 'Column missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column: phone_numbers.is_available', 'PASS', 'Column exists');
    END IF;

    -- Check call_logs doesn't have removed columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='sentiment_status') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column Removal: call_logs.sentiment_status', 'FAIL', 'Column should have been removed');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column Removal: call_logs.sentiment_status', 'PASS', 'Column removed');
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='batch_reference') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column Removal: call_logs.batch_reference', 'FAIL', 'Column should have been removed');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column Removal: call_logs.batch_reference', 'PASS', 'Column removed');
    END IF;

    -- Check agents doesn't have removed columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='phone_provider') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column Removal: agents.phone_provider', 'FAIL', 'Column should have been removed');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column Removal: agents.phone_provider', 'PASS', 'Column removed');
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='greeting_message') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column Removal: agents.greeting_message', 'FAIL', 'Column should have been removed');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Column Removal: agents.greeting_message', 'PASS', 'Column removed');
    END IF;
END $$;

-- =============================================
-- CHECK 3: Foreign Key Constraints
-- =============================================
\echo '3. Checking foreign key constraints...';

DO $$
BEGIN
    -- Check users -> projects FK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'users'
        AND constraint_name LIKE '%project%'
    ) THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('FK: users -> projects', 'FAIL', 'Foreign key missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('FK: users -> projects', 'PASS', 'Foreign key exists');
    END IF;

    -- Check phone_numbers -> agents FK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'phone_numbers'
        AND constraint_name LIKE '%agent%'
    ) THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('FK: phone_numbers -> agents', 'FAIL', 'Foreign key missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('FK: phone_numbers -> agents', 'PASS', 'Foreign key exists');
    END IF;

    -- Check prompts -> agents FK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'prompts'
        AND constraint_name LIKE '%agent%'
    ) THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('FK: prompts -> agents', 'FAIL', 'Foreign key missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('FK: prompts -> agents', 'PASS', 'Foreign key exists');
    END IF;
END $$;

-- =============================================
-- CHECK 4: Indexes
-- =============================================
\echo '4. Checking indexes...';

DO $$
BEGIN
    -- Check phone_numbers indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'phone_numbers'
        AND indexname LIKE '%available%'
    ) THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Index: phone_numbers.is_available', 'FAIL', 'Index missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Index: phone_numbers.is_available', 'PASS', 'Index exists');
    END IF;

    -- Check prompts indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'prompts'
        AND indexname LIKE '%agent%'
    ) THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Index: prompts.agent_id', 'FAIL', 'Index missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Index: prompts.agent_id', 'PASS', 'Index exists');
    END IF;
END $$;

-- =============================================
-- CHECK 5: Triggers
-- =============================================
\echo '5. Checking triggers...';

DO $$
BEGIN
    -- Check updated_at triggers
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE event_object_table = 'projects'
        AND trigger_name LIKE '%updated_at%'
    ) THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Trigger: projects updated_at', 'FAIL', 'Trigger missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Trigger: projects updated_at', 'PASS', 'Trigger exists');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE event_object_table = 'phone_numbers'
        AND trigger_name LIKE '%updated_at%'
    ) THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Trigger: phone_numbers updated_at', 'FAIL', 'Trigger missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Trigger: phone_numbers updated_at', 'PASS', 'Trigger exists');
    END IF;

    -- Check audit triggers
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE event_object_table = 'agents'
        AND trigger_name LIKE '%audit%'
    ) THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Trigger: agents audit', 'FAIL', 'Audit trigger missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Trigger: agents audit', 'PASS', 'Audit trigger exists');
    END IF;
END $$;

-- =============================================
-- CHECK 6: Views
-- =============================================
\echo '6. Checking views...';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_agent_statistics') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('View: v_agent_statistics', 'FAIL', 'View missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('View: v_agent_statistics', 'PASS', 'View exists');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_phone_numbers_availability') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('View: v_phone_numbers_availability', 'FAIL', 'View missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('View: v_phone_numbers_availability', 'PASS', 'View exists');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_recent_calls') THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('View: v_recent_calls', 'FAIL', 'View missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('View: v_recent_calls', 'PASS', 'View exists');
    END IF;
END $$;

-- =============================================
-- CHECK 7: Functions
-- =============================================
\echo '7. Checking functions...';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_name = 'search_transcripts'
    ) THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Function: search_transcripts', 'FAIL', 'Function missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Function: search_transcripts', 'PASS', 'Function exists');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_name = 'get_available_phone_numbers'
    ) THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Function: get_available_phone_numbers', 'FAIL', 'Function missing');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Function: get_available_phone_numbers', 'PASS', 'Function exists');
    END IF;
END $$;

-- =============================================
-- CHECK 8: Data Migration
-- =============================================
\echo '8. Checking data migration...';

DO $$
DECLARE
    backup_count INT;
    current_count INT;
BEGIN
    -- Compare projects count with backup companies
    IF EXISTS (SELECT FROM information_schema.tables
               WHERE table_schema = 'migration_backup' AND table_name = 'companies_backup') THEN
        SELECT COUNT(*) INTO backup_count FROM migration_backup.companies_backup;
        SELECT COUNT(*) INTO current_count FROM projects;

        IF current_count < backup_count THEN
            INSERT INTO validation_results (check_name, status, details)
            VALUES ('Data: companies -> projects',
                   'WARN',
                   format('Backup: %s, Current: %s', backup_count, current_count));
        ELSE
            INSERT INTO validation_results (check_name, status, details)
            VALUES ('Data: companies -> projects',
                   'PASS',
                   format('All %s records migrated', current_count));
        END IF;
    END IF;

    -- Check prompts were created for agents
    SELECT COUNT(*) INTO current_count FROM prompts;
    IF current_count = 0 THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Data: prompts created', 'WARN', 'No prompts found');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Data: prompts created', 'PASS', format('%s prompts created', current_count));
    END IF;

    -- Check phone_numbers migration
    SELECT COUNT(*) INTO current_count FROM phone_numbers WHERE assigned_to_agent_id IS NOT NULL;
    IF current_count = 0 THEN
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Data: phone_numbers migrated', 'INFO', 'No phone numbers assigned to agents');
    ELSE
        INSERT INTO validation_results (check_name, status, details)
        VALUES ('Data: phone_numbers migrated', 'PASS',
               format('%s phone numbers migrated', current_count));
    END IF;
END $$;

-- =============================================
-- CHECK 9: Row Counts
-- =============================================
\echo '9. Checking table row counts...';

INSERT INTO validation_results (check_name, status, details)
SELECT
    'Row Count: projects',
    'INFO',
    format('%s rows', COUNT(*))
FROM projects;

INSERT INTO validation_results (check_name, status, details)
SELECT
    'Row Count: users',
    'INFO',
    format('%s rows', COUNT(*))
FROM users;

INSERT INTO validation_results (check_name, status, details)
SELECT
    'Row Count: agents',
    'INFO',
    format('%s rows', COUNT(*))
FROM agents;

INSERT INTO validation_results (check_name, status, details)
SELECT
    'Row Count: phone_numbers',
    'INFO',
    format('%s rows', COUNT(*))
FROM phone_numbers;

INSERT INTO validation_results (check_name, status, details)
SELECT
    'Row Count: prompts',
    'INFO',
    format('%s rows', COUNT(*))
FROM prompts;

INSERT INTO validation_results (check_name, status, details)
SELECT
    'Row Count: call_logs',
    'INFO',
    format('%s rows', COUNT(*))
FROM call_logs;

-- =============================================
-- DISPLAY RESULTS
-- =============================================
\echo '';
\echo '==========================================';
\echo 'VALIDATION RESULTS';
\echo '==========================================';
\echo '';

-- Show all results
SELECT
    check_name,
    status,
    details
FROM validation_results
ORDER BY
    CASE status
        WHEN 'FAIL' THEN 1
        WHEN 'WARN' THEN 2
        WHEN 'PASS' THEN 3
        WHEN 'INFO' THEN 4
    END,
    check_name;

-- Summary
\echo '';
\echo '==========================================';
\echo 'SUMMARY';
\echo '==========================================';

SELECT
    status,
    COUNT(*) as count
FROM validation_results
GROUP BY status
ORDER BY
    CASE status
        WHEN 'FAIL' THEN 1
        WHEN 'WARN' THEN 2
        WHEN 'PASS' THEN 3
        WHEN 'INFO' THEN 4
    END;

\echo '';

-- Overall result
DO $$
DECLARE
    fail_count INT;
    warn_count INT;
BEGIN
    SELECT COUNT(*) INTO fail_count FROM validation_results WHERE status = 'FAIL';
    SELECT COUNT(*) INTO warn_count FROM validation_results WHERE status = 'WARN';

    IF fail_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '==========================================';
        RAISE NOTICE 'VALIDATION FAILED!';
        RAISE NOTICE '==========================================';
        RAISE NOTICE '% critical issues found', fail_count;
        RAISE NOTICE 'Please review failures and consider rollback';
    ELSIF warn_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '==========================================';
        RAISE NOTICE 'VALIDATION PASSED WITH WARNINGS';
        RAISE NOTICE '==========================================';
        RAISE NOTICE '% warnings found', warn_count;
        RAISE NOTICE 'Review warnings but migration likely successful';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '==========================================';
        RAISE NOTICE 'VALIDATION PASSED!';
        RAISE NOTICE '==========================================';
        RAISE NOTICE 'Migration completed successfully';
        RAISE NOTICE 'All checks passed';
    END IF;
END $$;

\echo '';
\echo 'Validation complete!';
