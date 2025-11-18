# Database Migration Scripts

## Quick Start

### For GCP Cloud SQL PostgreSQL

1. **Connect to your Cloud SQL instance:**
   ```bash
   gcloud sql connect <INSTANCE_NAME> --user=postgres --database=<DATABASE_NAME>
   ```

   Or use Cloud SQL Proxy:
   ```bash
   ./cloud_sql_proxy -instances=<PROJECT>:<REGION>:<INSTANCE>=tcp:5432
   psql -h 127.0.0.1 -U postgres -d <DATABASE_NAME>
   ```

2. **Run migrations in order:**
   ```bash
   # Step 1: Backup (REQUIRED)
   psql -h <host> -U <user> -d <database> -f 001_pre_migration_backup.sql

   # Step 2: Migrate (MAIN MIGRATION)
   psql -h <host> -U <user> -d <database> -f 002_forward_migration.sql

   # Step 3: Validate (RECOMMENDED)
   psql -h <host> -U <user> -d <database> -f 004_post_migration_validation.sql

   # Step 4: Rollback (ONLY IF NEEDED)
   # psql -h <host> -U <user> -d <database> -f 003_rollback.sql
   ```

## Migration Files

### `001_pre_migration_backup.sql`
- **Purpose:** Creates backups of all existing tables
- **Creates:** `migration_backup` schema with table backups
- **Safe to run:** Yes, read-only operations
- **Duration:** ~1-2 minutes (depends on data size)
- **Required:** YES - Run this first!

### `002_forward_migration.sql`
- **Purpose:** Main migration script
- **Creates:** New tables (phone_numbers, prompts, sso_providers, etc.)
- **Modifies:** Existing tables (users, agents, call_logs)
- **Migrates:** Data from old to new structure
- **Duration:** ~5-15 minutes (depends on data size)
- **Required:** YES - Core migration
- **⚠️ WARNING:** This modifies your database. Ensure backup is complete!

### `003_rollback.sql`
- **Purpose:** Rolls back migration to previous state
- **Restores:** From `migration_backup` schema
- **Duration:** ~3-5 minutes
- **When to use:** Only if migration fails or needs reverting
- **⚠️ WARNING:** This will undo all migration changes!

### `004_post_migration_validation.sql`
- **Purpose:** Validates migration success
- **Checks:** Tables, columns, indexes, foreign keys, data integrity
- **Safe to run:** Yes, read-only operations
- **Duration:** ~30 seconds
- **Required:** Highly recommended

## Pre-Migration Checklist

- [ ] Database backup completed (001_pre_migration_backup.sql)
- [ ] Tested migration on staging/dev environment
- [ ] Application downtime window scheduled
- [ ] Team notified of maintenance
- [ ] Rollback plan reviewed
- [ ] Database admin access confirmed

## Migration Execution Checklist

During migration:
- [ ] Stop application servers (or enable maintenance mode)
- [ ] Run 001_pre_migration_backup.sql
- [ ] Verify backup completed successfully
- [ ] Run 002_forward_migration.sql
- [ ] Check for errors in migration output
- [ ] Run 004_post_migration_validation.sql
- [ ] Review validation results
- [ ] If PASS: Continue to post-migration steps
- [ ] If FAIL: Run 003_rollback.sql and investigate

## Post-Migration Checklist

- [ ] Regenerate Prisma client: `npx prisma generate`
- [ ] Deploy updated application code
- [ ] Restart application servers
- [ ] Test critical user flows (login, registration, profile update)
- [ ] Test agent and call log operations
- [ ] Monitor application logs for errors
- [ ] Verify API responses use new field names
- [ ] Check UI displays correctly
- [ ] Monitor for 24-48 hours

## GCP Cloud SQL Specific Notes

### Using Cloud SQL Proxy
```bash
# Download Cloud SQL Proxy
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
chmod +x cloud_sql_proxy

# Run proxy
./cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5432 &

# Connect
psql -h 127.0.0.1 -U postgres -d your_database
```

### Using gcloud SQL connect
```bash
gcloud sql connect INSTANCE_NAME --user=postgres --database=DATABASE_NAME

# Then run migration scripts
\i 001_pre_migration_backup.sql
\i 002_forward_migration.sql
\i 004_post_migration_validation.sql
```

### Performance Tips
1. **Schedule during low traffic:** Run migration during off-peak hours
2. **Increase resources temporarily:** Consider upgrading Cloud SQL instance temporarily
3. **Monitor performance:** Check Cloud SQL metrics during migration
4. **Connection pooling:** Ensure connection limits won't be exceeded

### Cloud SQL Backup Before Migration
```bash
# Create automatic backup before migration
gcloud sql backups create --instance=INSTANCE_NAME --description="Pre-migration backup"

# Or create on-demand backup in console
```

## Estimated Downtime

| Data Size | Estimated Downtime |
|-----------|-------------------|
| < 1GB     | 5-10 minutes      |
| 1-10GB    | 10-20 minutes     |
| 10-100GB  | 20-45 minutes     |
| > 100GB   | 45+ minutes       |

*Actual time depends on Cloud SQL tier, data complexity, and concurrent connections*

## Common Issues

### Issue: "relation already exists"
**Solution:** Tables were partially created. Either complete migration or run rollback.

### Issue: "permission denied"
**Solution:** Ensure database user has CREATE, ALTER, DROP privileges.

### Issue: "out of shared memory"
**Solution:** Migration may be too large. Consider upgrading Cloud SQL instance temporarily.

### Issue: Migration hangs
**Solution:** Check for long-running queries or locks:
```sql
SELECT * FROM pg_stat_activity WHERE state != 'idle';
```

## Monitoring Migration Progress

```sql
-- Check migration log
SELECT * FROM migration_backup.migration_log ORDER BY started_at DESC;

-- Check backup progress
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'migration_backup';

-- Check transaction status
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

## Cleanup After Successful Migration

Wait 7-30 days to ensure everything works, then:

```sql
-- Remove backup schema
DROP SCHEMA migration_backup CASCADE;

-- Remove old tables if they exist
DROP TABLE IF EXISTS companies CASCADE;
```

## Support

For issues:
1. Check migration logs in `migration_backup.migration_log`
2. Review validation output from 004_post_migration_validation.sql
3. Check Cloud SQL logs in GCP Console
4. Refer to main MIGRATION_GUIDE.md for detailed troubleshooting

## Quick Command Reference

```bash
# List available databases
\l

# Connect to database
\c database_name

# List schemas
\dn

# List tables in schema
\dt migration_backup.*

# View migration log
SELECT * FROM migration_backup.migration_log;

# Exit psql
\q
```

---

**Migration Version:** 1.0.0
**Last Updated:** 2025-01-18
**Compatible with:** PostgreSQL 12+, GCP Cloud SQL
