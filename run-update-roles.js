const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function updateUserRoles() {
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

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected to mfa database\n');

        // Read SQL file
        const sqlFile = path.join(__dirname, 'update_user_roles.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('📝 Executing role update migration...\n');
        
        // Execute the SQL
        const result = await client.query(sql);
        
        console.log('✅ Migration completed successfully!\n');
        
        // Show the results
        if (result && result.rows && result.rows.length > 0) {
            console.log('📊 Updated User Roles:');
            console.log('─'.repeat(80));
            result.rows.forEach(row => {
                console.log(`${row.role_status.padEnd(12)} | ${row.email.padEnd(30)} | ${row.full_name}`);
            });
            console.log('─'.repeat(80));
        }

    } catch (error) {
        console.error('❌ Error updating roles:', error.message);
        if (error.detail) console.error('Detail:', error.detail);
        if (error.hint) console.error('Hint:', error.hint);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

updateUserRoles();
