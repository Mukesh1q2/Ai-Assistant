import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const runMigration = async () => {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is not defined in environment variables.');
        process.exit(1);
    }

    console.log('🔌 Connecting to database...');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    try {
        const client = await pool.connect();
        console.log('✅ Connected successfully.');

        const schemaPath = path.join(__dirname, 'migration_ai.sql');
        console.log(`📄 Reading schema from ${schemaPath}...`);

        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('🚀 Running AI migration...');
        await client.query(schema);

        console.log('✅ AI Migration completed successfully!');
        client.release();
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

runMigration();
