# 🤖 Clawd Bot - AI Assistant Control Plane

Deploy and manage AI assistants across Telegram, WhatsApp, Discord, Slack, and Email in under 2 minutes.

![React](https://img.shields.io/badge/React-18-blue?logo=react) ![Express](https://img.shields.io/badge/Express-4-green?logo=express) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- **10+ Specialized AI Assistants** — Email, Calendar, Smart Home, Wellness, and more
- **Multi-Channel Deployment** — Telegram, WhatsApp, Discord, Slack, Email
- **Real Platform Integration** — Telegram Bot API and WhatsApp Cloud API
- **Step-by-Step Setup Wizards** — Connect platforms with guided instructions
- **Message Logging** — Full history of incoming/outgoing messages
- **Approval Workflows** — Human-in-the-loop for sensitive actions
- **Beautiful UI** — Modern glassmorphism design with dark/light mode

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Mukesh1q2/Ai-Assistant.git
cd Ai-Assistant

# Install frontend dependencies
cd app
npm install

# Install backend dependencies
cd ../server
npm install
```

### Development

```bash
# Start backend (from /server)
npm run dev

# Start frontend (from /app in separate terminal)
npm run dev
```

### Seed Demo Account

```bash
curl -X POST http://localhost:3001/api/seed
```

**Demo Login:** `demo@clawd.ai` / `demo123`

## 📁 Project Structure

```
├── app/                    # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── sections/       # Page sections
│   │   ├── store/          # Zustand state
│   │   └── services/       # API client
│   └── public/             # Static assets
│
└── server/                 # Express backend
    ├── src/
    │   ├── integrations/   # Platform APIs
    │   ├── routes/         # API endpoints
    │   └── db.ts           # SQLite database
    └── data/               # Database file
```

## 🔗 Platform Integrations

| Platform | Status | Setup |
|----------|--------|-------|
| Telegram | ✅ Ready | BotFather token |
| WhatsApp | ✅ Ready | Meta Cloud API |
| Discord | 🚧 Planned | OAuth bot |
| Slack | 🚧 Planned | Workspace app |

## 🛠️ Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand, shadcn/ui

**Backend:** Express.js, better-sqlite3, bcrypt, JWT

## 📦 Deployment

### Vercel (Frontend)

1. Import repo to Vercel
2. Set root directory to `app`
3. Build command: `npm run build`
4. Output directory: `dist`

### Backend

Deploy to Railway, Render, or any Node.js host.

## 📄 License

MIT License

---

Design by [TheQbitLabs](https://theqbitlabs.com)
