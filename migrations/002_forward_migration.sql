-- =============================================
-- FORWARD MIGRATION SCRIPT
-- =============================================
-- Migrates from old schema to new schema
--
-- Prerequisites:
--   1. Run 001_pre_migration_backup.sql first
--   2. Ensure you have a database backup
--
-- Usage:
--   psql -h <host> -U <user> -d <database> -f 002_forward_migration.sql
--
-- Changes:
--   - Creates new tables: projects, phone_numbers, prompts, sso_providers
--   - Migrates companies -> projects
--   - Migrates agent data to phone_numbers and prompts
--   - Updates users, agents, call_logs tables
--   - Adds audit triggers
-- =============================================

\echo '==========================================';
\echo 'STARTING FORWARD MIGRATION';
\echo '==========================================';
\echo '';

-- Set timezone
SET timezone = 'UTC';

-- Start transaction
BEGIN;

-- Log migration start
INSERT INTO migration_backup.migration_log (migration_name, status, notes)
VALUES ('002_forward_migration', 'started', 'Forward migration started');

\echo 'Step 1: Creating new tables...';

-- =============================================
-- CREATE PROJECTS TABLE (from companies)
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
    z_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(255),
    sip_url TEXT,
    lk_url TEXT,
    lk_api_key VARCHAR(255) UNIQUE NOT NULL,
    lk_api_secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    address TEXT,
    email VARCHAR(255),
    phone_number_1 VARCHAR(50),
    phone_number_2 VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

\echo 'Step 2: Migrating companies to projects...';

-- Migrate companies to projects if companies table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companies') THEN
        INSERT INTO projects (
            z_id,
            project_id,
            name,
            url,
            lk_api_key,
            lk_api_secret,
            is_active,
            address,
            phone_number_1,
            phone_number_2,
            created_at,
            updated_at
        )
        SELECT
            id,
            COALESCE(domain, 'project-' || id::text) as project_id,
            name,
            NULL as url,
            COALESCE(api_key, 'lk-' || id::text) as lk_api_key,
            'ENCRYPTED_SECRET' as lk_api_secret, -- Replace with actual secret migration
            is_active,
            address,
            phone_number_1,
            phone_number_2,
            created_at,
            updated_at
        FROM companies
        ON CONFLICT (z_id) DO NOTHING;

        RAISE NOTICE 'Migrated % companies to projects', (SELECT COUNT(*) FROM projects);
    END IF;
END $$;

\echo 'Step 3: Creating SSO providers table...';

CREATE TABLE IF NOT EXISTS sso_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    client_id VARCHAR(255) NOT NULL,
    client_secret_encrypted TEXT NOT NULL,
    authorization_url TEXT,
    token_url TEXT,
    user_info_url TEXT,
    is_enabled BOOLEAN DEFAULT true,
    auto_provision_users BOOLEAN DEFAULT false,
    allowed_domains TEXT[],
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sso_providers_enabled ON sso_providers(is_enabled);

\echo 'Step 4: Updating users table...';

-- Add new columns to users table if they don't exist
DO $$
BEGIN
    -- Add SSO columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='sso_provider') THEN
        ALTER TABLE users ADD COLUMN sso_provider VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='sso_provider_id') THEN
        ALTER TABLE users ADD COLUMN sso_provider_id VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='sso_email') THEN
        ALTER TABLE users ADD COLUMN sso_email VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='sso_metadata') THEN
        ALTER TABLE users ADD COLUMN sso_metadata JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='auth_method') THEN
        ALTER TABLE users ADD COLUMN auth_method VARCHAR(20) DEFAULT 'password';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_sso_login_at') THEN
        ALTER TABLE users ADD COLUMN last_sso_login_at TIMESTAMP;
    END IF;

    -- Rename columns if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='company_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ord_project_id') THEN
            ALTER TABLE users RENAME COLUMN company_id TO ord_project_id;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
            ALTER TABLE users RENAME COLUMN password TO password_hash;
        END IF;
    END IF;

    -- Add missing security columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_email_verified') THEN
        ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_verified_at') THEN
        ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login_at') THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login_ip') THEN
        ALTER TABLE users ADD COLUMN last_login_ip INET;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='failed_login_attempts') THEN
        ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='locked_until') THEN
        ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_changed_at') THEN
        ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='deleted_at') THEN
        ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
    END IF;

    -- Update existing users to have password auth method
    UPDATE users SET auth_method = 'password' WHERE auth_method IS NULL;
END $$;

