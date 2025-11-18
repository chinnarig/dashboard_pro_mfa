const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    host: '35.232.108.201',
    port: 5432,
    database: 'livekit',
    user: 'postgres',
    password: 'Admin@011235',
    ssl: {
        rejectUnauthorized: false // For Cloud SQL, we need to allow self-signed certificates
    }
});

async function executeSchema() {
    try {
        console.log('🔌 Connecting to GCP Cloud SQL (livekit database)...');
        await client.connect();
        console.log('✅ Connected successfully!\n');

        console.log('📖 Reading schema file...');
        const schemaPath = path.join(__dirname, 'new_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        console.log(`✅ Schema file loaded (${schema.length} characters)\n`);

        console.log('🚀 Executing schema...');
        console.log('This may take a few minutes...\n');

        const result = await client.query(schema);

        console.log('✅ Schema executed successfully!\n');

        // Verify tables were created
        console.log('🔍 Verifying tables...');
        const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log('\n📋 Created tables:');
        tablesResult.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });

        // Count rows in main tables
        console.log('\n📊 Table row counts:');
        const counts = await Promise.all([
            client.query('SELECT COUNT(*) FROM org_projects'),
            client.query('SELECT COUNT(*) FROM users'),
            client.query('SELECT COUNT(*) FROM agents'),
            client.query('SELECT COUNT(*) FROM phone_numbers'),
            client.query('SELECT COUNT(*) FROM prompts'),
            client.query('SELECT COUNT(*) FROM call_logs'),
        ]);

        console.log(`   org_projects: ${counts[0].rows[0].count}`);
        console.log(`   users: ${counts[1].rows[0].count}`);
        console.log(`   agents: ${counts[2].rows[0].count}`);
        console.log(`   phone_numbers: ${counts[3].rows[0].count}`);
        console.log(`   prompts: ${counts[4].rows[0].count}`);
        console.log(`   call_logs: ${counts[5].rows[0].count}`);

        console.log('\n✅ Schema deployment complete!');

    } catch (error) {
        console.error('\n❌ Error executing schema:', error.message);
        if (error.position) {
            console.error('   Position in SQL:', error.position);
        }
        if (error.detail) {
            console.error('   Detail:', error.detail);
        }
        if (error.hint) {
            console.error('   Hint:', error.hint);
        }
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed.');
    }
}

executeSchema();
