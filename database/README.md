# Database

This folder contains SQL schema files and test data for the project.

## Files

- `new_schema.sql` - Latest database schema definition
- `test-data.sql` - Test data for development and testing
- `update-passwords.sql` - SQL script to update user passwords

## Database Configuration

The project uses PostgreSQL. Connection details are configured in:
- Backend: `backend/app/core/config.py`
- Environment variables: `.env.local`

## Running Migrations

To apply schema changes or load test data:

```bash
# Load schema
psql -h <host> -U <user> -d <database> -f database/new_schema.sql

# Load test data
psql -h <host> -U <user> -d <database> -f database/test-data.sql
```

## Related Scripts

Database utility scripts are located in `scripts/database/` folder.