-- Drop old foreign key constraint if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE constraint_name = 'users_company_id_fkey' AND table_name = 'users') THEN
        ALTER TABLE users DROP CONSTRAINT users_company_id_fkey;
    END IF;
END $$;

-- Add new foreign key constraint to projects
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_ord_project_id_fkey;
ALTER TABLE users ADD CONSTRAINT users_ord_project_id_fkey
    FOREIGN KEY (ord_project_id) REFERENCES projects(z_id) ON DELETE SET NULL;

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_active_status ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_sso_provider ON users(sso_provider, sso_provider_id) WHERE sso_provider IS NOT NULL;

\echo 'Step 5: Creating phone_numbers table...';

CREATE TABLE IF NOT EXISTS phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_sid VARCHAR(255),
    trunk_id VARCHAR(255),
    country_code VARCHAR(10),
    number_type VARCHAR(50),
    is_available BOOLEAN DEFAULT true,
    assigned_to_agent_id UUID,
    supports_voice BOOLEAN DEFAULT true,
    supports_sms BOOLEAN DEFAULT false,
    friendly_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_available ON phone_numbers(is_available) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_phone_numbers_provider ON phone_numbers(provider) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_phone_numbers_assigned ON phone_numbers(assigned_to_agent_id) WHERE assigned_to_agent_id IS NOT NULL;

\echo 'Step 6: Creating prompts table...';

CREATE TABLE IF NOT EXISTS prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL,
    greeting_message TEXT,
    system_instructions TEXT,
    end_call_phrases TEXT[],
    enable_interruptions BOOLEAN DEFAULT true,
    silence_timeout_seconds INT DEFAULT 30,
    max_response_length INT,
    response_style VARCHAR(50),
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prompts_agent ON prompts(agent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_prompts_active ON prompts(agent_id, is_active) WHERE is_active = true AND deleted_at IS NULL;

\echo 'Step 7: Migrating agent data to phone_numbers and prompts...';

-- Migrate phone numbers from agents table
DO $$
DECLARE
    agent_rec RECORD;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agents') THEN
        FOR agent_rec IN
            SELECT id, phone_number
            FROM agents
            WHERE phone_number IS NOT NULL AND phone_number != ''
        LOOP
            -- Insert into phone_numbers if not exists
            INSERT INTO phone_numbers (
                phone_number,
                provider,
                provider_sid,
                is_available,
                assigned_to_agent_id,
                friendly_name
            )
            SELECT
                agent_rec.phone_number,
                COALESCE(
                    CASE
                        WHEN EXISTS (SELECT 1 FROM information_schema.columns
                                   WHERE table_name='agents' AND column_name='phone_provider')
                        THEN (SELECT phone_provider FROM agents WHERE id = agent_rec.id)
                        ELSE 'twilio'
                    END, 'twilio'
                ) as provider,
                CASE
                    WHEN EXISTS (SELECT 1 FROM information_schema.columns
                               WHERE table_name='agents' AND column_name='phone_provider_sid')
                    THEN (SELECT phone_provider_sid FROM agents WHERE id = agent_rec.id)
                    ELSE NULL
                END as provider_sid,
                false as is_available, -- Marked as not available since it's assigned
                agent_rec.id as assigned_to_agent_id,
                'Agent Phone: ' || agent_rec.phone_number as friendly_name
            ON CONFLICT (phone_number) DO NOTHING;
        END LOOP;

        RAISE NOTICE 'Migrated % phone numbers from agents',
            (SELECT COUNT(*) FROM phone_numbers WHERE assigned_to_agent_id IS NOT NULL);
    END IF;
END $$;

-- Migrate prompt data from agents table to prompts
DO $$
DECLARE
    agent_rec RECORD;
    greeting_val TEXT;
    end_phrases TEXT[];
    enable_int BOOLEAN;
    silence_timeout INT;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agents') THEN
        FOR agent_rec IN SELECT id FROM agents
        LOOP
            -- Extract prompt fields if they exist
            greeting_val := NULL;
            end_phrases := ARRAY[]::TEXT[];
            enable_int := true;
            silence_timeout := 30;

            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='agents' AND column_name='greeting_message') THEN
                EXECUTE format('SELECT greeting_message FROM agents WHERE id = %L', agent_rec.id)
                INTO greeting_val;
            END IF;

            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='agents' AND column_name='end_call_phrases') THEN
                EXECUTE format('SELECT end_call_phrases FROM agents WHERE id = %L', agent_rec.id)
                INTO end_phrases;
            END IF;

            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='agents' AND column_name='enable_interruptions') THEN
                EXECUTE format('SELECT enable_interruptions FROM agents WHERE id = %L', agent_rec.id)
                INTO enable_int;
            END IF;

            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='agents' AND column_name='silence_timeout_seconds') THEN
                EXECUTE format('SELECT silence_timeout_seconds FROM agents WHERE id = %L', agent_rec.id)
                INTO silence_timeout;
            END IF;

            -- Insert into prompts table
            INSERT INTO prompts (
                agent_id,
                greeting_message,
                end_call_phrases,
                enable_interruptions,
                silence_timeout_seconds,
                is_active,
                version
            ) VALUES (
                agent_rec.id,
                greeting_val,
                end_phrases,
                enable_int,
                silence_timeout,
                true,
                1
            );
        END LOOP;

        RAISE NOTICE 'Created % prompts from agents', (SELECT COUNT(*) FROM prompts);
    END IF;
