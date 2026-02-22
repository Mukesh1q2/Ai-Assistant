import { Redis } from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let connection: Redis | null = null;

try {
    connection = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null, // Required by BullMQ
        retryStrategy(times) {
            if (times > 3) {
                console.warn('⚠️  Redis unavailable — queue features disabled');
                return null; // Stop retrying
            }
            return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
    });

    connection.on('error', (err) => {
        if ((err as any).code === 'ECONNREFUSED') {
            // Silently handle — Redis is optional for dev
        } else {
            console.error('Redis error:', err.message);
        }
    });

    connection.on('connect', () => {
        console.log('🔗 Connected to Redis');
    });

    // Attempt connection but don't crash if it fails
    connection.connect().catch(() => {
        console.warn('⚠️  Redis not available — running without queue processing');
        connection = null;
    });
} catch {
    console.warn('⚠️  Redis not available — running without queue processing');
    connection = null;
}

export { connection };
