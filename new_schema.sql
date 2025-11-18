-- =============================================
-- CORE TABLES
-- =============================================
CREATE TABLE org_projects (
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

-- 1. USERS (with MFA and SSO)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Nullable for SSO-only users,
    org_project_id UUID REFERENCES org_projects(z_id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'Read', CHECK (role IN ('Admin', 'Read', 'Write')),

    full_name VARCHAR(255),
    username VARCHAR(100) UNIQUE,
    image TEXT,
    bio TEXT,
    phone_number VARCHAR(50),

    -- MFA
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255), -- Encrypted TOTP secret
    mfa_backup_codes TEXT[], -- Array of encrypted backup codes
    mfa_enabled_at TIMESTAMP,

    -- SSO (Single Sign-On)
    sso_provider VARCHAR(50), -- 'google', 'microsoft', 'okta', 'auth0', 'azure_ad', etc.
    sso_provider_id VARCHAR(255), -- Unique user ID from SSO provider
    sso_email VARCHAR(255), -- Email from SSO provider (might differ from main email)
    sso_metadata JSONB, -- Additional SSO profile data
    /*
    Example sso_metadata:
    {
        "provider_name": "Google",
        "picture": "https://...",
        "locale": "en",
        "email_verified": true
    }
    */

    -- Authentication method tracking
    auth_method VARCHAR(20) DEFAULT 'password', -- 'password', 'sso', 'both'
    last_sso_login_at TIMESTAMP,

    -- Security
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip INET,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP,
    password_changed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    -- Constraints
    CONSTRAINT check_auth_method CHECK (
        (auth_method = 'password' AND password_hash IS NOT NULL) OR
        (auth_method = 'sso' AND sso_provider IS NOT NULL) OR
        (auth_method = 'both')
    )
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_sso_provider ON users(sso_provider, sso_provider_id) WHERE sso_provider IS NOT NULL;

-- SSO provider configurations (optional - if you want to manage multiple SSO providers)
CREATE TABLE sso_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(50) UNIQUE NOT NULL, -- 'google', 'microsoft', etc.
    display_name VARCHAR(255),

    -- OAuth configuration
    client_id VARCHAR(255) NOT NULL,
    client_secret_encrypted TEXT NOT NULL,
    authorization_url TEXT,
    token_url TEXT,
    user_info_url TEXT,

    -- Settings
    is_enabled BOOLEAN DEFAULT true,
    auto_provision_users BOOLEAN DEFAULT false, -- Auto-create user on first SSO login
    allowed_domains TEXT[], -- Restrict to specific email domains

    -- Metadata
    config JSONB, -- Additional provider-specific config

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sso_providers_enabled ON sso_providers(is_enabled);

-- =============================================
-- PHONE NUMBERS TABLE
-- =============================================
CREATE TABLE phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    -- Number details
    country_code VARCHAR(10),
    number_type VARCHAR(50), -- 'local', 'toll-free', 'mobile'
    -- Provider information
    provider VARCHAR(50) NOT NULL, -- 'twilio', 'vonage', etc.
    provider_sid VARCHAR(255), -- Provider's unique identifier for this number
    trunk_id VARCHAR(255), -- SIP trunk identifier

    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    assigned_to_agent_id UUID, -- Will be referenced to agents table

    -- Capabilities
    supports_voice BOOLEAN DEFAULT true,
    supports_sms BOOLEAN DEFAULT false,

    -- Metadata
    friendly_name VARCHAR(255),
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_phone_numbers_available ON phone_numbers(is_available) WHERE deleted_at IS NULL;
CREATE INDEX idx_phone_numbers_provider ON phone_numbers(provider) WHERE deleted_at IS NULL;
CREATE INDEX idx_phone_numbers_assigned ON phone_numbers(assigned_to_agent_id) WHERE assigned_to_agent_id IS NOT NULL;

-- =============================================
-- PROMPTS TABLE
-- =============================================
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL, -- Will be referenced to agents table

    -- Prompt content
    greeting_message TEXT,
    system_instructions TEXT,

    -- Conversation behavior
    end_call_phrases TEXT[], -- Phrases that trigger call end
    enable_interruptions BOOLEAN DEFAULT true,
    silence_timeout_seconds INT DEFAULT 30,

    -- Response configuration
    max_response_length INT,
    response_style VARCHAR(50), -- 'formal', 'casual', 'professional'

    -- Active version control
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_prompts_agent ON prompts(agent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_prompts_active ON prompts(agent_id, is_active) WHERE is_active = true AND deleted_at IS NULL;

-- 2. AGENTS (Voice Agent Configurations)
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Phone number for this agent (reference only)
    phone_number VARCHAR(50), -- Stored here for quick reference

    -- LiveKit identifier
    livekit_agent_name VARCHAR(255) UNIQUE NOT NULL,

    -- Voice configuration
    voice_provider VARCHAR(50), -- 'elevenlabs', 'azure', 'openai'
    voice_id VARCHAR(255),
    language VARCHAR(10) DEFAULT 'en-US',

    -- LLM configuration
    llm_provider VARCHAR(50), -- 'openai', 'anthropic', 'azure'
    llm_model VARCHAR(100),
    system_prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INT DEFAULT 1000,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'testing'
    is_phone_active BOOLEAN DEFAULT true, -- Whether phone number is active for inbound

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_agents_name ON agents(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_status ON agents(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_phone ON agents(phone_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_livekit_name ON agents(livekit_agent_name) WHERE deleted_at IS NULL;

-- Add foreign key constraint from phone_numbers to agents
ALTER TABLE phone_numbers ADD CONSTRAINT fk_phone_assigned_agent
    FOREIGN KEY (assigned_to_agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- Add foreign key constraint from prompts to agents
ALTER TABLE prompts ADD CONSTRAINT fk_prompts_agent
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- 3. CALL LOGS (Simplified with Basic Stats)
CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- LiveKit identifiers
    livekit_room_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) UNIQUE,

    -- Agent used
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

    -- Call direction and phone info
    direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
    caller_phone VARCHAR(50) NOT NULL, -- The other party's phone number
    agent_phone VARCHAR(50), -- Phone number used by agent

    -- Call timing
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_seconds INT,

    -- Call status
    status VARCHAR(50), -- 'initiated', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy'
    disconnect_reason VARCHAR(100), -- 'user_hangup', 'agent_hangup', 'timeout', 'error', 'completed'

    -- Call disposition (outcome)
    disposition_code VARCHAR(50), -- 'COMPLETED', 'VOICEMAIL', 'NO_ANSWER', 'BUSY', etc.
    disposition_notes TEXT,

    -- ============================================
    -- TRANSCRIPT & ANALYSIS
    -- ============================================
    transcript JSONB, -- Full conversation transcript as JSON array
    analysis JSONB, -- AI-generated call analysis

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_call_logs_agent ON call_logs(agent_id);
CREATE INDEX idx_call_logs_direction ON call_logs(direction);
CREATE INDEX idx_call_logs_status ON call_logs(status);
CREATE INDEX idx_call_logs_start_time ON call_logs(start_time DESC);
CREATE INDEX idx_call_logs_livekit_room ON call_logs(livekit_room_id);
CREATE INDEX idx_call_logs_session_id ON call_logs(session_id);
CREATE INDEX idx_call_logs_disposition ON call_logs(disposition_code);
CREATE INDEX idx_call_logs_caller_phone ON call_logs(caller_phone);

-- GIN indexes for JSONB searching
CREATE INDEX idx_call_logs_transcript ON call_logs USING gin(transcript);
CREATE INDEX idx_call_logs_analysis ON call_logs USING gin(analysis);

-- =============================================
-- AUDIT & LOGGING
-- =============================================

-- 4. AUDIT LOGS (System-wide changes)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    user_ip INET,

    -- What
    action VARCHAR(100) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'SSO_LOGIN', etc.
    entity_type VARCHAR(100) NOT NULL, -- 'agent', 'user', 'call_log', 'phone_number', 'prompt'
    entity_id UUID,

    -- Details
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    changes JSONB, -- Specific fields changed

    -- Context
    request_method VARCHAR(10),
    request_path TEXT,
    user_agent TEXT,
    session_id VARCHAR(255),

    -- SSO specific
    sso_provider VARCHAR(50),

    -- Result
    status VARCHAR(20), -- 'success', 'failure'
    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_sso ON audit_logs(sso_provider) WHERE sso_provider IS NOT NULL;

-- =============================================
-- SECURITY
-- =============================================

-- 5. USER SESSIONS (supports both password and SSO sessions)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,

    -- Session type
    session_type VARCHAR(20) DEFAULT 'password', -- 'password', 'sso'
    sso_provider VARCHAR(50), -- If SSO session

    ip_address INET,
    user_agent TEXT,
    device_info JSONB,

    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- 6. SECURITY EVENTS
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),

    event_type VARCHAR(100) NOT NULL, -- 'failed_login', 'mfa_enabled', 'password_reset', 'suspicious_activity', 'sso_login_failed'
    severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'

    ip_address INET,
    user_agent TEXT,

    -- SSO specific
    sso_provider VARCHAR(50),
    sso_error TEXT,

    details JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_created ON security_events(created_at DESC);
CREATE INDEX idx_security_events_unresolved ON security_events(resolved) WHERE resolved = false;

-- =============================================
-- REFERENCE DATA
-- =============================================

-- 7. CALL DISPOSITIONS (Standard outcomes)
CREATE TABLE call_dispositions (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'success', 'failure', 'no_contact'

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
('ERROR', 'Technical Error', 'failure', 9);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_org_projects_updated_at BEFORE UPDATE ON org_projects
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

-- Calculate call duration when call ends
CREATE OR REPLACE FUNCTION calculate_call_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND (OLD.end_time IS NULL OR OLD.end_time != NEW.end_time) THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_duration_trigger
    BEFORE UPDATE ON call_logs
    FOR EACH ROW EXECUTE FUNCTION calculate_call_duration();

-- Audit trigger function for all tables
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

-- Apply audit triggers to main tables
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

CREATE TRIGGER audit_org_projects_trigger
    AFTER INSERT OR UPDATE OR DELETE ON org_projects
    FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

-- =============================================
-- VIEWS FOR ANALYTICS
-- =============================================

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

-- =============================================
-- USEFUL FUNCTIONS
-- =============================================

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

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE org_projects IS 'Organization project configurations';
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
