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

async function updateBackupCodes() {
    try {
        console.log('🔌 Connecting to livekit database...');
        await client.connect();
        console.log('✅ Connected!\n');

        console.log('📝 Updating mfa_backup_codes column type...');

        // Change from array to text
        await client.query(`
            ALTER TABLE users
            ALTER COLUMN mfa_backup_codes TYPE TEXT;
        `);

        console.log('✅ Column updated successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

updateBackupCodes();
