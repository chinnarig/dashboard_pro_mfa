-- =============================================
-- TEST DATA FOR DASHBOARD PRO MFA
-- =============================================
-- This script creates test data for all tables
-- Run after executing new_schema.sql
-- =============================================

-- Clear existing test data (if any)
DELETE FROM user_sessions;
DELETE FROM security_events;
DELETE FROM audit_logs;
DELETE FROM call_logs;
DELETE FROM prompts;
DELETE FROM phone_numbers;
DELETE FROM agents;
DELETE FROM users;
-- DELETE FROM sso_providers; -- Skipping for now
DELETE FROM org_projects;

-- =============================================
-- 1. ORGANIZATION PROJECTS
-- =============================================
INSERT INTO org_projects (
    z_id, project_id, name, url, sip_url, lk_url, 
    lk_api_key, lk_api_secret, is_active, 
    address, email, phone_number_1, phone_number_2
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'acme-corp-001',
    'Acme Corporation',
    'https://acme.com',
    'sip:acme@voip.provider.com',
    'wss://livekit.acme.com',
    'APIkey-acme-2024-001',
    'secret-acme-livekit-key-001',
    true,
    '123 Main St, San Francisco, CA 94105',
    'contact@acme.com',
    '+1-415-555-0100',
    '+1-415-555-0101'
),
(
    '22222222-2222-2222-2222-222222222222',
    'techstart-002',
    'TechStart Solutions',
    'https://techstart.io',
    'sip:techstart@voip.provider.com',
    'wss://livekit.techstart.io',
    'APIkey-techstart-2024-002',
    'secret-techstart-livekit-key-002',
    true,
    '456 Innovation Way, Austin, TX 78701',
    'hello@techstart.io',
    '+1-512-555-0200',
    NULL
);

-- =============================================
-- 2. SSO PROVIDERS (Optional) - SKIPPED FOR NOW
-- =============================================
-- INSERT INTO sso_providers (
--     id, provider_name, display_name, 
--     client_id, client_secret_encrypted, 
--     authorization_url, token_url, user_info_url,
--     is_enabled, auto_provision_users, allowed_domains
-- ) VALUES
-- (
--     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
--     'google',
--     'Google Workspace',
--     'google-client-id-123456',
--     'encrypted-google-secret-abc123',
--     'https://accounts.google.com/o/oauth2/v2/auth',
--     'https://oauth2.googleapis.com/token',
--     'https://www.googleapis.com/oauth2/v2/userinfo',
--     true,
--     true,
--     ARRAY['acme.com', 'techstart.io']
-- );

-- =============================================
-- 3. USERS (with various roles and MFA settings)
-- =============================================

-- Admin user with MFA enabled
INSERT INTO users (
    id, email, password_hash, org_project_id, role,
    full_name, username, phone_number,
    mfa_enabled, mfa_secret, mfa_backup_codes,
    auth_method, is_active, is_email_verified, email_verified_at
) VALUES
(
    '33333333-3333-3333-3333-333333333333',
    'admin@acme.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lkW3Z8xK1qXW', -- Password: Admin@123
    '11111111-1111-1111-1111-111111111111',
    'Admin',
    'John Admin',
    'johnadmin',
    '+1-415-555-1001',
    true,
    'JBSWY3DPEHPK3PXP', -- Example TOTP secret (base32)
    ARRAY['BACKUP-CODE-1111', 'BACKUP-CODE-2222', 'BACKUP-CODE-3333'],
    'password',
    true,
    true,
    NOW() - INTERVAL '30 days'
);

-- Write user without MFA
INSERT INTO users (
    id, email, password_hash, org_project_id, role,
    full_name, username, phone_number,
    mfa_enabled, auth_method, is_active, is_email_verified, email_verified_at
) VALUES
(
    '44444444-4444-4444-4444-444444444444',
    'writer@acme.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lkW3Z8xK1qXW', -- Password: Writer@123
    '11111111-1111-1111-1111-111111111111',
    'Write',
    'Jane Writer',
    'janewriter',
    '+1-415-555-1002',
    false,
    'password',
    true,
    true,
    NOW() - INTERVAL '20 days'
);

