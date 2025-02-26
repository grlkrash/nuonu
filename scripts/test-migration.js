#!/usr/bin/env node

/**
 * Test script for the database migration
 * 
 * This script:
 * 1. Checks if the required environment variables are set
 * 2. Tests the connection to Supabase
 * 3. Checks if the opportunities table has a tags column
 * 
 * Usage:
 * node scripts/test-migration.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

// Check if required environment variables are set
console.log('Checking environment variables...')
if (!supabaseUrl) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not set in .env.local')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_KEY is not set in .env.local')
  process.exit(1)
}

console.log('✅ Environment variables are set')

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testMigration() {
  try {
    // Test connection to Supabase
    console.log('Testing connection to Supabase...')
    const { data, error } = await supabase.from('opportunities').select('count').limit(1)
    
    if (error) {
      console.error('Error connecting to Supabase:', error)
      process.exit(1)
    }
    
    console.log('✅ Successfully connected to Supabase')
    
    // Check if the opportunities table has a tags column
    console.log('Checking if the opportunities table has a tags column...')
    
    // We'll try to select the tags column from the opportunities table
    const { data: tagsData, error: tagsError } = await supabase
      .from('opportunities')
      .select('tags')
      .limit(1)
    
    if (tagsError && tagsError.message.includes('column "tags" does not exist')) {
      console.log('❌ The tags column does not exist in the opportunities table')
      console.log('Run the migration script to add the tags column:')
      console.log('npm run migrate')
    } else if (tagsError) {
      console.error('Error checking tags column:', tagsError)
    } else {
      console.log('✅ The tags column exists in the opportunities table')
      console.log('Migration has been successfully applied')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

testMigration() 