END $$;

\echo 'Step 8: Updating agents table structure...';

-- Add foreign key constraint from phone_numbers to agents
ALTER TABLE phone_numbers DROP CONSTRAINT IF EXISTS fk_phone_assigned_agent;
ALTER TABLE phone_numbers ADD CONSTRAINT fk_phone_assigned_agent
    FOREIGN KEY (assigned_to_agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- Add foreign key constraint from prompts to agents
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS fk_prompts_agent;
ALTER TABLE prompts ADD CONSTRAINT fk_prompts_agent
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- Drop old columns from agents table
DO $$
BEGIN
    -- Drop phone provider columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='phone_provider') THEN
        ALTER TABLE agents DROP COLUMN phone_provider;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='phone_provider_sid') THEN
        ALTER TABLE agents DROP COLUMN phone_provider_sid;
    END IF;

    -- Drop prompt-related columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='greeting_message') THEN
        ALTER TABLE agents DROP COLUMN greeting_message;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='end_call_phrases') THEN
        ALTER TABLE agents DROP COLUMN end_call_phrases;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='enable_interruptions') THEN
        ALTER TABLE agents DROP COLUMN enable_interruptions;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='silence_timeout_seconds') THEN
        ALTER TABLE agents DROP COLUMN silence_timeout_seconds;
    END IF;

    -- Add deleted_at if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='deleted_at') THEN
        ALTER TABLE agents ADD COLUMN deleted_at TIMESTAMP;
    END IF;
END $$;

\echo 'Step 9: Updating call_logs table structure...';

-- Update call_logs table
DO $$
BEGIN
    -- Add agent_phone column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='agent_phone') THEN
        ALTER TABLE call_logs ADD COLUMN agent_phone VARCHAR(50);
    END IF;

    -- Drop removed columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='livekit_participant_id') THEN
        ALTER TABLE call_logs DROP COLUMN livekit_participant_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='batch_reference') THEN
        ALTER TABLE call_logs DROP COLUMN batch_reference;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='batch_job_id') THEN
        ALTER TABLE call_logs DROP COLUMN batch_job_id;
    END IF;

    -- Drop sentiment and analytics columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='summary') THEN
        ALTER TABLE call_logs DROP COLUMN summary;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='sentiment_status') THEN
        ALTER TABLE call_logs DROP COLUMN sentiment_status;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='sentiment_score') THEN
        ALTER TABLE call_logs DROP COLUMN sentiment_score;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='sentiment_details') THEN
        ALTER TABLE call_logs DROP COLUMN sentiment_details;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='detected_intents') THEN
        ALTER TABLE call_logs DROP COLUMN detected_intents;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='detected_entities') THEN
        ALTER TABLE call_logs DROP COLUMN detected_entities;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='audio_quality_score') THEN
        ALTER TABLE call_logs DROP COLUMN audio_quality_score;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='latency_ms') THEN
        ALTER TABLE call_logs DROP COLUMN latency_ms;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='user_satisfaction_rating') THEN
        ALTER TABLE call_logs DROP COLUMN user_satisfaction_rating;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='user_feedback') THEN
        ALTER TABLE call_logs DROP COLUMN user_feedback;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='connection_region') THEN
        ALTER TABLE call_logs DROP COLUMN connection_region;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='client_ip') THEN
        ALTER TABLE call_logs DROP COLUMN client_ip;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='user_agent') THEN
        ALTER TABLE call_logs DROP COLUMN user_agent;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='error_message') THEN
        ALTER TABLE call_logs DROP COLUMN error_message;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='metadata') THEN
        ALTER TABLE call_logs DROP COLUMN metadata;
    END IF;

    -- Add analysis column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_logs' AND column_name='analysis') THEN
        ALTER TABLE call_logs ADD COLUMN analysis JSONB;
    END IF;