-- Read-only user
INSERT INTO users (
    id, email, password_hash, org_project_id, role,
    full_name, username, phone_number,
    mfa_enabled, auth_method, is_active, is_email_verified, email_verified_at
) VALUES
(
    '55555555-5555-5555-5555-555555555555',
    'reader@acme.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lkW3Z8xK1qXW', -- Password: Reader@123
    '11111111-1111-1111-1111-111111111111',
    'Read',
    'Bob Reader',
    'bobreader',
    '+1-415-555-1003',
    false,
    'password',
    true,
    true,
    NOW() - INTERVAL '10 days'
);

-- SSO user (Google) - SKIPPED FOR NOW
-- INSERT INTO users (
--     id, email, org_project_id, role,
--     full_name, username,
--     sso_provider, sso_provider_id, sso_email, sso_metadata,
--     auth_method, is_active, is_email_verified, email_verified_at, last_sso_login_at
-- ) VALUES
-- (
--     '66666666-6666-6666-6666-666666666666',
--     'sso.user@acme.com',
--     '11111111-1111-1111-1111-111111111111',
--     'Write',
--     'Sarah SSO User',
--     'sarahsso',
--     'google',
--     'google-id-123456789',
--     'sso.user@acme.com',
--     '{"provider_name": "Google", "picture": "https://lh3.googleusercontent.com/a/default-user", "locale": "en", "email_verified": true}',
--     'sso',
--     true,
--     true,
--     NOW() - INTERVAL '5 days',
--     NOW() - INTERVAL '1 hour'
-- );

-- TechStart Admin
INSERT INTO users (
    id, email, password_hash, org_project_id, role,
    full_name, username, phone_number,
    mfa_enabled, auth_method, is_active, is_email_verified, email_verified_at
) VALUES
(
    '77777777-7777-7777-7777-777777777777',
    'admin@techstart.io',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lkW3Z8xK1qXW', -- Password: TechAdmin@123
    '22222222-2222-2222-2222-222222222222',
    'Admin',
    'Mike TechStart',
    'miketech',
    '+1-512-555-2001',
    false,
    'password',
    true,
    true,
    NOW() - INTERVAL '15 days'
);

-- =============================================
-- 4. AGENTS (Voice Agents)
-- =============================================

INSERT INTO agents (
    id, name, description, phone_number,
    livekit_agent_name,
    voice_provider, voice_id, language,
    llm_provider, llm_model, system_prompt,
    temperature, max_tokens,
    status, is_phone_active
) VALUES
(
    '88888888-8888-8888-8888-888888888888',
    'Customer Support Agent',
    'Handles general customer inquiries and support requests',
    '+1-415-555-8001',
    'acme-support-agent-001',
    'elevenlabs',
    'voice-id-adam-123',
    'en-US',
    'openai',
    'gpt-4',
    'You are a helpful customer support agent for Acme Corporation. Be professional, friendly, and assist customers with their inquiries.',
    0.7,
    1000,
    'active',
    true
),
(
    '99999999-9999-9999-9999-999999999999',
    'Sales Agent',
    'Handles sales inquiries and product information',
    '+1-415-555-8002',
    'acme-sales-agent-001',
    'elevenlabs',
    'voice-id-bella-456',
    'en-US',
    'openai',
    'gpt-4',
    'You are an enthusiastic sales agent for Acme Corporation. Help customers understand our products and services.',
    0.8,
    1200,
    'active',
    true
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
    'Tech Support Agent',
    'Provides technical support and troubleshooting',
    '+1-512-555-8003',
    'techstart-support-agent-001',
    'azure',
    'azure-voice-en-us-jenny',
    'en-US',
    'anthropic',
    'claude-3-opus',
    'You are a technical support specialist. Help users troubleshoot technical issues with patience and clarity.',
    0.6,
    1500,
    'active',
    true
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Testing Agent',
    'Agent for testing purposes',
    '+1-415-555-8999',
    'test-agent-001',
    'openai',
    'openai-voice-alloy',
    'en-US',
    'openai',
    'gpt-3.5-turbo',
    'You are a testing agent. Respond briefly for testing purposes.',
    0.5,
    500,
    'testing',
    false
);

