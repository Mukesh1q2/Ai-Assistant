import { db } from '../server/src/db';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
    console.log('Seeding analytics data...');

    const userId = 'user-1'; // Ensure this matches the logged in user
    const botId = 'bot-1'; // Ensure this matches a bot

    // Create a bot if not exists
    await db.prepare(`
        INSERT INTO bots (id, user_id, name, description, type, status, config, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
    `).run(
        botId,
        userId,
        'Test Bot',
        'A bot for testing analytics',
        'coding',
        'active',
        JSON.stringify({ personality: 'Helpful', memoryScope: 'user' }), // metrics removed from here as they are calculated
        new Date().toISOString(),
        new Date().toISOString()
    );

    // Insert 50 executions over the last 30 days
    for (let i = 0; i < 50; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));

        const status = Math.random() > 0.1 ? 'success' : 'error';

        await db.prepare(`
            INSERT INTO executions (id, user_id, bot_id, provider, model, status, tokens_input, tokens_output, duration_ms, cost, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `).run(
            uuidv4(),
            userId,
            botId,
            'openai',
            'gpt-4',
            status,
            Math.floor(Math.random() * 1000),
            Math.floor(Math.random() * 1000),
            Math.floor(Math.random() * 5000),
            0.01,
            date.toISOString()
        );
    }

    // Insert some messages
    for (let i = 0; i < 100; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));

        await db.prepare(`
            INSERT INTO messages (id, integration_id, direction, content, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `).run(
            uuidv4(),
            'int-1', // Placeholder
            Math.random() > 0.5 ? 'incoming' : 'outgoing',
            'Test message',
            'sent',
            date.toISOString(),
            date.toISOString()
        );
    }

    console.log('Seeding complete.');
}

seed().catch(console.error);
