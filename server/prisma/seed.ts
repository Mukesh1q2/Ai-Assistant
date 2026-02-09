/**
 * Database Seed Script
 * Creates demo account: demo@clawd.ai / demo123
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);

    const demoUser = await prisma.user.upsert({
        where: { email: 'demo@clawd.ai' },
        update: {},
        create: {
            email: 'demo@clawd.ai',
            password: hashedPassword,
            name: 'Demo User',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
            role: 'owner',
            status: 'active',
            theme: 'system',
            notifications: true,
            language: 'en',
            timezone: 'America/New_York',
            planTier: 'pro',
            executionQuota: 5000,
            usedExecutions: 245,
            channelLimit: 10,
            packLimit: 20,
            familySeats: 5,
        },
    });

    console.log('✅ Created demo user:', demoUser.email);

    // Create sample bots
    const bots = [
        {
            name: 'Email Assistant',
            description: 'Manages your inbox, drafts replies, and organizes emails',
            avatar: '/bots/email.png',
            type: 'email',
            status: 'active',
            personality: 'professional and efficient',
            userId: demoUser.id,
        },
        {
            name: 'Calendar Bot',
            description: 'Schedules meetings, sends reminders, manages your calendar',
            avatar: '/bots/calendar.png',
            type: 'calendar',
            status: 'active',
            personality: 'organized and helpful',
            userId: demoUser.id,
        },
        {
            name: 'Chores Manager',
            description: 'Tracks household tasks, assigns chores, sends reminders',
            avatar: '/bots/chores.png',
            type: 'chores',
            status: 'inactive',
            personality: 'friendly and motivating',
            userId: demoUser.id,
        },
    ];

    for (const bot of bots) {
        await prisma.bot.create({ data: bot });
    }

    console.log('✅ Created', bots.length, 'sample bots');

    // Create sample channels
    const channels = [
        {
            name: 'Family Group',
            type: 'telegram',
            status: 'connected',
            connectedAt: new Date(),
            userId: demoUser.id,
        },
        {
            name: 'Work Slack',
            type: 'slack',
            status: 'connected',
            connectedAt: new Date(),
            userId: demoUser.id,
        },
    ];

    for (const channel of channels) {
        await prisma.channel.create({ data: channel });
    }

    console.log('✅ Created', channels.length, 'sample channels');
    console.log('🎉 Seeding complete!');
    console.log('\n📧 Demo login: demo@clawd.ai');
    console.log('🔑 Password: demo123\n');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
