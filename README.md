# BTC Trading Simulation

A Bitcoin long/short trading simulation web application built with Next.js, Supabase, and Node.js.

## Features

- Real-time BTC/USDT trading simulation
- 1x to 100x leverage
- Cross/Isolated margin modes
- Take Profit / Stop Loss
- 24/7 liquidation bot
- Leaderboard and trade history
- Mobile responsive design

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, TradingView Lightweight Charts, Zustand
- **Backend**: Node.js (Liquidation Bot)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Real-time Data**: Binance WebSocket API

## Setup & Deployment

### Prerequisites

1. GitHub account
2. Supabase account (https://supabase.com)
3. Vercel account (https://vercel.com)
4. Koyeb account (https://koyeb.com)

### 1. Supabase Setup

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in project details:
   - Name: btc-trading-simulation
   - Database Password: Choose a strong password
   - Region: Select closest to you
4. Wait for project creation (takes a few minutes)
5. Go to SQL Editor in the left sidebar
6. Copy the contents of `supabase/schema.sql` and paste it into the SQL Editor
7. Click "Run" to execute the schema
8. Go to Settings > API in the left sidebar
9. Copy the following values:
   - Project URL
   - anon public key
   - service_role secret key (keep this secret!)

### 2. GitHub Repository

1. Go to https://github.com and sign up/login
2. Click "New repository"
3. Repository name: btc-trading-simulation
4. Make it public or private (your choice)
5. Don't initialize with README
6. Click "Create repository"
7. Follow the instructions to push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/btc-trading-simulation.git
   git push -u origin main
   ```

### 3. Vercel Deployment (Frontend)

1. Go to https://vercel.com and sign up/login with GitHub
2. Click "Import Project"
3. Select your GitHub repository "btc-trading-simulation"
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./ (leave default)
5. Click "Deploy"
6. Wait for deployment to complete
7. Go to Project Settings > Environment Variables
8. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon public key
9. Click "Save"
10. Redeploy the project to apply environment variables

### 4. Koyeb Deployment (Bot)

1. Go to https://koyeb.com and sign up/login
2. Click "Create App" > "GitHub"
3. Connect your GitHub account
4. Select the "btc-trading-simulation" repository
5. Configure deployment:
   - Runtime: Node.js
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Working Directory: bot
6. Add Environment Variables:
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service_role secret key
7. Click "Deploy"
8. Wait for deployment to complete

### 5. Final Configuration

1. In Supabase Dashboard, go to Authentication > URL Configuration
2. Set Site URL to your Vercel deployment URL (e.g., https://btc-trading-simulation.vercel.app)
3. Set Redirect URLs to:
   - https://btc-trading-simulation.vercel.app/auth/callback
4. Save changes

### 6. Test the Application

1. Visit your Vercel URL
2. Sign up with email/password
3. You should receive $10,000 initial balance
4. Try placing a trade
5. Check leaderboard and history pages

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd bot && npm install && cd ..
   ```
3. Create `.env.local` file with your Supabase keys
4. Run frontend: `npm run dev`
5. Run bot: `cd bot && npm start`

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Bot (Koyeb Environment Variables)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Support

If you encounter issues:
1. Check Vercel/Koyeb deployment logs
2. Verify environment variables are set correctly
3. Ensure Supabase schema is applied
4. Check browser console for errors