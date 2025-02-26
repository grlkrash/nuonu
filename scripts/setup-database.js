#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// SQL for creating tables
const createTablesSql = `
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  social_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create artist_profiles table
CREATE TABLE IF NOT EXISTS artist_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  skills TEXT[],
  experience TEXT,
  portfolio_links TEXT[],
  blockchain_addresses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  reward NUMERIC,
  reward_currency TEXT,
  reward_token TEXT,
  blockchain TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  application_url TEXT,
  tags TEXT[],
  is_dao_proposal BOOLEAN DEFAULT FALSE,
  is_bounty BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES profiles(id) NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(artist_id, opportunity_id)
);

-- Create dao_proposals table
CREATE TABLE IF NOT EXISTS dao_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  dao_name TEXT NOT NULL,
  blockchain TEXT NOT NULL,
  proposal_hash TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fund_transactions table
CREATE TABLE IF NOT EXISTS fund_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES profiles(id) NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id),
  dao_proposal_id UUID REFERENCES dao_proposals(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  blockchain TEXT NOT NULL,
  transaction_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Artist profiles policies
CREATE POLICY "Public artist profiles are viewable by everyone"
  ON artist_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own artist profile"
  ON artist_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own artist profile"
  ON artist_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Opportunities policies
CREATE POLICY "Opportunities are viewable by everyone"
  ON opportunities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert opportunities"
  ON opportunities FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update opportunities"
  ON opportunities FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Applications policies
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  USING (auth.uid() = artist_id);

CREATE POLICY "Users can insert their own applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Users can update their own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = artist_id);

-- DAO proposals policies
CREATE POLICY "Public DAO proposals are viewable by everyone"
  ON dao_proposals FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own DAO proposals"
  ON dao_proposals FOR INSERT
  WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Users can update their own DAO proposals"
  ON dao_proposals FOR UPDATE
  USING (auth.uid() = artist_id);

-- Fund transactions policies
CREATE POLICY "Users can view their own fund transactions"
  ON fund_transactions FOR SELECT
  USING (auth.uid() = artist_id);

CREATE POLICY "Authenticated users can insert fund transactions"
  ON fund_transactions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update fund transactions"
  ON fund_transactions FOR UPDATE
  USING (auth.role() = 'authenticated');
`;

// Function to run the SQL
async function setupDatabase() {
  console.log('Setting up database tables...')
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTablesSql })
    
    if (error) {
      console.error('Error setting up database:', error)
      process.exit(1)
    }
    
    console.log('Database setup completed successfully!')
  } catch (err) {
    console.error('Error setting up database:', err)
    process.exit(1)
  }
}

// Run the setup
setupDatabase() 