# Deployment Guide

## 1. Database Provisioning (Free Tier Recommendation: Neon)

For the best free-tier experience with PostgreSQL, we recommend **Neon** (neon.tech). It offers a generous free tier, instant provisioning, and scales to zero when not in use.

### Step-by-Step Setup
1. Go to [Neon.tech](https://neon.tech) and Sign Up (GitHub/Google).
2. Create a new **Project**.
3. Name it `clawd-bot` (or similar).
4. Select a region close to you (e.g., US East, Europe).
5. **Copy the Connection String**: It will look like `postgres://user:pass@ep-xyz.region.neon.tech/neondb?sslmode=require`.

This is your `DATABASE_URL`.

### Alternative: Supabase
1. Go to [Supabase.com](https://supabase.com).
2. Create a new Project.
3. Go to **Project Settings** -> **Database**.
4. Scroll down to "Connection parameters" to find your connection string. NOTE: You need the "Transaction Mode" connection string (port 6543) for serverless environments.

---

## 2. Environment Configuration

You will need to set these environment variables in your deployment platform (Vercel, Railway, etc.):

- `DATABASE_URL`: The string you found above.
- `JWT_SECRET`: A long random string (e.g., generate with `openssl rand -hex 32`).
- `CLIENT_URL`: The URL of your deployed frontend (e.g., `https://clawd-bot.vercel.app`).
- `ADMIN_KEY`: A secret key for administrative actions (like seeding).

---

## 3. Database Migration

Once you have your `DATABASE_URL`, you need to create the tables. You can:

### Option A: Run Script Locally (Recommended)
1. In your local terminal (Project Root):
   ```bash
   # Linux/Mac
   export DATABASE_URL="your_connection_string_here"
   npm run db:migrate

   # Windows PowerShell
   $env:DATABASE_URL="your_connection_string_here"
   npm run db:migrate
   ```

### Option B: Run SQL Manually
1. Open the [SQL Editor](https://console.neon.tech/app/projects) in your Neon dashboard.
2. Copy the content of `server/schema.sql`.
3. Paste and Run.

---

## 4. Application Deployment (Vercel)

We recommend **Vercel** for hosting both the frontend and backend.

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root.
3. Follow the prompts.
4. Add Environment Variables in the Vercel Dashboard.

