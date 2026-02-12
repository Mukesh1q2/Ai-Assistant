-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  role VARCHAR(50) DEFAULT 'owner',
  status VARCHAR(50) DEFAULT 'active',
  theme VARCHAR(50) DEFAULT 'system',
  notifications INTEGER DEFAULT 1,
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  plan_tier VARCHAR(50) DEFAULT 'free',
  execution_quota INTEGER DEFAULT 1000,
  used_executions INTEGER DEFAULT 0,
  channel_limit INTEGER DEFAULT 3,
  pack_limit INTEGER DEFAULT 5,
  family_seats INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Bots Table
CREATE TABLE IF NOT EXISTS bots (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  avatar VARCHAR(255) DEFAULT '/bots/default.png',
  status VARCHAR(50) DEFAULT 'inactive',
  type VARCHAR(50) NOT NULL,
  personality TEXT DEFAULT 'friendly and helpful',
  memory_scope VARCHAR(50) DEFAULT 'user',
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  uptime INTEGER DEFAULT 100,
  last_active_at TIMESTAMP WITH TIME ZONE,
  task_packs TEXT DEFAULT '[]',
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Channels Table
CREATE TABLE IF NOT EXISTS channels (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'disconnected',
  token TEXT,
  webhook TEXT,
  guild_id VARCHAR(255),
  channel_id VARCHAR(255),
  phone_number VARCHAR(50),
  connected_at TIMESTAMP WITH TIME ZONE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Platform Integrations Table
CREATE TABLE IF NOT EXISTS platform_integrations (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Common fields
  bot_token TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  
  -- Telegram-specific
  telegram_bot_id VARCHAR(255),
  telegram_bot_username VARCHAR(255),
  
  -- WhatsApp-specific
  whatsapp_phone_number_id VARCHAR(255),
  whatsapp_business_account_id VARCHAR(255),
  whatsapp_access_token TEXT,
  whatsapp_verify_token VARCHAR(255),
  whatsapp_display_number VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(255) PRIMARY KEY,
  integration_id VARCHAR(255) NOT NULL REFERENCES platform_integrations(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  direction VARCHAR(20) NOT NULL,
  chat_id VARCHAR(255) NOT NULL,
  user_id_external VARCHAR(255),
  username VARCHAR(255),
  user_name VARCHAR(255),
  message_text TEXT,
  message_type VARCHAR(50) DEFAULT 'text',
  platform_message_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'received',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_integration ON messages(integration_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_user ON platform_integrations(user_id);
