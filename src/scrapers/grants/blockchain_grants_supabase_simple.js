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

// Upload grants to Supabase
async function uploadGrantsToSupabase() {
  try {
    // Read the enhanced grants data
    const grantsData = JSON.parse(await fs.readFile(ENHANCED_GRANTS_FILE, 'utf8'));
    console.log(`Read ${grantsData.length} grants from ${ENHANCED_GRANTS_FILE}`);
    
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