/**
 * Database setup using better-sqlite3
 * Compatible with Node.js 24
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'clawd.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    role TEXT DEFAULT 'owner',
    status TEXT DEFAULT 'active',
    theme TEXT DEFAULT 'system',
    notifications INTEGER DEFAULT 1,
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    plan_tier TEXT DEFAULT 'free',
    execution_quota INTEGER DEFAULT 1000,
    used_executions INTEGER DEFAULT 0,
    channel_limit INTEGER DEFAULT 3,
    pack_limit INTEGER DEFAULT 5,
    family_seats INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_login_at TEXT
  );

  CREATE TABLE IF NOT EXISTS bots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    avatar TEXT DEFAULT '/bots/default.png',
    status TEXT DEFAULT 'inactive',
    type TEXT NOT NULL,
    personality TEXT DEFAULT 'friendly and helpful',
    memory_scope TEXT DEFAULT 'user',
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    uptime INTEGER DEFAULT 100,
    last_active_at TEXT,
    task_packs TEXT DEFAULT '[]',
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'disconnected',
    token TEXT,
    webhook TEXT,
    guild_id TEXT,
    channel_id TEXT,
    phone_number TEXT,
    connected_at TEXT,
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS platform_integrations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    
    -- Common fields
    bot_token TEXT,
    webhook_url TEXT,
    webhook_secret TEXT,
    
    -- Telegram-specific
    telegram_bot_id TEXT,
    telegram_bot_username TEXT,
    
    -- WhatsApp-specific
    whatsapp_phone_number_id TEXT,
    whatsapp_business_account_id TEXT,
    whatsapp_access_token TEXT,
    whatsapp_verify_token TEXT,
    whatsapp_display_number TEXT,
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    integration_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    direction TEXT NOT NULL,
    chat_id TEXT NOT NULL,
    user_id_external TEXT,
    username TEXT,
    user_name TEXT,
    message_text TEXT,
    message_type TEXT DEFAULT 'text',
    platform_message_id TEXT,
    status TEXT DEFAULT 'received',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (integration_id) REFERENCES platform_integrations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_integration ON messages(integration_id);
  CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
  CREATE INDEX IF NOT EXISTS idx_platform_integrations_user ON platform_integrations(user_id);
`);

console.log('✅ Database initialized at', dbPath);

export default db;
export { db };