END $$;

-- Update foreign key for call_logs
ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_agent_id_fkey;
ALTER TABLE call_logs ADD CONSTRAINT call_logs_agent_id_fkey
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;

\echo 'Step 10: Creating user_sessions table...';

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    session_type VARCHAR(20) DEFAULT 'password',
    sso_provider VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

\echo 'Step 11: Creating security_events table...';

CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20),
    ip_address INET,
    user_agent TEXT,
    sso_provider VARCHAR(50),
    sso_error TEXT,
    details JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_unresolved ON security_events(resolved) WHERE resolved = false;

\echo 'Step 12: Updating audit_logs table...';

-- Update audit_logs structure if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='user_email') THEN
        ALTER TABLE audit_logs ADD COLUMN user_email VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='user_ip') THEN
        ALTER TABLE audit_logs ADD COLUMN user_ip INET;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='old_values') THEN
        ALTER TABLE audit_logs ADD COLUMN old_values JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='new_values') THEN
        ALTER TABLE audit_logs ADD COLUMN new_values JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='changes') THEN
        ALTER TABLE audit_logs ADD COLUMN changes JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='request_method') THEN
        ALTER TABLE audit_logs ADD COLUMN request_method VARCHAR(10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='request_path') THEN
        ALTER TABLE audit_logs ADD COLUMN request_path TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='session_id') THEN
        ALTER TABLE audit_logs ADD COLUMN session_id VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='sso_provider') THEN
        ALTER TABLE audit_logs ADD COLUMN sso_provider VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='status') THEN
        ALTER TABLE audit_logs ADD COLUMN status VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='error_message') THEN
        ALTER TABLE audit_logs ADD COLUMN error_message TEXT;
    END IF;

    -- Rename columns if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='resource_type') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='entity_type') THEN
            ALTER TABLE audit_logs RENAME COLUMN resource_type TO entity_type;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='resource_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='entity_id') THEN
            ALTER TABLE audit_logs RENAME COLUMN resource_id TO entity_id;
        END IF;
    END IF;

    -- Drop company_id column if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='company_id') THEN
        ALTER TABLE audit_logs DROP COLUMN company_id;
    END IF;
END $$;

\echo 'Step 13: Creating call_dispositions table...';

