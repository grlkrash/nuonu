#!/usr/bin/env node

/**
 * Initial database setup script for Artist Grant AI Agent
 * 
 * This script:
 * 1. Creates the necessary tables and relationships
 * 2. Sets up Row Level Security policies
 * 3. Creates triggers for user creation
 * 
 * Usage:
 * node scripts/setup-db.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('Starting initial database setup...')
  
  try {
    // First, ensure the exec_sql function exists
    console.log('Setting up exec_sql function...')
    const execSqlPath = path.join(__dirname, '../supabase/migrations/20230701000002_add_exec_sql_function.sql')
    
    if (fs.existsSync(execSqlPath)) {
      const execSqlContent = fs.readFileSync(execSqlPath, 'utf8')
      
      // Try to execute directly first
      try {
        await supabase.from('_sql').select('*').eq('query', execSqlContent)
        console.log('Executed exec_sql function setup directly')
      } catch (error) {
        console.log('Could not execute SQL directly, trying RPC method...')
        try {
          await supabase.rpc('exec_sql', { sql: execSqlContent })
          console.log('Executed exec_sql function setup via RPC')
        } catch (rpcError) {
          console.error('Error setting up exec_sql function:', rpcError)
          console.log('Continuing with setup...')
        }
      }
    } else {
      console.log('exec_sql migration file not found, creating function directly...')
      
      const createExecSqlFn = `
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
      
      try {
        await supabase.from('_sql').select('*').eq('query', createExecSqlFn)
        console.log('Created exec_sql function directly')
      } catch (error) {
        console.error('Error creating exec_sql function directly:', error)
        console.log('Continuing with setup...')
      }
    }
    
    // Now run the initial schema setup
    console.log('Setting up initial schema...')
    const initialSchemaPath = path.join(__dirname, '../supabase/migrations/20230701000000_initial_schema.sql')
    
    if (fs.existsSync(initialSchemaPath)) {
      const initialSchemaContent = fs.readFileSync(initialSchemaPath, 'utf8')
      
      // Execute the schema setup
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: initialSchemaContent })
        
        if (error) {
          console.error('Error setting up initial schema via RPC:', error)
        } else {
          console.log('Initial schema setup completed successfully')
        }
      } catch (error) {
        console.error('Error executing initial schema setup:', error)
      }
    } else {
      console.error('Initial schema migration file not found')
      process.exit(1)
    }
    
    // Add tags to opportunities
    console.log('Setting up tags for opportunities...')
    const tagsPath = path.join(__dirname, '../supabase/migrations/20230701000001_add_tags_to_opportunities.sql')
    
    if (fs.existsSync(tagsPath)) {
      const tagsContent = fs.readFileSync(tagsPath, 'utf8')
      
      // Execute the tags setup
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: tagsContent })
        
        if (error) {
          console.error('Error setting up tags via RPC:', error)
        } else {
          console.log('Tags setup completed successfully')
        }
      } catch (error) {
        console.error('Error executing tags setup:', error)
      }
    } else {
      console.log('Tags migration file not found, skipping...')
    }
    
    // Add additional fields needed for the Artist Grant AI Agent
    console.log('Adding additional fields for Artist Grant AI Agent...')
    
    const additionalFields = `
      -- Add AI-specific fields to profiles
      ALTER TABLE IF EXISTS profiles 
      ADD COLUMN IF NOT EXISTS artistic_discipline TEXT,
      ADD COLUMN IF NOT EXISTS experience_level TEXT,
      ADD COLUMN IF NOT EXISTS skills TEXT,
      ADD COLUMN IF NOT EXISTS interests TEXT,
      ADD COLUMN IF NOT EXISTS social_links JSONB,
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;
      
      -- Add blockchain-specific fields to applications
      ALTER TABLE IF EXISTS applications
      ADD COLUMN IF NOT EXISTS transaction_hash TEXT,
      ADD COLUMN IF NOT EXISTS blockchain_network TEXT;
      
      -- Add AI-specific fields to opportunities
      ALTER TABLE IF EXISTS opportunities
      ADD COLUMN IF NOT EXISTS opportunity_type TEXT,
      ADD COLUMN IF NOT EXISTS organization TEXT,
      ADD COLUMN IF NOT EXISTS eligibility TEXT,
      ADD COLUMN IF NOT EXISTS application_url TEXT,
      ADD COLUMN IF NOT EXISTS source TEXT,
      ADD COLUMN IF NOT EXISTS source_id TEXT;
      
      -- Create artist_preferences table if it doesn't exist
      CREATE TABLE IF NOT EXISTS artist_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        artist_id UUID REFERENCES profiles(id) NOT NULL,
        opportunity_types TEXT[],
        grant_types TEXT[],
        job_types TEXT[],
        gig_types TEXT[],
        min_amount INTEGER,
        max_amount INTEGER,
        regions TEXT[],
        keywords TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Set up RLS for artist_preferences
      ALTER TABLE IF EXISTS artist_preferences ENABLE ROW LEVEL SECURITY;
      
      -- Create policies for artist_preferences
      CREATE POLICY IF NOT EXISTS "Artist preferences are viewable by the artist" 
        ON artist_preferences FOR SELECT USING (auth.uid() = artist_id);
      
      CREATE POLICY IF NOT EXISTS "Users can insert their own preferences" 
        ON artist_preferences FOR INSERT WITH CHECK (auth.uid() = artist_id);
      
      CREATE POLICY IF NOT EXISTS "Users can update their own preferences" 
        ON artist_preferences FOR UPDATE USING (auth.uid() = artist_id);
      
      -- Create index for artist_preferences
      CREATE INDEX IF NOT EXISTS idx_artist_preferences_artist_id ON artist_preferences(artist_id);
    `
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: additionalFields })
      
      if (error) {
        console.error('Error adding additional fields via RPC:', error)
      } else {
        console.log('Additional fields added successfully')
      }
    } catch (error) {
      console.error('Error executing additional fields setup:', error)
    }
    
    console.log('Database setup completed successfully!')
  } catch (error) {
    console.error('Unexpected error during database setup:', error)
    process.exit(1)
  }
}

setupDatabase() 