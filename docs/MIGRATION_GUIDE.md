# Database Schema Migration Guide

## Overview
This guide covers the migration from the old schema to the new simplified schema for the Dashboard Pro MFA application.

## Major Changes

### 1. **Table Renames**
- `companies` → `projects` (or `org_projects` as per your update)
- Table name in Prisma: `Project`

### 2. **New Tables Created**
- `phone_numbers` - Separate table for managing phone inventory
- `prompts` - Agent prompts and conversation settings
- `sso_providers` - SSO provider configurations
- `user_sessions` - User session management
- `security_events` - Security event tracking
- `call_dispositions` - Standard call disposition codes

### 3. **Users Table Changes**

#### Column Renames:
- `company_id` → `ord_project_id`
- `password` → `password_hash`
- `email_verified` / `emailVerifiedBool` → `is_email_verified`
- `name` → `full_name`
- `created_at` remains `created_at` (no change)

#### New Columns Added:
- `sso_provider` - SSO provider name
- `sso_provider_id` - Unique ID from SSO provider
- `sso_email` - Email from SSO provider
- `sso_metadata` - Additional SSO profile data (JSONB)
- `auth_method` - Authentication method: 'password', 'sso', or 'both'
- `last_sso_login_at` - Last SSO login timestamp
- `is_email_verified` - Email verification status
- `email_verified_at` - When email was verified
- `last_login_at` - Last login timestamp
- `last_login_ip` - Last login IP address
- `failed_login_attempts` - Failed login attempt counter
- `locked_until` - Account lock expiration
- `password_changed_at` - Last password change timestamp
- `deleted_at` - Soft delete timestamp

### 4. **Agents Table Changes**

#### Columns Removed:
- `phone_provider` (moved to `phone_numbers` table)
- `phone_provider_sid` (moved to `phone_numbers` table)
- `greeting_message` (moved to `prompts` table)
- `end_call_phrases` (moved to `prompts` table)
- `enable_interruptions` (moved to `prompts` table)
- `silence_timeout_seconds` (moved to `prompts` table)

#### Columns Retained:
- `phone_number` (kept for denormalized quick access)
- All voice and LLM configuration fields
- `livekit_agent_name`
- `status`, `is_phone_active`

#### New Columns:
- `deleted_at` - Soft delete timestamp

### 5. **Call Logs Table Changes**

#### Columns Removed:
- `livekit_participant_id` - Simplified tracking
- `batch_reference` - Removed batch tracking
- `batch_job_id` - Removed batch tracking
- `summary` - Use `analysis` JSONB instead
- `sentiment_status` - Removed detailed sentiment tracking
- `sentiment_score` - Removed detailed sentiment tracking
- `sentiment_details` - Removed detailed sentiment tracking
- `detected_intents` - Use `analysis` JSONB instead
- `detected_entities` - Use `analysis` JSONB instead
- `audio_quality_score` - Removed quality metrics
- `latency_ms` - Removed quality metrics
- `user_satisfaction_rating` - Removed quality metrics
- `user_feedback` - Removed quality metrics
- `connection_region` - Removed technical details
- `client_ip` - Removed technical details
- `user_agent` - Removed technical details
- `error_message` - Removed technical details
- `metadata` - Use `analysis` JSONB instead

#### Columns Retained:
- `id`, `livekit_room_id`
- `agent_id`
- `direction`, `caller_phone`, `caller_name`
- `start_time`, `end_time`, `duration_seconds`
- `status`, `disconnect_reason`
- `disposition_code`, `disposition_notes`
- `transcript` (JSONB)
- `created_at`, `updated_at`

#### New Columns:
- `agent_phone` - Phone number used by agent
- `analysis` - JSONB for AI-generated analysis (replaces multiple fields)

## Migration Scripts

### Prerequisites
1. Backup your database before running migration
2. Ensure you have PostgreSQL admin access
3. Test on a staging environment first

