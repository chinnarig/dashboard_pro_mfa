import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    try {
        // Create admin user
        const adminPassword = await bcrypt.hash('Admin@011', 12);
        const admin = await prisma.user.upsert({
            where: { email: 'admin@zlavox.com' },
            update: {},
            create: {
                email: 'admin@zlavox.com',
                username: 'admin',
                name: 'Zlavox AI',
                password: adminPassword,
                role: 'ADMIN',
                bio: 'System administrator',
                emailVerified: new Date(),
            },
        });

        console.log('✅ Created admin user:', admin.email);

        // Create regular users
        const user1Password = await bcrypt.hash('Rama@123', 12);
        const user1 = await prisma.user.upsert({
            where: { email: 'rk@zlavox.com' },
            update: {},
            create: {
                email: 'rk@zlavox.com',
                username: 'ramakrishna',
                name: 'Rama Krishna',
                password: user1Password,
                bio: 'Software developer and tech enthusiast',
                emailVerified: new Date(),
            },
        });

        const user2Password = await bcrypt.hash('Sivaji@123', 12);
        const user2 = await prisma.user.upsert({
            where: { email: 'sivaji@zlavox.com' },
            update: {},
            create: {
                email: 'sivaji@zlavox.com',
                username: 'sivaji',
                name: 'Sivaji',
                password: user2Password,
                bio: 'Writer and content creator',
                emailVerified: new Date(),
            },
        });

        console.log('✅ Created regular users');

        console.log('\n📊 Seed Summary:');
        console.log('================');
        console.log(`👤 Admin: ${admin.email} / Admin@011`);
        console.log(`👤 User 1: ${user1.email} / Rama@123`);
        console.log(`👤 User 2: ${user2.email} / Sivaji@123`);
        console.log('================\n');

        console.log('✅ Seed completed successfully!');
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('❌ Fatal error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        console.log('🔌 Disconnecting from database...');
        await prisma.$disconnect();
    });