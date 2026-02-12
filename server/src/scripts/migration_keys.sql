-- Add API keys to users table
ALTER TABLE users ADD COLUMN openai_api_key TEXT;
ALTER TABLE users ADD COLUMN gemini_api_key TEXT;
ALTER TABLE users ADD COLUMN anthropic_api_key TEXT;