### Migration Steps

#### Step 1: Pre-Migration Backup
```bash
psql -h <host> -U <user> -d <database> -f migrations/001_pre_migration_backup.sql
```

This creates:
- Backup schema `migration_backup`
- Copies of all existing tables
- Migration log table

#### Step 2: Forward Migration
```bash
psql -h <host> -U <user> -d <database> -f migrations/002_forward_migration.sql
```

This script:
- Creates new tables (`projects`, `phone_numbers`, `prompts`, etc.)
- Migrates data from `companies` to `projects`
- Migrates phone numbers from `agents` to `phone_numbers` table
- Migrates prompts from `agents` to `prompts` table
- Updates `users` table structure
- Simplifies `call_logs` table
- Creates all necessary indexes, triggers, and views

#### Step 3: Post-Migration Validation
```bash
psql -h <host> -U <user> -d <database> -f migrations/004_post_migration_validation.sql
```

This validates:
- All tables exist
- All columns are correct
- Foreign keys are in place
- Indexes are created
- Triggers are active
- Data migration was successful

#### Step 4 (If Needed): Rollback
```bash
psql -h <host> -U <user> -d <database> -f migrations/003_rollback.sql
```

**⚠️ WARNING:** Only run this if migration failed and you need to revert!

## Application Code Changes

### 1. **Prisma Schema Updated**
File: `prisma/schema.prisma`

New models created:
- `Project` (replaces companies)
- `PhoneNumber`
- `Prompt`
- `SsoProvider`
- `UserSession`
- `SecurityEvent`
- `CallDisposition`

After migration, regenerate Prisma client:
```bash
npx prisma generate
```

### 2. **Type Definitions Updated**

#### New Files:
- `src/types/project.ts` - Project types
- Updated `src/types/call.ts` - Call, Agent, PhoneNumber, Prompt types

#### Key Type Changes:
```typescript
// Old
interface User {
  name: string;
  password: string;
  company_id: string;
}

// New
interface User {
  fullName: string;
  passwordHash: string;
  ordProjectId: string;
  ssoProvider?: string;
  authMethod: 'password' | 'sso' | 'both';
}
```

### 3. **API Routes Updated**

#### `src/app/api/users/route.ts`
- Uses `fullName` instead of `name`
- Uses `passwordHash` instead of `password`
- Uses `ordProjectId` instead of `company_id`
- Includes SSO fields
- Filters by `deletedAt: null` for soft deletes
- Returns MFA status

#### `src/app/api/users/[id]/route.ts`
- Same field name updates as above
- DELETE now performs soft delete (sets `deletedAt`)
- Removed references to `accounts` and `sessions` relations

#### User Fields API Changes:
```typescript
// Old API Response
{
  "id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "emailVerified": true,
  "created_at": "...",
  "_count": {
    "accounts": 1,
    "sessions": 2
  }
}

// New API Response
{
  "id": "...",
  "fullName": "John Doe",
  "email": "john@example.com",
  "isEmailVerified": true,
  "ordProjectId": "...",
  "mfaEnabled": false,
  "isActive": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### 4. **Server Actions Updated**

File: `src/actions/user.ts`

Changes:
- `updateProfile()` - Uses `fullName` instead of `name`
- `changePassword()` - Uses `passwordHash` instead of `password`
- `getUserProfile()` - Returns new fields, filters by `deletedAt`
- `deleteAccount()` - Performs soft delete

### 5. **UI Components (Need Manual Update)**

Components that need updating:

#### User Management:
- `src/components/user/UsersTable.tsx` - Update to use `fullName`, `isEmailVerified`, `mfaEnabled`
- `src/components/user/UserEditForm.tsx` - Update form fields
- `src/components/user/UserManagementTable.tsx` - Update table columns

#### Dashboard:
- `src/components/dashboard/CallsTable.tsx` - Update to use new call log fields
- `src/components/dashboard/CallsStats.tsx` - Update stats calculations
- `src/components/dashboard/CallsChart.tsx` - Update data mapping

#### Agents:
- `src/components/agent/AgentsTable.tsx` - Update to reflect removed fields

### Example UI Component Update:

```typescript
// Before
<TableCell>{user.name}</TableCell>
<TableCell>{user.emailVerified ? 'Yes' : 'No'}</TableCell>

