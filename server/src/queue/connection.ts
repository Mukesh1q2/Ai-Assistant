import { Redis } from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Reusable Redis connection for BullMQ
export const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
});

connection.on('error', (err) => {
    console.error('Redis connection error:', err);
});

connection.on('connect', () => {
    console.log('🔗 Connected to Redis');
});