-- =============================================
-- 5. PHONE NUMBERS
-- =============================================

INSERT INTO phone_numbers (
    id, phone_number, provider, provider_sid, trunk_id,
    country_code, number_type,
    is_available, assigned_to_agent_id,
    supports_voice, supports_sms,
    friendly_name
) VALUES
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '+1-415-555-8001',
    'twilio',
    'PN1234567890abcdef1234567890abcdef',
    'trunk-acme-001',
    '+1',
    'local',
    false,
    '88888888-8888-8888-8888-888888888888',
    true,
    true,
    'Acme Support Line'
),
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '+1-415-555-8002',
    'twilio',
    'PN2234567890abcdef1234567890abcdef',
    'trunk-acme-001',
    '+1',
    'local',
    false,
    '99999999-9999-9999-9999-999999999999',
    true,
    true,
    'Acme Sales Line'
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '+1-512-555-8003',
    'vonage',
    'VN3234567890abcdef1234567890abcdef',
    'trunk-techstart-001',
    '+1',
    'local',
    false,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
    true,
    false,
    'TechStart Support'
),
(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '+1-415-555-8999',
    'twilio',
    'PN4234567890abcdef1234567890abcdef',
    'trunk-acme-001',
    '+1',
    'local',
    false,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    true,
    false,
    'Test Line'
),
(
    '10101010-1010-1010-1010-101010101010',
    '+1-800-555-0001',
    'twilio',
    'PN5234567890abcdef1234567890abcdef',
    'trunk-acme-001',
    '+1',
    'toll-free',
    true,
    NULL,
    true,
    true,
    'Available Toll-Free'
),
(
    '11111111-1111-1111-1111-111111111112',
    '+1-415-555-9000',
    'vonage',
    'VN6234567890abcdef1234567890abcdef',
    'trunk-unassigned',
    '+1',
    'local',
    true,
    NULL,
    true,
    true,
    'Available Local'
);

-- =============================================
-- 6. PROMPTS
-- =============================================

INSERT INTO prompts (
    id, agent_id,
    greeting_message, system_instructions,
    end_call_phrases, enable_interruptions, silence_timeout_seconds,
    max_response_length, response_style,
    version, is_active
) VALUES
(
    '12121212-1212-1212-1212-121212121212',
    '88888888-8888-8888-8888-888888888888',
    'Hello! Thank you for calling Acme Corporation customer support. How may I assist you today?',
    'You are a professional customer support agent. Always be polite, helpful, and aim to resolve customer issues efficiently. If you cannot help, offer to transfer to a human agent.',
    ARRAY['goodbye', 'thank you goodbye', 'end call', 'hang up'],
    true,
    30,
    200,
    'professional',
    1,
    true
),
(
    '13131313-1313-1313-1313-131313131313',
    '99999999-9999-9999-9999-999999999999',
    'Good day! You''ve reached Acme Corporation sales. I''m excited to help you learn about our products and services!',
    'You are an enthusiastic sales representative. Focus on understanding customer needs and presenting relevant solutions. Be positive and engaging.',
    ARRAY['goodbye', 'no thank you', 'not interested'],
    true,
    25,
    250,
    'casual',
    1,
    true
),
(
    '14141414-1414-1414-1414-141414141414',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
    'Hi! This is TechStart technical support. I''m here to help you resolve any technical issues. What seems to be the problem?',
    'You are a patient and knowledgeable technical support specialist. Take time to understand the issue, ask clarifying questions, and provide step-by-step solutions.',
    ARRAY['goodbye', 'thanks bye', 'problem solved'],
    true,
    35,
    300,
    'professional',
    1,
    true
),
(
    '15151515-1515-1515-1515-151515151515',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Test agent ready.',
    'Respond briefly for testing.',
    ARRAY['bye', 'end'],
    false,
    10,
    50,
    'casual',
    1,
    true
);