CREATE TABLE IF NOT EXISTS call_dispositions (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert common dispositions
INSERT INTO call_dispositions (code, label, category, sort_order) VALUES
('COMPLETED', 'Call Completed Successfully', 'success', 1),
('VOICEMAIL', 'Left Voicemail', 'success', 2),
('NO_ANSWER', 'No Answer', 'no_contact', 3),
('BUSY', 'Line Busy', 'no_contact', 4),
('FAILED', 'Call Failed', 'failure', 5),
('WRONG_NUMBER', 'Wrong Number', 'failure', 6),
('TIMEOUT', 'Call Timeout', 'failure', 7),
('USER_HANGUP', 'User Hung Up', 'success', 8),
('ERROR', 'Technical Error', 'failure', 9)
ON CONFLICT (code) DO NOTHING;

\echo 'Step 14: Creating triggers...';

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_sso_providers_updated_at ON sso_providers;
DROP TRIGGER IF EXISTS update_phone_numbers_updated_at ON phone_numbers;
DROP TRIGGER IF EXISTS update_prompts_updated_at ON prompts;
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
DROP TRIGGER IF EXISTS update_call_logs_updated_at ON call_logs;
DROP TRIGGER IF EXISTS update_call_dispositions_updated_at ON call_dispositions;

-- Create triggers
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sso_providers_updated_at BEFORE UPDATE ON sso_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phone_numbers_updated_at BEFORE UPDATE ON phone_numbers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_logs_updated_at BEFORE UPDATE ON call_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_dispositions_updated_at BEFORE UPDATE ON call_dispositions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate call duration
CREATE OR REPLACE FUNCTION calculate_call_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND (OLD.end_time IS NULL OR OLD.end_time != NEW.end_time) THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_duration_trigger ON call_logs;
CREATE TRIGGER calculate_duration_trigger
    BEFORE UPDATE ON call_logs
    FOR EACH ROW EXECUTE FUNCTION calculate_call_duration();

\echo 'Step 15: Creating audit triggers...';

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (
            entity_type,
            entity_id,
            action,
            new_values,
            status
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            'CREATE',
            row_to_json(NEW),
            'success'
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (
            entity_type,
            entity_id,
            action,
            old_values,
            new_values,
            status
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            'UPDATE',
            row_to_json(OLD),
            row_to_json(NEW),
            'success'
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (
            entity_type,
            entity_id,
            action,
            old_values,
            status
        ) VALUES (
            TG_TABLE_NAME,
            OLD.id,
            'DELETE',
            row_to_json(OLD),
            'success'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing audit triggers
DROP TRIGGER IF EXISTS audit_agents_trigger ON agents;
DROP TRIGGER IF EXISTS audit_phone_numbers_trigger ON phone_numbers;
DROP TRIGGER IF EXISTS audit_prompts_trigger ON prompts;
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
DROP TRIGGER IF EXISTS audit_projects_trigger ON projects;

-- Create audit triggers
CREATE TRIGGER audit_agents_trigger
    AFTER INSERT OR UPDATE OR DELETE ON agents
    FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER audit_phone_numbers_trigger
    AFTER INSERT OR UPDATE OR DELETE ON phone_numbers
    FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER audit_prompts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON prompts
    FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER audit_projects_trigger
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

\echo 'Step 16: Creating views...';

-- Drop existing views if they exist
DROP VIEW IF EXISTS v_agent_statistics;
DROP VIEW IF EXISTS v_recent_calls;
DROP VIEW IF EXISTS v_daily_call_volume;
DROP VIEW IF EXISTS v_phone_numbers_availability;
DROP VIEW IF EXISTS v_sentiment_overview;
DROP VIEW IF EXISTS v_calls_needing_attention;

-- Agent performance overview
CREATE VIEW v_agent_statistics AS
SELECT
    a.id,
    a.name,
    a.phone_number,
    a.status,
    COUNT(cl.id) as total_calls,
    COUNT(cl.id) FILTER (WHERE cl.direction = 'inbound') as inbound_calls,
    COUNT(cl.id) FILTER (WHERE cl.direction = 'outbound') as outbound_calls,
    COUNT(cl.id) FILTER (WHERE cl.status = 'completed') as completed_calls,
    AVG(cl.duration_seconds) as avg_call_duration,
    MAX(cl.start_time) as last_call_time
FROM agents a
LEFT JOIN call_logs cl ON a.id = cl.agent_id
WHERE a.deleted_at IS NULL
GROUP BY a.id, a.name, a.phone_number, a.status;

-- Recent calls view
CREATE VIEW v_recent_calls AS
SELECT
    cl.id,
    cl.livekit_room_id,
    cl.direction,
    cl.caller_phone,
    cl.agent_phone,
    cl.start_time,
    cl.end_time,
    cl.duration_seconds,
    cl.status,
    cl.disposition_code,
    a.name as agent_name
FROM call_logs cl
LEFT JOIN agents a ON cl.agent_id = a.id
ORDER BY cl.start_time DESC
LIMIT 100;

-- Daily call volume
CREATE VIEW v_daily_call_volume AS
SELECT
    DATE(start_time) as call_date,
    direction,
    agent_id,
    COUNT(*) as call_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    AVG(duration_seconds) as avg_duration,
    SUM(duration_seconds) as total_duration
FROM call_logs
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(start_time), direction, agent_id
ORDER BY call_date DESC;

-- Phone number availability view
CREATE VIEW v_phone_numbers_availability AS
SELECT
    pn.id,
    pn.phone_number,
    pn.provider,
    pn.is_available,
    pn.assigned_to_agent_id,
    a.name as agent_name,
    pn.friendly_name,
    pn.country_code,
    pn.number_type
FROM phone_numbers pn
LEFT JOIN agents a ON pn.assigned_to_agent_id = a.id
WHERE pn.deleted_at IS NULL
ORDER BY pn.is_available DESC, pn.phone_number;

\echo 'Step 17: Creating helper functions...';

-- Function to search transcripts by keyword
CREATE OR REPLACE FUNCTION search_transcripts(
    p_keyword TEXT,
    p_limit INT DEFAULT 10
)
RETURNS TABLE(
    call_id UUID,
    caller_phone VARCHAR,
    start_time TIMESTAMP,
    agent_name VARCHAR,
    matching_messages TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cl.id,
        cl.caller_phone,
        cl.start_time,
        a.name,
        ARRAY_AGG(turn->>'message') as matching_messages
    FROM call_logs cl
    LEFT JOIN agents a ON cl.agent_id = a.id,
         jsonb_array_elements(cl.transcript) as turn
    WHERE turn->>'message' ILIKE '%' || p_keyword || '%'
    GROUP BY cl.id, cl.caller_phone, cl.start_time, a.name
    ORDER BY cl.start_time DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get available phone numbers
CREATE OR REPLACE FUNCTION get_available_phone_numbers(
    p_provider VARCHAR DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    phone_number VARCHAR,
    provider VARCHAR,
    trunk_id VARCHAR,
    friendly_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pn.id,
        pn.phone_number,
        pn.provider,
        pn.trunk_id,
        pn.friendly_name
    FROM phone_numbers pn
    WHERE pn.is_available = true
        AND pn.deleted_at IS NULL
        AND (p_provider IS NULL OR pn.provider = p_provider)
    ORDER BY pn.created_at DESC;
END;
$$ LANGUAGE plpgsql;

\echo 'Step 18: Adding table comments...';

COMMENT ON TABLE projects IS 'Project configurations';
COMMENT ON TABLE users IS 'User accounts with MFA and SSO support';
COMMENT ON TABLE sso_providers IS 'SSO provider configurations for OAuth integration';
COMMENT ON TABLE phone_numbers IS 'Phone number inventory with provider details and availability tracking';
COMMENT ON TABLE prompts IS 'Agent prompts and conversation behavior settings';
COMMENT ON TABLE agents IS 'Voice agent configurations';
COMMENT ON TABLE call_logs IS 'Call logs with basic stats, transcripts, and analysis';
COMMENT ON TABLE audit_logs IS 'System-wide audit trail';
COMMENT ON TABLE user_sessions IS 'Active user sessions';
COMMENT ON TABLE security_events IS 'Security-related events and alerts';
COMMENT ON TABLE call_dispositions IS 'Standard call outcome codes';

COMMENT ON COLUMN users.auth_method IS 'password = local auth only, sso = SSO only, both = can use either';
COMMENT ON COLUMN users.sso_provider IS 'SSO provider: google, microsoft, okta, auth0, azure_ad, etc.';
COMMENT ON COLUMN phone_numbers.is_available IS 'Whether the phone number is available for assignment';
COMMENT ON COLUMN phone_numbers.provider_sid IS 'Provider-specific identifier (e.g., Twilio SID)';
COMMENT ON COLUMN phone_numbers.trunk_id IS 'SIP trunk identifier for routing';
COMMENT ON COLUMN prompts.agent_id IS 'Agent this prompt belongs to';
COMMENT ON COLUMN prompts.is_active IS 'Only one prompt should be active per agent at a time';
COMMENT ON COLUMN agents.phone_number IS 'Phone number assigned to this agent (denormalized for quick access)';
COMMENT ON COLUMN call_logs.transcript IS 'Full conversation transcript as JSON array';
COMMENT ON COLUMN call_logs.analysis IS 'AI-generated call analysis and insights';

-- Update migration log
UPDATE migration_backup.migration_log
SET status = 'completed', completed_at = CURRENT_TIMESTAMP
WHERE migration_name = '002_forward_migration' AND status = 'started';

\echo '';
\echo '==========================================';
\echo 'MIGRATION COMPLETED SUCCESSFULLY!';
\echo '==========================================';
\echo '';
\echo 'Summary of changes:';
\echo '  - Created projects table and migrated from companies';
\echo '  - Created phone_numbers table';
\echo '  - Created prompts table';
\echo '  - Created sso_providers table';
\echo '  - Created user_sessions table';
\echo '  - Created security_events table';
\echo '  - Updated users table with SSO support';
\echo '  - Updated agents table (removed phone provider and prompt fields)';
\echo '  - Simplified call_logs table';
\echo '  - Added audit triggers to all main tables';
\echo '  - Created views and helper functions';
\echo '';

-- Display final counts
SELECT
    (SELECT COUNT(*) FROM projects) as projects,
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM agents) as agents,
    (SELECT COUNT(*) FROM phone_numbers) as phone_numbers,
    (SELECT COUNT(*) FROM prompts) as prompts,
    (SELECT COUNT(*) FROM call_logs) as call_logs;

-- Commit transaction
COMMIT;

\echo '';
\echo 'Transaction committed. Migration complete!';
