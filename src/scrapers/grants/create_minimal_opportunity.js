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

async function createMinimalOpportunity() {
  try {
    console.log('Attempting to create a minimal valid opportunity record...');
    
    // Based on the previous test, we know title and description are required
    // Let's try a minimal record with just these fields
    const minimalRecord = {
      title: 'TEST OPPORTUNITY - PLEASE DELETE',
      description: 'This is a test opportunity to determine the minimal required fields.'
    };
    
    const { data, error } = await supabase
      .from('opportunities')
      .insert([minimalRecord])
      .select();
    
    if (error) {
      console.error('Error creating minimal record:', error);
      
      // Try to identify what's missing
      if (error.message && error.message.includes('violates not-null constraint')) {
        const match = error.message.match(/column "([^"]+)" of relation "opportunities" violates not-null constraint/);
        if (match && match[1]) {
          const missingField = match[1];
          console.log(`Missing required field: "${missingField}"`);
          
          // Add the missing field with a placeholder value
          minimalRecord[missingField] = `Test ${missingField}`;
          
          console.log(`Trying again with added field "${missingField}"...`);
          const { data: retryData, error: retryError } = await supabase
            .from('opportunities')
            .insert([minimalRecord])
            .select();
          
          if (retryError) {
            console.error('Error on retry:', retryError);
          } else {
            console.log('Insert successful after adding missing field!');
            console.log('Inserted record:', retryData);
            
            // Try to get all fields from the inserted record
            const { data: fullRecord, error: fullError } = await supabase
              .from('opportunities')
              .select('*')
              .eq('id', retryData[0].id)
              .single();
            
            if (fullError) {
              console.error('Error getting full record:', fullError);
            } else {
              console.log('\nFull record structure:');
              Object.entries(fullRecord).forEach(([key, value]) => {
                const type = Array.isArray(value) ? `array[${value.length}]` : 
                             value === null ? 'null' : typeof value;
                console.log(`- ${key}: ${type}`);
              });
            }
            
            // Clean up
            await cleanupTestRecord(retryData[0].id);
          }
        }
      }
    } else {
      console.log('Insert successful!');
      console.log('Inserted record:', data);
      
      // Try to get all fields from the inserted record
      const { data: fullRecord, error: fullError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', data[0].id)
        .single();
      
      if (fullError) {
        console.error('Error getting full record:', fullError);
      } else {
        console.log('\nFull record structure:');
        Object.entries(fullRecord).forEach(([key, value]) => {
          const type = Array.isArray(value) ? `array[${value.length}]` : 
                       value === null ? 'null' : typeof value;
          console.log(`- ${key}: ${type}`);
        });
      }
      
      // Clean up
      await cleanupTestRecord(data[0].id);
    }
    
    // Try with status field as it seems to be an enum
    console.log('\nTrying with status field (enum)...');
    const statusRecord = {
      title: 'TEST OPPORTUNITY WITH STATUS - PLEASE DELETE',
      description: 'This is a test opportunity with status field.',
      status: 'open' // Try lowercase as it's common for enums
    };
    
    const { data: statusData, error: statusError } = await supabase
      .from('opportunities')
      .insert([statusRecord])
      .select();
    
    if (statusError) {
      console.error('Error creating record with status:', statusError);
      
      // Try different status values
      for (const statusValue of ['OPEN', 'CLOSED', 'PENDING', 'ACTIVE', 'INACTIVE']) {
        console.log(`Trying status value: "${statusValue}"...`);
        const { data: retryData, error: retryError } = await supabase
          .from('opportunities')
          .insert([{...statusRecord, status: statusValue}])
          .select();
        
        if (retryError) {
          console.error(`Error with status "${statusValue}":`, retryError);
        } else {
          console.log(`Success with status "${statusValue}"!`);
          await cleanupTestRecord(retryData[0].id);
          break;
        }
      }
    } else {
      console.log('Insert with status successful!');
      await cleanupTestRecord(statusData[0].id);
    }
    
  } catch (error) {
    console.error('Error in createMinimalOpportunity:', error);
  }
}

async function cleanupTestRecord(id) {
  console.log(`Cleaning up test record with ID: ${id}...`);
  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting test record:', error);
  } else {
    console.log('Test record deleted successfully.');
  }
}

// Run the function
createMinimalOpportunity().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 