-- =============================================
-- 7. CALL LOGS (Sample call history)
-- =============================================

INSERT INTO call_logs (
    id, livekit_room_id, agent_id,
    direction, caller_phone, caller_name, agent_phone,
    start_time, end_time, duration_seconds,
    status, disconnect_reason, disposition_code, disposition_notes,
    transcript, analysis
) VALUES
(
    '16161616-1616-1616-1616-161616161616',
    'room-acme-call-001',
    '88888888-8888-8888-8888-888888888888',
    'inbound',
    '+1-650-555-0001',
    'Customer Alice',
    '+1-415-555-8001',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours' + INTERVAL '5 minutes',
    300,
    'completed',
    'user_hangup',
    'COMPLETED',
    'Customer inquiry resolved successfully',
    '[
        {"timestamp": "00:00:05", "speaker": "agent", "message": "Hello! Thank you for calling Acme Corporation customer support. How may I assist you today?"},
        {"timestamp": "00:00:10", "speaker": "customer", "message": "Hi, I need help with my recent order."},
        {"timestamp": "00:00:15", "speaker": "agent", "message": "I''d be happy to help you with your order. Could you please provide your order number?"},
        {"timestamp": "00:00:20", "speaker": "customer", "message": "Sure, it''s ACM-12345."},
        {"timestamp": "00:00:30", "speaker": "agent", "message": "Thank you. Let me look that up for you."},
        {"timestamp": "00:00:45", "speaker": "agent", "message": "I found your order. It was shipped yesterday and should arrive in 2-3 business days."},
        {"timestamp": "00:00:50", "speaker": "customer", "message": "Great! Thank you so much."},
        {"timestamp": "00:00:55", "speaker": "agent", "message": "You''re welcome! Is there anything else I can help you with?"},
        {"timestamp": "00:01:00", "speaker": "customer", "message": "No, that''s all. Goodbye!"}
    ]'::jsonb,
    '{
        "sentiment": "positive",
        "resolution": "resolved",
        "topics": ["order_inquiry", "shipping_status"],
        "customer_satisfaction": "high",
        "duration_rating": "optimal",
        "summary": "Customer inquired about order status. Agent provided shipping information successfully."
    }'::jsonb
),
(
    '17171717-1717-1717-1717-171717171717',
    'room-acme-call-002',
    '99999999-9999-9999-9999-999999999999',
    'outbound',
    '+1-650-555-0002',
    'Lead Bob',
    '+1-415-555-8002',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '8 minutes',
    480,
    'completed',
    'completed',
    'COMPLETED',
    'Product demo scheduled',
    '[
        {"timestamp": "00:00:05", "speaker": "agent", "message": "Good day! You''ve reached Acme Corporation sales. I''m excited to help you learn about our products!"},
        {"timestamp": "00:00:10", "speaker": "customer", "message": "Hi, I got your email about the new product launch."},
        {"timestamp": "00:00:15", "speaker": "agent", "message": "Wonderful! Yes, we have some exciting new features. Would you like to schedule a demo?"},
        {"timestamp": "00:00:20", "speaker": "customer", "message": "Yes, that would be great."},
        {"timestamp": "00:00:30", "speaker": "agent", "message": "Perfect! I''ll send you a calendar invite. How about next Tuesday at 2 PM?"},
        {"timestamp": "00:00:35", "speaker": "customer", "message": "Tuesday works for me."},
        {"timestamp": "00:00:40", "speaker": "agent", "message": "Excellent! You''ll receive the invite shortly. Looking forward to showing you our new features!"}
    ]'::jsonb,
    '{
        "sentiment": "positive",
        "resolution": "scheduled_demo",
        "topics": ["product_demo", "new_features"],
        "customer_interest": "high",
        "follow_up": "demo_scheduled",
        "summary": "Sales call resulted in demo scheduling for new product features."
    }'::jsonb
),
(
    '18181818-1818-1818-1818-181818181818',
    'room-techstart-call-001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
    'inbound',
    '+1-737-555-0001',
    'User Charlie',
    '+1-512-555-8003',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours' + INTERVAL '12 minutes',
    720,
    'completed',
    'user_hangup',
    'COMPLETED',
    'Technical issue resolved',
    '[
        {"timestamp": "00:00:05", "speaker": "agent", "message": "Hi! This is TechStart technical support. How can I help you today?"},
        {"timestamp": "00:00:10", "speaker": "customer", "message": "I''m having trouble logging into my account."},
        {"timestamp": "00:00:15", "speaker": "agent", "message": "I''m sorry to hear that. Let''s troubleshoot this together. What error message are you seeing?"},
        {"timestamp": "00:00:20", "speaker": "customer", "message": "It says invalid credentials."},
        {"timestamp": "00:00:30", "speaker": "agent", "message": "Let me check your account status. Can you confirm your email address?"},
        {"timestamp": "00:00:35", "speaker": "customer", "message": "charlie@example.com"},
        {"timestamp": "00:00:50", "speaker": "agent", "message": "I see the issue. Your password needs to be reset. I''ll send you a reset link."},
        {"timestamp": "00:01:00", "speaker": "customer", "message": "Got it! I can log in now. Thanks!"}
    ]'::jsonb,
    '{
        "sentiment": "neutral_to_positive",
        "resolution": "resolved",
        "topics": ["login_issue", "password_reset"],
        "technical_complexity": "low",
        "summary": "User unable to login. Password reset link sent and issue resolved."
    }'::jsonb
),
(
    '19191919-1919-1919-1919-191919191919',
    'room-acme-call-003',
    '88888888-8888-8888-8888-888888888888',
    'inbound',
    '+1-650-555-0003',
    'Unknown',
    '+1-415-555-8001',
    NOW() - INTERVAL '30 minutes',
    NULL,
    NULL,
    'no_answer',
    'timeout',
    'NO_ANSWER',
    'Call rang but no one answered',
    NULL,
    NULL
);

