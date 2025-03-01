require('dotenv').config({ path: '../../../.env' });
const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const ENHANCED_GRANTS_FILE = 'enhanced_grants.json';

// Create grants table in Supabase if it doesn't exist
async function createGrantsTable() {
  console.log('Checking if grants table exists...');
  
  try {
    // Check if the table exists by trying to select from it
    const { error } = await supabase
      .from('grants')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('Creating grants table...');
      
      // Try different methods to create the table
      try {
        // Method 1: Using RPC
        const { error: createError } = await supabase.rpc('create_grants_table');
        
        if (createError) {
          console.log('RPC method not found, trying to create table directly...');
          
          // Method 2: Try to create the table by inserting a test record
          console.log('Attempting to create table by inserting a test record...');
          const { error: insertError } = await supabase
            .from('grants')
            .insert([
              {
                title: 'Test Grant',
                amount: 'Test Amount',
                deadline: 'Test Deadline',
                description: 'Test Description',
                categories: ['Test Category'],
                link: 'https://example.com/test'
              }
            ]);
          
          if (insertError) {
            console.error('Failed to create grants table:', insertError);
            return false;
          }
          
          // Delete the test record
          await supabase
            .from('grants')
            .delete()
            .eq('link', 'https://example.com/test');
        }
      } catch (error) {
        console.error('Error creating grants table:', error);
        return false;
      }
    } else {
      console.log('Grants table already exists.');
    }
    
    return true;
  } catch (error) {
    console.error('Error checking or creating grants table:', error);
    return false;
  }
}

// Upload grants to Supabase
async function uploadGrantsToSupabase() {
  try {
    // Read the enhanced grants data
    const grantsData = JSON.parse(await fs.readFile(ENHANCED_GRANTS_FILE, 'utf8'));
    console.log(`Read ${grantsData.length} grants from ${ENHANCED_GRANTS_FILE}`);
    
    // Ensure the grants table exists
    const tableCreated = await createGrantsTable();
    if (!tableCreated) {
      console.error('Failed to create or verify grants table. Exiting.');
      return;
    }
    
    // Process and insert each grant
    let successCount = 0;
    for (const grant of grantsData) {
      try {
        console.log(`Processing grant: ${grant.title}`);
        
        // Format the data for Supabase
        const formattedGrant = {
          title: grant.title,
          amount: grant.amount,
          deadline: grant.deadline,
          description: grant.description,
          categories: grant.categories || [],
          application_url: grant.applicationUrl || '',
          link: grant.link
        };
        
        // Insert the grant into Supabase
        const { error } = await supabase
          .from('grants')
          .upsert([formattedGrant], {
            onConflict: 'link',
            returning: 'minimal'
          });
        
        if (error) {
          console.error(`Error inserting grant "${grant.title}":`, error);
        } else {
          console.log(`Successfully inserted grant: ${grant.title}`);
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing grant "${grant.title}":`, error);
      }
    }
    
    console.log(`Inserted ${successCount} out of ${grantsData.length} grants into Supabase.`);
    
  } catch (error) {
    console.error('Error reading or processing grants data:', error);
  }
}

// Run the uploader
uploadGrantsToSupabase().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 