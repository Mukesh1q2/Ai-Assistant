-- Add AI configuration to bots table
ALTER TABLE bots ADD COLUMN system_prompt TEXT;
ALTER TABLE bots ADD COLUMN model_provider VARCHAR(50) DEFAULT 'openai'; -- openai, gemini, anthropic, ollama
ALTER TABLE bots ADD COLUMN model_name VARCHAR(100); -- gpt-4, gemini-pro, claude-3, etc.
ALTER TABLE bots ADD COLUMN temperature FLOAT DEFAULT 0.7;

-- Create executions table for analytics
CREATE TABLE IF NOT EXISTS executions (
  id VARCHAR(36) PRIMARY KEY,
  bot_id VARCHAR(36) REFERENCES bots(id) ON DELETE CASCADE,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  integration_id VARCHAR(36) REFERENCES platform_integrations(id) ON DELETE SET NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  cost FLOAT,
  status VARCHAR(20), -- success, failed
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for analytics queries
CREATE INDEX idx_executions_bot_created ON executions(bot_id, created_at);
CREATE INDEX idx_executions_user_created ON executions(user_id, created_at);
