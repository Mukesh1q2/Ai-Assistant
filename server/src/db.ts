/**
 * Database setup using node-postgres
 * Production-ready connection pool
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// const __dirname = path.dirname(fileURLToPath(import.meta.url)); // Removed for CJS compatibility

// Database connection config
const config = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 20, // Max clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create a new pool
const pool = new Pool(config);

// Helper for single query
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV !== 'production') {
    // console.log('executed query', { text, duration, rows: res.rowCount });
  }

  return res;
};

// Helper for transaction
export const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  return client;
};

// Define a unified interface to mimic better-sqlite3's prepared statement style
// tailored for migration to minimize code changes in other files
export const db = {
  prepare: (text: string) => {
    return {
      get: async (...params: any[]) => {
        const res = await pool.query(text, params);
        return res.rows[0];
      },
      all: async (...params: any[]) => {
        const res = await pool.query(text, params);
        return res.rows;
      },
      run: async (...params: any[]) => {
        const res = await pool.query(text, params);
        return { changes: res.rowCount, lastInsertRowid: res.rows[0]?.id }; // CAUTION: IDs are UUIDs now
      }
    };
  },
  // Execute a raw query (used for schema init)
  exec: async (text: string) => {
    return await pool.query(text);
  },
  // Add a compatible 'transaction' method if needed, but for now we might need to refactor logic
  // that relies on synchronous transactions.
  // SQLite was sync, PG is async. This will break existing code.
  // We MUST refactor the calling code to be async.
};

// Initialize schema
const initDb = async () => {
  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log('✅ PostgreSQL Schema initialized');
    }
  } catch (err) {
    console.error('❌ Failed to initialize schema:', err);
  }
};

// Only run migration if explicitly requested or in dev
if (process.env.NODE_ENV !== 'test') {
  initDb();
}

export default pool;