-- =============================================
-- 8. USER SESSIONS (Active sessions)
-- =============================================

INSERT INTO user_sessions (
    id, user_id, session_token, refresh_token,
    session_type, ip_address, user_agent,
    expires_at, last_activity_at
) VALUES
(
    '20202020-2020-2020-2020-202020202020',
    '33333333-3333-3333-3333-333333333333',
    'session-token-admin-' || gen_random_uuid()::text,
    'refresh-token-admin-' || gen_random_uuid()::text,
    'password',
    '192.168.1.100',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    NOW() + INTERVAL '7 days',
    NOW()
);
-- SSO session skipped
-- (
--     '21212121-2121-2121-2121-212121212121',
--     '66666666-6666-6666-6666-666666666666',
--     'session-token-sso-' || gen_random_uuid()::text,
--     'refresh-token-sso-' || gen_random_uuid()::text,
--     'sso',
--     '192.168.1.101',
--     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
--     NOW() + INTERVAL '7 days',
--     NOW() - INTERVAL '1 hour'
-- );

-- =============================================
-- 9. AUDIT LOGS (Sample audit entries)
-- =============================================

INSERT INTO audit_logs (
    user_id, user_email, action, entity_type, entity_id,
    description, status
) VALUES
(
    '33333333-3333-3333-3333-333333333333',
    'admin@acme.com',
    'CREATE',
    'agents',
    '88888888-8888-8888-8888-888888888888',
    'Created Customer Support Agent',
    'success'
),
(
    '33333333-3333-3333-3333-333333333333',
    'admin@acme.com',
    'UPDATE',
    'users',
    '44444444-4444-4444-4444-444444444444',
    'Updated user role to Write',
    'success'
);
-- SSO audit log skipped
-- (
--     '66666666-6666-6666-6666-666666666666',
--     'sso.user@acme.com',
--     'SSO_LOGIN',
--     'users',
--     '66666666-6666-6666-6666-666666666666',
--     'User logged in via Google SSO',
--     'success'
-- );