// After
<TableCell>{user.fullName}</TableCell>
<TableCell>{user.isEmailVerified ? 'Yes' : 'No'}</TableCell>
<TableCell>{user.mfaEnabled ? 'Enabled' : 'Disabled'}</TableCell>
```

## Post-Migration Tasks

### 1. Update Environment Variables
Ensure these are set:
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### 2. Test Critical Flows
- [ ] User registration
- [ ] User login (password & SSO)
- [ ] MFA setup and verification
- [ ] User profile updates
- [ ] Call log viewing
- [ ] Agent management
- [ ] Phone number management

### 3. Data Verification
```sql
-- Check user count matches
SELECT COUNT(*) FROM users WHERE deleted_at IS NULL;

-- Check projects migrated
SELECT COUNT(*) FROM projects;

-- Check phone numbers migrated
SELECT COUNT(*) FROM phone_numbers;

-- Check prompts created
SELECT COUNT(*) FROM prompts;

-- Check call logs intact
SELECT COUNT(*) FROM call_logs;
```

### 4. Monitor for Issues
- Check application logs for Prisma errors
- Monitor API error rates
- Verify all CRUD operations work
- Test soft delete functionality

## Known Issues & Solutions

### Issue 1: TypeScript Errors Before Migration
**Problem:** TypeScript shows errors because Prisma client expects old schema

**Solution:** These will resolve after:
1. Running the database migration
2. Regenerating Prisma client: `npx prisma generate`

### Issue 2: UI Shows Undefined Values
**Problem:** UI components still use old field names

**Solution:** Update component files to use new field names:
- `name` → `fullName`
- `emailVerified` → `isEmailVerified`
- Add `mfaEnabled`, `ordProjectId` fields where needed

### Issue 3: Existing Sessions Break
**Problem:** Existing user sessions may become invalid

**Solution:** Users may need to log in again after migration

## Rollback Plan

If issues occur after migration:

1. **Immediate Rollback:**
   ```bash
   psql -h <host> -U <user> -d <database> -f migrations/003_rollback.sql
   ```

2. **Revert Code Changes:**
   ```bash
   git revert <commit-hash>
   ```

3. **Regenerate Old Prisma Client:**
   ```bash
   git checkout HEAD~1 -- prisma/schema.prisma
   npx prisma generate
   ```

## Support

For issues during migration:
1. Check migration logs in `migration_backup.migration_log` table
2. Review validation results from step 3
3. Check application logs for specific errors
4. Verify database connection and permissions

## Cleanup (After Successful Migration)

After confirming migration success (7-30 days):

```sql
-- Drop backup schema
DROP SCHEMA migration_backup CASCADE;

-- Drop old companies table (if it still exists)
DROP TABLE IF EXISTS companies CASCADE;
```

## Summary of Benefits

1. **Simplified Call Logs:** Removed 15+ unnecessary fields
2. **Better Organization:** Phone numbers and prompts in dedicated tables
3. **SSO Support:** Full SSO integration capability
4. **Soft Deletes:** Better data retention and recovery
5. **Audit Trails:** Automatic change tracking on all main tables
6. **Scalability:** Better normalized schema for future growth

## Timeline Recommendation

- **Week 1:** Test migration on staging/dev environment
- **Week 2:** Run migration on production during low-traffic window
- **Week 3:** Monitor and fix any UI/UX issues
- **Week 4+:** Complete cleanup after validation

---

**Last Updated:** 2025-01-18
**Migration Scripts Version:** 1.0.0
