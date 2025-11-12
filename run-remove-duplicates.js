// Script to remove duplicate timestamp columns from mfa database
const fs = require('fs');
const { Client } = require('pg');

// Read the migration SQL file
const migrationSQL = fs.readFileSync('./remove_duplicate_columns.sql', 'utf8');

// Database connection config - mfa database
const client = new Client({
  host: '35.232.108.201',
  port: 5432,
  database: 'mfa',
  user: 'postgres',
  password: 'Admin@011235',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('Connecting to mfa database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    console.log('Running migration to remove duplicate columns...');
    const result = await client.query(migrationSQL);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\nColumns removed:');
    console.log('  ✗ created_at (keeping created_at)');
    console.log('  ✗ updatedAt (keeping updated_at)');
    console.log('  ✗ emailVerified (keeping email_verified)');
    
    if (result.rows && result.rows.length > 0) {
      console.log('\n' + result.rows[0].status);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

runMigration();
