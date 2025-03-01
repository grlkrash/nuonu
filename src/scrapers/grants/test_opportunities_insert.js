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

async function testOpportunitiesInsert() {
  try {
    console.log('Attempting to insert a test record into the opportunities table...');
    
    // Create a test record with various fields that might match our grant data
    const testRecord = {
      // Common fields that might exist
      title: 'TEST RECORD - PLEASE DELETE',
      description: 'This is a test record to determine the structure of the opportunities table',
      amount: '$10,000',
      deadline: '2023-12-31',
      
      // Fields from our grant data
      categories: ['test', 'blockchain'],
      application_url: 'https://example.com/apply',
      link: 'https://example.com/test-opportunity',
      
      // Additional fields that might exist
      organization: 'Test Organization',
      location: 'Global',
      type: 'Grant',
      status: 'Open',
      
      // Add a unique identifier to make it easy to delete later
      test_id: 'test-' + Date.now()
    };
    
    // Attempt to insert the record
    const { data, error } = await supabase
      .from('opportunities')
      .insert([testRecord])
      .select();
    
    if (error) {
      console.error('Error inserting test record:', error);
      
      // If the error is about invalid columns, try to parse which ones are invalid
      if (error.message && error.message.includes('column')) {
        console.log('\nAnalyzing error message for column information...');
        const invalidColumnMatch = error.message.match(/column "([^"]+)" of relation "opportunities" does not exist/);
        if (invalidColumnMatch && invalidColumnMatch[1]) {
          const invalidColumn = invalidColumnMatch[1];
          console.log(`Invalid column detected: "${invalidColumn}"`);
          
          // Remove the invalid column and try again
          console.log(`Removing "${invalidColumn}" and trying again...`);
          delete testRecord[invalidColumn];
          
          const { data: retryData, error: retryError } = await supabase
            .from('opportunities')
            .insert([testRecord])
            .select();
          
          if (retryError) {
            console.error('Error on retry:', retryError);
          } else {
            console.log('Insert successful after removing invalid column!');
            console.log('Inserted record:', retryData);
          }
        }
      }
    } else {
      console.log('Insert successful!');
      console.log('Inserted record:', data);
      
      // Clean up the test record
      console.log('\nCleaning up test record...');
      const { error: deleteError } = await supabase
        .from('opportunities')
        .delete()
        .eq('test_id', testRecord.test_id);
      
      if (deleteError) {
        console.error('Error deleting test record:', deleteError);
      } else {
        console.log('Test record deleted successfully.');
      }
    }
    
    // Try to get the table structure by selecting with a limit of 0
    console.log('\nAttempting to get table structure...');
    const { data: structureData, error: structureError } = await supabase
      .from('opportunities')
      .select()
      .limit(0);
    
    if (structureError) {
      console.error('Error getting table structure:', structureError);
    } else {
      // Check the response for column information
      if (structureData && Array.isArray(structureData) && structureData.length === 0) {
        // We can't determine the structure from an empty array
        console.log('Could not determine table structure from empty response.');
      } else {
        console.log('Table structure information:', structureData);
      }
    }
    
  } catch (error) {
    console.error('Error in testOpportunitiesInsert:', error);
  }
}

// Run the test
testOpportunitiesInsert().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 