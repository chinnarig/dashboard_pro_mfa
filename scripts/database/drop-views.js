const { Client } = require('pg');

const client = new Client({
    host: '35.232.108.201',
    port: 5432,
    database: 'livekit',
    user: 'postgres',
    password: 'Admin@011235',
    ssl: {
        rejectUnauthorized: false
    }
});

async function dropViews() {
    try {
        console.log('🔌 Connecting to livekit database...');
        await client.connect();
        console.log('✅ Connected!\n');

        console.log('🗑️  Dropping all views...');

        // Get all views in the public schema
        const result = await client.query(`
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
        `);

        console.log(`Found ${result.rows.length} views to drop`);

        for (const row of result.rows) {
            console.log(`  Dropping ${row.table_name}...`);
            await client.query(`DROP VIEW IF EXISTS ${row.table_name} CASCADE`);
        }

        console.log('✅ All views dropped successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

dropViews();
