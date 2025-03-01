require('dotenv').config({ path: '../../../.env' });
const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');

// Configuration
const FINAL_REPORT_FILE = 'final_grants_report.json';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 10 chars):', supabaseKey.substring(0, 10) + '...');

// Create Supabase client with explicit options
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function uploadGrantsToSupabase() {
  try {
    // Read the grants data from the final report
    let grantsData;
    try {
      const reportData = JSON.parse(await fs.readFile(FINAL_REPORT_FILE, 'utf8'));
      grantsData = reportData.grants;
      console.log(`Read ${grantsData.length} grants from ${FINAL_REPORT_FILE}`);
    } catch (error) {
      console.error(`Error reading grant data: ${error.message}`);
      return;
    }
    
    // Check if the table exists by trying to select from it
    const { data: checkData, error: checkError } = await supabase
      .from('grants')
      .select('count')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking grants table:', checkError);
      console.log('\nPlease create the grants table first using the SQL script:');
      console.log('1. Go to the Supabase dashboard');
      console.log('2. Navigate to the SQL Editor');
      console.log('3. Run the SQL script in create_grants_table.sql');
      return;
    }
    
    console.log('Grants table exists. Proceeding with data upload...');
    
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
          categories: Array.isArray(grant.categories) ? grant.categories : [],
          application_url: grant.applicationUrl || null,
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
    
    // Verify the data was inserted
    const { data, error } = await supabase
      .from('grants')
      .select('id, title')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error verifying inserted data:', error);
    } else {
      console.log(`Verified ${data.length} grants in the database:`);
      data.forEach(grant => {
        console.log(`  - ID: ${grant.id}, Title: ${grant.title}`);
      });
    }
    
  } catch (error) {
    console.error('Error in uploadGrantsToSupabase:', error);
  }
}

// Run the uploader
uploadGrantsToSupabase().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 