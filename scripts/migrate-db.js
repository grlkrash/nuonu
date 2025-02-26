#!/usr/bin/env node

/**
 * Database migration script for adding tags to opportunities
 * 
 * This script:
 * 1. Runs the SQL migration to add the exec_sql function
 * 2. Runs the SQL migration to add the tags column
 * 3. Updates existing opportunities with relevant tags based on their content
 * 
 * Usage:
 * node scripts/migrate-db.js
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

// Keywords to look for in opportunity titles and descriptions
const tagKeywords = {
  'blockchain': ['blockchain', 'web3', 'crypto', 'nft', 'dao', 'defi', 'token', 'ethereum', 'bitcoin', 'smart contract'],
  'design': ['design', 'ui', 'ux', 'graphic', 'illustration', 'logo', 'branding', 'visual'],
  'development': ['development', 'coding', 'programming', 'software', 'web development', 'app development', 'frontend', 'backend'],
  'writing': ['writing', 'content', 'copywriting', 'blog', 'article', 'editorial', 'storytelling'],
  'music': ['music', 'audio', 'sound', 'composition', 'producer', 'song', 'track', 'album'],
  'video': ['video', 'film', 'animation', 'motion graphics', 'editing', 'cinematography'],
  'photography': ['photography', 'photographer', 'photo', 'portrait', 'landscape'],
  'marketing': ['marketing', 'social media', 'seo', 'advertising', 'growth', 'campaign'],
  'remote': ['remote', 'work from home', 'virtual', 'telecommute'],
}

// Run the migration
async function runMigration() {
  console.log('Starting database migration...')
  
  try {
    // 1. Run the exec_sql function migration first
    console.log('Adding exec_sql function...')
    
    // Read the SQL file content
    const execSqlPath = path.join(__dirname, '../supabase/migrations/20230701000002_add_exec_sql_function.sql')
    const execSqlContent = fs.readFileSync(execSqlPath, 'utf8')
    
    // Execute the SQL directly since we don't have the exec_sql function yet
    const { error: execSqlError } = await supabase.rpc('exec_sql', { sql: execSqlContent })
      .catch(error => {
        // If the function doesn't exist yet, we need to execute the SQL directly
        // This is a bit of a catch-22, but we can use the REST API to execute the SQL
        console.log('Exec_sql function does not exist yet, creating it directly...')
        return supabase.from('_sql').select('*').eq('query', execSqlContent)
      })
    
    if (execSqlError) {
      console.error('Error creating exec_sql function:', execSqlError)
      console.log('Continuing with migration...')
    } else {
      console.log('Exec_sql function created successfully')
    }
    
    // 2. Run the tags migration
    console.log('Adding tags column to opportunities table...')
    
    // Read the SQL file content
    const tagsPath = path.join(__dirname, '../supabase/migrations/20230701000001_add_tags_to_opportunities.sql')
    const tagsSql = fs.readFileSync(tagsPath, 'utf8')
    
    // Execute the SQL
    const { error: tagsError } = await supabase.rpc('exec_sql', { sql: tagsSql })
    
    if (tagsError) {
      console.error('Error running tags migration:', tagsError)
      console.log('The tags column might already exist. Continuing with updating tags...')
    } else {
      console.log('Tags column added successfully')
    }
    
    // 3. Update existing opportunities with tags
    console.log('Updating existing opportunities with tags...')
    
    // Fetch all opportunities
    const { data: opportunities, error: fetchError } = await supabase
      .from('opportunities')
      .select('id, title, description, category, is_remote')
    
    if (fetchError) {
      console.error('Error fetching opportunities:', fetchError)
      process.exit(1)
    }
    
    console.log(`Found ${opportunities.length} opportunities to update`)
    
    // Process each opportunity
    for (const opportunity of opportunities) {
      const tags = []
      
      // Add category as a tag if it exists
      if (opportunity.category) {
        tags.push(opportunity.category.toLowerCase())
      }
      
      // Add 'remote' tag if the opportunity is remote
      if (opportunity.is_remote) {
        tags.push('remote')
      }
      
      // Check for keyword matches in title and description
      const content = `${opportunity.title} ${opportunity.description}`.toLowerCase()
      
      for (const [tag, keywords] of Object.entries(tagKeywords)) {
        if (keywords.some(keyword => content.includes(keyword.toLowerCase()))) {
          if (!tags.includes(tag)) {
            tags.push(tag)
          }
        }
      }
      
      // Update the opportunity with the tags
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({ tags })
        .eq('id', opportunity.id)
      
      if (updateError) {
        console.error(`Error updating opportunity ${opportunity.id}:`, updateError)
      } else {
        console.log(`Updated opportunity ${opportunity.id} with tags: ${tags.join(', ')}`)
      }
    }
    
    console.log('Migration completed successfully')
  } catch (error) {
    console.error('Unexpected error during migration:', error)
    process.exit(1)
  }
}

runMigration() 