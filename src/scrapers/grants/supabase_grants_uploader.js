require('dotenv').config({ path: '../../../.env' });
const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');

// Configuration
const ENHANCED_GRANTS_FILE = 'enhanced_grants.json';
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

async function createGrantsTable() {
  console.log('Attempting to create grants table...');
  
  try {
    // Try to create the table by inserting a test record
    // This is the most reliable way to create a table in Supabase
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
          application_url: null,
          link: 'https://example.com/test'
        }
      ]);
    
    if (insertError) {
      if (insertError.code === '42P01') {
        console.error('Failed to create grants table - table does not exist and could not be created automatically.');
        console.log('You may need to create the table manually in the Supabase dashboard.');
        
        // Provide instructions for manual table creation
        console.log('\nTo create the table manually:');
        console.log('1. Go to the Supabase dashboard');
        console.log('2. Navigate to the SQL Editor');
        console.log('3. Run the following SQL:');
        console.log(`
          CREATE TABLE public.grants (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            amount TEXT,
            deadline TEXT,
            description TEXT,
            categories TEXT[],
            application_url TEXT,
            link TEXT UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
        
        return false;
      } else {
        console.error('Error inserting test record:', insertError);
        return false;
      }
    } else {
      console.log('Successfully created grants table via test record insertion.');
      
      // Clean up the test record
      await supabase
        .from('grants')
        .delete()
        .eq('link', 'https://example.com/test');
      
      return true;
    }
  } catch (error) {
    console.error('Error creating grants table:', error);
    return false;
  }
}

async function checkTableExists() {
  try {
    // Try to select from the table to see if it exists
    const { data, error } = await supabase
      .from('grants')
      .select('count')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // Table doesn't exist
      return false;
    } else {
      // Table exists
      return true;
    }
  } catch (error) {
    console.error('Error checking if table exists:', error);
    return false;
  }
}

async function uploadGrantsToSupabase() {
  try {
    // Determine which file to use
    let grantsData;
    try {
      // Try to read from final report first
      const reportData = JSON.parse(await fs.readFile(FINAL_REPORT_FILE, 'utf8'));
      grantsData = reportData.grants;
      console.log(`Read ${grantsData.length} grants from ${FINAL_REPORT_FILE}`);
    } catch (error) {
      // If final report doesn't exist, try enhanced grants file
      try {
        grantsData = JSON.parse(await fs.readFile(ENHANCED_GRANTS_FILE, 'utf8'));
        console.log(`Read ${grantsData.length} grants from ${ENHANCED_GRANTS_FILE}`);
      } catch (enhancedError) {
        console.error(`Error reading grant data: ${enhancedError.message}`);
        return;
      }
    }
    
    // Check if the table exists
    const tableExists = await checkTableExists();
    
    // If the table doesn't exist, try to create it
    if (!tableExists) {
      const tableCreated = await createGrantsTable();
      if (!tableCreated) {
        console.error('Failed to create grants table. Exiting.');
        return;
      }
    } else {
      console.log('Grants table already exists.');
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