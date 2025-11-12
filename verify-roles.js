const { Client } = require('pg');

async function verifyRoles() {
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

        // Check current roles
        const result = await client.query(`
            SELECT 
                email, 
                full_name, 
                role,
                CASE 
                    WHEN role = 'ADMIN' THEN '✓ Admin'
                    WHEN role = 'USER' THEN '✓ User'
                    ELSE '✗ Invalid: ' || role
                END as role_status
            FROM users
            ORDER BY role, email;
        `);
        
        console.log('📊 Current User Roles:');
        console.log('─'.repeat(100));
        console.log('Status      | Email                          | Full Name');
        console.log('─'.repeat(100));
        result.rows.forEach(row => {
            console.log(`${row.role_status.padEnd(12)} | ${row.email.padEnd(30)} | ${row.full_name}`);
        });
        console.log('─'.repeat(100));
        console.log(`\n✅ Total users: ${result.rows.length}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

verifyRoles();
