-- Supabase Database Schema for Bitcoin Trading Simulation
-- This file contains the SQL to create tables, indexes, and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nickname TEXT NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 10000.00000000
);

-- Positions table
CREATE TABLE positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT DEFAULT 'BTC' NOT NULL,
    side TEXT CHECK (side IN ('LONG', 'SHORT')) NOT NULL,
    margin_mode TEXT CHECK (margin_mode IN ('CROSS', 'ISOLATED')) NOT NULL,
    leverage INTEGER CHECK (leverage >= 1 AND leverage <= 100) NOT NULL,
    entry_price DECIMAL(20, 8) NOT NULL,
    size DECIMAL(20, 8) NOT NULL,
    isolated_margin DECIMAL(20, 8),
    liquidation_price DECIMAL(20, 8) NOT NULL,
    take_profit_price DECIMAL(20, 8),
    stop_loss_price DECIMAL(20, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade history table
CREATE TABLE trade_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT CHECK (action IN ('OPEN', 'CLOSE', 'LIQUIDATION', 'TP', 'SL')) NOT NULL,
    side TEXT CHECK (side IN ('LONG', 'SHORT')) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    size DECIMAL(20, 8) NOT NULL,
    realized_pnl DECIMAL(20, 8),
    fee DECIMAL(20, 8),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users 
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for positions table
CREATE POLICY "Users can view own positions" ON positions 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions" ON positions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions" ON positions 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own positions" ON positions 
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for trade_history table
CREATE POLICY "Users can view own trade history" ON trade_history 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trade history" ON trade_history 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Note: For the liquidation bot, use Supabase service role key to bypass RLS for admin operations