-- =============================================
-- 10. SECURITY EVENTS (Sample security events)
-- =============================================

INSERT INTO security_events (
    user_id, event_type, severity, ip_address,
    details, resolved
) VALUES
(
    '33333333-3333-3333-3333-333333333333',
    'mfa_enabled',
    'low',
    '192.168.1.100',
    '{"device": "Desktop", "method": "authenticator_app"}',
    true
),
(
    '44444444-4444-4444-4444-444444444444',
    'failed_login',
    'medium',
    '192.168.1.150',
    '{"attempts": 2, "reason": "incorrect_password"}',
    true
);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check what was created
SELECT 'Organizations' as table_name, COUNT(*) as count FROM org_projects
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Agents', COUNT(*) FROM agents
UNION ALL
SELECT 'Phone Numbers', COUNT(*) FROM phone_numbers
UNION ALL
SELECT 'Prompts', COUNT(*) FROM prompts
UNION ALL
SELECT 'Call Logs', COUNT(*) FROM call_logs
UNION ALL
SELECT 'User Sessions', COUNT(*) FROM user_sessions
UNION ALL
SELECT 'Audit Logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'Security Events', COUNT(*) FROM security_events;

-- Show test users and their credentials
SELECT 
    email,
    role,
    mfa_enabled,
    auth_method,
    full_name,
    '(Password format: Role@123)' as password_hint
FROM users
WHERE auth_method = 'password'
ORDER BY role DESC;

-- Show agents and their phone numbers
SELECT 
    a.name as agent_name,
    a.phone_number,
    a.status,
    COUNT(cl.id) as total_calls
FROM agents a
LEFT JOIN call_logs cl ON a.id = cl.agent_id
GROUP BY a.id, a.name, a.phone_number, a.status
ORDER BY a.name;

-- =============================================
-- TEST DATA SUMMARY
-- =============================================
/*
TEST USERS CREATED:
===================

1. Admin User (Acme Corp)
   Email: admin@acme.com
   Password: Admin@123
   Role: Admin
   MFA: Enabled
   
2. Writer User (Acme Corp)
   Email: writer@acme.com
   Password: Writer@123
   Role: Write
   MFA: Disabled
   
3. Reader User (Acme Corp)
   Email: reader@acme.com
   Password: Reader@123
   Role: Read
   MFA: Disabled
   
4. Admin User (TechStart)
   Email: admin@techstart.io
   Password: TechAdmin@123
   Role: Admin
   MFA: Disabled

Note: SSO user skipped for now

ORGANIZATIONS:
==============
- Acme Corporation (acme-corp-001)
- TechStart Solutions (techstart-002)

AGENTS:
=======
- Customer Support Agent (+1-415-555-8001)
- Sales Agent (+1-415-555-8002)
- Tech Support Agent (+1-512-555-8003)
- Testing Agent (+1-415-555-8999)

PHONE NUMBERS:
==============
- 4 Assigned numbers
- 2 Available numbers for testing

CALL LOGS:
==========
- 4 sample calls with transcripts and analysis
- Mix of inbound/outbound, completed/no-answer

*/
