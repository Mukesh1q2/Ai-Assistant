import { db } from '../db';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const seed = async () => {
    console.log('🚀 Starting seed script...');
    try {
        const email = 'demo@clawd.ai';
        console.log(`🔍 Checking for existing user: ${email}`);
        const existing = await db.prepare('SELECT id FROM users WHERE email = $1').get(email);

        if (existing) {
            console.log('⚠️ Demo account already exists.');
            process.exit(0);
        }

        console.log('👤 Creating new demo user...');
        const hashedPassword = await bcrypt.hash('demo123', 10);
        const userId = 'user-' + Date.now();

        await db.prepare(`
            INSERT INTO users (id, email, password, name, avatar, plan_tier, execution_quota)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `).run(userId, email, hashedPassword, 'Demo User',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=demo', 'pro', 5000);

        console.log('✅ Demo user created successfully!');

        // Bots
        const bots = [
            { name: 'Email Assistant', desc: 'Manages inbox', type: 'email', status: 'active' },
            { name: 'Calendar Bot', desc: 'Schedules meetings', type: 'calendar', status: 'active' }
        ];

        console.log('🤖 Creating sample bots...');
        for (const bot of bots) {
            await db.prepare(`
                INSERT INTO bots (id, name, description, type, status, user_id)
                VALUES ($1, $2, $3, $4, $5, $6)
            `).run('bot-' + Math.random(), bot.name, bot.desc, bot.type, bot.status, userId);
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
