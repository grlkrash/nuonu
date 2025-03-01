require('dotenv').config({ path: '../../../.env' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

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

async function testWithUUID() {
  try {
    console.log('Attempting to create a record with a valid UUID for creator_id...');
    
    // Generate a valid UUID for creator_id
    const creatorId = uuidv4();
    console.log(`Generated UUID: ${creatorId}`);
    
    // Create a record with the UUID
    const testRecord = {
      title: 'TEST OPPORTUNITY WITH UUID - PLEASE DELETE',
      description: 'This is a test opportunity with a valid UUID for creator_id.',
      creator_id: creatorId
    };
    
    const { data, error } = await supabase
      .from('opportunities')
      .insert([testRecord])
      .select();
    
    if (error) {
      console.error('Error creating record with UUID:', error);
    } else {
      console.log('Insert successful!');
      console.log('Inserted record:', data);
      
      // Get the full record to see all fields
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
          console.log(`- ${key}: ${type} ${value !== null ? `= ${JSON.stringify(value)}` : ''}`);
        });
      }
      
      // Clean up
      await cleanupTestRecord(data[0].id);
    }
    
    // Test different status values to determine the valid enum values
    console.log('\nTesting different status values...');
    const statusValues = [
      'draft', 'published', 'archived', 'pending', 'approved', 'rejected',
      'open', 'closed', 'active', 'inactive', 'completed'
    ];
    
    for (const status of statusValues) {
      console.log(`Trying status value: "${status}"...`);
      const statusRecord = {
        title: `TEST OPPORTUNITY WITH STATUS ${status.toUpperCase()} - PLEASE DELETE`,
        description: `This is a test opportunity with status set to ${status}.`,
        creator_id: uuidv4(),
        status: status
      };
      
      const { data: statusData, error: statusError } = await supabase
        .from('opportunities')
        .insert([statusRecord])
        .select();
      
      if (statusError) {
        console.error(`Error with status "${status}":`, statusError);
      } else {
        console.log(`Success with status "${status}"!`);
        await cleanupTestRecord(statusData[0].id);
      }
    }
    
    // Try to get information about the profiles table to understand the creator_id relationship
    console.log('\nChecking profiles table...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('Error checking profiles table:', profilesError);
    } else if (profilesData && profilesData.length > 0) {
      console.log('Sample profile record:');
      const profile = profilesData[0];
      Object.entries(profile).forEach(([key, value]) => {
        const type = Array.isArray(value) ? `array[${value.length}]` : 
                     value === null ? 'null' : typeof value;
        console.log(`- ${key}: ${type}`);
      });
    } else {
      console.log('No profiles found.');
    }
    
  } catch (error) {
    console.error('Error in testWithUUID:', error);
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
testWithUUID().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 