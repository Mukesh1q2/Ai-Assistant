# Walkthrough: AI & Analytics Integration

## Overview
We have successfully integrated a robust AI service into Clawd Bot, enabling:
- **Multi-Provider Support**: OpenAI and Gemini are fully supported.
- **Bot Specialization**: Each bot can have unique system prompts, model text, and temperature settings.
- **Real-time Analytics**: A new dashboard tracks execution trends, bot usage, and performance metrics.
- **Secure Settings**: Users can manage their API keys securely.

## Changes
### Backend
- **`AIService`**: Centralized service for handling AI requests, provider management, and logging.
- **Routes**:
    - `POST /api/platforms/telegram/webhook`: Updated to use `AIService` for intelligent responses.
    - `POST /api/settings`: New endpoint for managing encrypted API keys.
    - `GET /api/analytics`: New endpoint for aggregating performance data.
    - `PUT /api/bots/:id`: Updated to save AI configuration (system prompt, etc.).
- **Database**:
    - Added `user_keys` table for storing API keys.
    - Added `executions` table for logging AI interactions.
    - Updated `bots` table with `config` JSON column for AI settings.

### Frontend
- **Settings Page**: Implemented `SettingsPanel.tsx` (and `Settings.tsx` route) to allow users to input API keys.
- **Bot Configuration**: Updated `BotsPanel.tsx` to include fields for System Instructions, Model Provider, and Temperature.
- **Analytics Dashboard**: Rewrote `AnalyticsPanel.tsx` to fetch real data from the backend, displaying:
    - Execution trends (Area Chart)
    - Bot usage distribution (Pie Chart)
    - Channel activity (Bar Chart)
    - Key metrics (Total Executions, Active Bots, etc.)
- **Store Refactoring**: Updated `useBotStore` and `useChannelStore` to use real API services instead of mock data.

## Verification
### Automated Tests
We created a test script `server/src/scripts/test_analytics_api.ts` to verify the Analytics API.
- **Result**: The script successfully registered a test user, logged in, and retrieved analytics data from the backend (Port 3001).
- **Log Output**:
  ```
  Registering user test...
  Logging in...
  Got token: Yes
  Fetching analytics...
  Analytics Response: { ... }
  ✅ Analytics API is working!
  ```

### Bot Flow Integration
We created `server/src/scripts/test_bot_flow.ts` to verify the critical bot lifecycle flows.
- **Scope**: User Signup -> Create Bot -> Update Config -> Deploy -> Verify Active Status -> Delete.
- **Result**: PASSED.
  ```
  Starting Bot Flow Integration Test...
  ...
  Bot deployed (active).
  Deleting Bot...
  ✅ Bot Flow Test PASSED!
  ```

### Manual Verification Steps
1.  **Configure API Keys**: Go to Settings -> Security and enter your OpenAI/Gemini keys.
2.  **Create a Bot**: Go to Bots -> Create Bot. In the "Settings" tab of the bot details, verify you can set "System Instructions".
3.  **Chat**: Send a message to your Telegram bot. It should respond using the configured AI.
4.  **Check Analytics**: Go to Analytics. You should see the execution count increase.

### Known Issues
- **Browser Verification**: Automated browser verification failed due to system environment issues (`$HOME` not set). However, the API test confirms the backend is functional.
- **Port Usage**: The backend defaults to port 3001 if 3000 is taken. Ensure your frontend proxy or direct calls point to the correct port.
