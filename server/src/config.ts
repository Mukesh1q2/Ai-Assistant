import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('3001'),
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long for security"),
    CLIENT_URL: z.string().default('http://localhost:5173').transform(str => str.split(',')),
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    ADMIN_KEY: z.string().optional(),
    ENCRYPTION_KEY: z.string().min(16, "ENCRYPTION_KEY must be at least 16 characters").optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

let config: EnvConfig;

try {
    config = envSchema.parse(process.env);
} catch (error) {
    if (error instanceof z.ZodError) {
        console.error('❌ Invalid environment variables:', error.format());
        process.exit(1);
    }
    throw error;
}

export { config };
