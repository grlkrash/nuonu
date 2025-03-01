require('dotenv').config({ path: '../../../.env' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 10 chars):', supabaseKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOpportunitiesTable() {
  try {
    console.log('Checking opportunities table structure...');
    
    // Check if the table exists by trying to select from it
    const { data: checkData, error: checkError } = await supabase
      .from('opportunities')
      .select('count')
      .limit(1);
    
    if (checkError) {
      console.error('Error accessing opportunities table:', checkError);
      return;
    }
    
    console.log('Opportunities table exists.');
    
    // Try to get the table structure using system tables
    try {
      console.log('\nAttempting to get table columns...');
      const { data: columns, error } = await supabase
        .rpc('get_table_columns', { table_name: 'opportunities' });
      
      if (error) {
        console.error('Error getting table columns using RPC:', error);
      } else {
        console.log('Columns in opportunities table:');
        columns.forEach(column => {
          console.log(`- ${column.column_name} (${column.data_type})`);
        });
      }
    } catch (error) {
      console.error('Exception when getting table columns:', error);
    }
    
    // Alternative approach: Get a sample record
    console.log('\nGetting a sample record from opportunities table...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('opportunities')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error getting sample record:', sampleError);
    } else if (sampleData && sampleData.length > 0) {
      console.log('Sample record structure:');
      const sample = sampleData[0];
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        console.log(`- ${key}: ${type}`);
      });
    } else {
      console.log('No records found in the opportunities table.');
    }
    
    // Get count of records
    const { data: countData, error: countError } = await supabase
      .from('opportunities')
      .select('count');
    
    if (countError) {
      console.error('Error getting record count:', countError);
    } else {
      console.log(`\nTotal records in opportunities table: ${countData[0].count}`);
    }
    
  } catch (error) {
    console.error('Error checking opportunities table:', error);
  }
}

// Run the check
checkOpportunitiesTable().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 