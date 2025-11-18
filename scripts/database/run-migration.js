// Migration script to add MFA columns to users table
// Run this with: node run-migration.js

const fs = require('fs');
const { Client } = require('pg');

// Read the migration SQL file
const migrationSQL = fs.readFileSync('./add_mfa_columns_migration.sql', 'utf8');

// Database connection config from .env.local
const client = new Client({
  host: '35.232.108.201',
  port: 5432,
  database: 'mfa',
  user: 'postgres',
  password: 'Admin@011235',
  ssl: {
    rejectUnauthorized: false // For Google Cloud SQL
  }
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('\nRunning migration...');
    const result = await client.query(migrationSQL);
    
    console.log('\n✅ Migration completed successfully!');
    if (result.rows && result.rows.length > 0) {
      console.log(result.rows);
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
