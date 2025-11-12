// Script to compare users table columns between two databases
const { Client } = require('pg');

// Database 1: postgres (your main db)
const db1 = new Client({
  host: '35.232.108.201',
  port: 5432,
  database: 'postgres', // Change this to your actual postgres db name
  user: 'postgres',
  password: 'Admin@011235',
  ssl: { rejectUnauthorized: false }
});

// Database 2: mfa
const db2 = new Client({
  host: '35.232.108.201',
  port: 5432,
  database: 'mfa',
  user: 'postgres',
  password: 'Admin@011235',
  ssl: { rejectUnauthorized: false }
});

async function compareUsersTables() {
  try {
    // Connect to both databases
    console.log('Connecting to databases...\n');
    await db1.connect();
    await db2.connect();
    console.log('✅ Connected to both databases\n');

    // Query to get column information
    const columnQuery = `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;

    console.log('📊 Fetching columns from postgres database...');
    const db1Result = await db1.query(columnQuery);
    
    console.log('📊 Fetching columns from mfa database...\n');
    const db2Result = await db2.query(columnQuery);

    // Create maps for easy comparison
    const db1Columns = new Map(db1Result.rows.map(r => [r.column_name, r]));
    const db2Columns = new Map(db2Result.rows.map(r => [r.column_name, r]));

    console.log('═══════════════════════════════════════════════════════════');
    console.log('USERS TABLE COMPARISON');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Columns only in postgres db
    console.log('🔵 Columns ONLY in postgres database:');
    console.log('─────────────────────────────────────');
    let postgresOnly = [];
    for (const [colName, colInfo] of db1Columns) {
      if (!db2Columns.has(colName)) {
        postgresOnly.push(colName);
        console.log(`  • ${colName} (${colInfo.data_type})`);
      }
    }
    if (postgresOnly.length === 0) {
      console.log('  (none)');
    }
    console.log('');

    // Columns only in mfa db
    console.log('🟢 Columns ONLY in mfa database:');
    console.log('─────────────────────────────────────');
    let mfaOnly = [];
    for (const [colName, colInfo] of db2Columns) {
      if (!db1Columns.has(colName)) {
        mfaOnly.push(colName);
        console.log(`  • ${colName} (${colInfo.data_type})`);
      }
    }
    if (mfaOnly.length === 0) {
      console.log('  (none)');
    }
    console.log('');

    // Common columns
    console.log('⚪ Columns in BOTH databases:');
    console.log('─────────────────────────────────────');
    let common = [];
    for (const [colName, colInfo] of db1Columns) {
      if (db2Columns.has(colName)) {
        common.push(colName);
        const db2Info = db2Columns.get(colName);
        const typeMismatch = colInfo.data_type !== db2Info.data_type;
        console.log(`  • ${colName} (postgres: ${colInfo.data_type}, mfa: ${db2Info.data_type})${typeMismatch ? ' ⚠️ TYPE MISMATCH' : ''}`);
      }
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total columns in postgres: ${db1Columns.size}`);
    console.log(`Total columns in mfa: ${db2Columns.size}`);
    console.log(`Common columns: ${common.length}`);
    console.log(`Only in postgres: ${postgresOnly.length}`);
    console.log(`Only in mfa: ${mfaOnly.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (mfaOnly.length > 0) {
      console.log('💡 RECOMMENDATION:');
      console.log('   Add these columns from mfa to postgres database:');
      mfaOnly.forEach(col => console.log(`   - ${col}`));
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db1.end();
    await db2.end();
    console.log('Database connections closed.');
  }
}

compareUsersTables();
