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

async function checkSchema() {
    try {
        console.log('🔌 Connecting to livekit database...');
        await client.connect();
        console.log('✅ Connected!\n');

        // Get all tables
        const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log('📋 Tables in database:');
        for (const row of tablesResult.rows) {
            console.log(`\n=== ${row.table_name} ===`);

            // Get columns for each table
            const columnsResult = await client.query(`
                SELECT
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    udt_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = $1
                ORDER BY ordinal_position;
            `, [row.table_name]);

            for (const col of columnsResult.rows) {
                const nullable = col.is_nullable === 'YES' ? '?' : '';
                const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                console.log(`  ${col.column_name}: ${col.data_type}${nullable}${defaultVal}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

checkSchema();
