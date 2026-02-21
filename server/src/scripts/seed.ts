import { prisma } from '../db';
import bcrypt from 'bcryptjs';

const seed = async () => {
    console.log('🚀 Starting seed script...');
    try {
        const email = 'demo@clawd.ai';
        console.log(`🔍 Checking for existing user: ${email}`);

        const existing = await prisma.user.findUnique({
            where: { email }
        });

        if (existing) {
            console.log('⚠️ Demo account already exists.');
            process.exit(0);
        }

        console.log('👤 Creating new demo user...');
        const hashedPassword = await bcrypt.hash('demo123', 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Demo User',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
                planTier: 'pro',
                executionQuota: 5000
            }
        });

        console.log('✅ Demo user created successfully!');

        // Bots
        const bots = [
            { name: 'Email Assistant', description: 'Manages inbox', type: 'email', status: 'active' },
            { name: 'Calendar Bot', description: 'Schedules meetings', type: 'calendar', status: 'active' }
        ];

        console.log('🤖 Creating sample bots...');
        for (const bot of bots) {
            await prisma.bot.create({
                data: {
                    name: bot.name,
                    description: bot.description,
                    type: bot.type,
                    status: bot.status,
                    userId: user.id
                }
            });
        }
        console.log('✅ Sample bots created.');
        console.log('🎉 Seeding complete!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed with error:', error);
        process.exit(1);
    }
};

seed();
