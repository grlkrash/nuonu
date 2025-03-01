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

async function createOpportunityWithProfile() {
  try {
    console.log('Getting a valid creator_id from the profiles table...');
    
    // Get a profile ID to use as creator_id
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.error('Error getting profiles:', profilesError);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('No profiles found. Creating a test profile...');
      
      // Try to create a test profile
      const { data: newProfile, error: newProfileError } = await supabase
        .from('profiles')
        .insert([{ full_name: 'Test User' }])
        .select();
      
      if (newProfileError) {
        console.error('Error creating test profile:', newProfileError);
        return;
      }
      
      console.log('Created test profile:', newProfile);
      profiles = newProfile;
    }
    
    const creatorId = profiles[0].id;
    console.log(`Using creator_id: ${creatorId}`);
    
    // Create an opportunity with the valid creator_id
    console.log('\nCreating test opportunity...');
    const testOpportunity = {
      title: 'TEST OPPORTUNITY WITH VALID CREATOR - PLEASE DELETE',
      description: 'This is a test opportunity with a valid creator_id.',
      creator_id: creatorId,
      status: 'draft' // Using a known valid status
    };
    
    const { data: opportunity, error: opportunityError } = await supabase
      .from('opportunities')
      .insert([testOpportunity])
      .select();
    
    if (opportunityError) {
      console.error('Error creating opportunity:', opportunityError);
    } else {
      console.log('Successfully created opportunity:', opportunity);
      
      // Get the full record to see all fields
      const { data: fullRecord, error: fullError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunity[0].id)
        .single();
      
      if (fullError) {
        console.error('Error getting full record:', fullError);
      } else {
        console.log('\nFull opportunity record structure:');
        Object.entries(fullRecord).forEach(([key, value]) => {
          const type = Array.isArray(value) ? `array[${value.length}]` : 
                       value === null ? 'null' : typeof value;
          console.log(`- ${key}: ${type} ${value !== null ? `= ${JSON.stringify(value)}` : ''}`);
        });
      }
      
      // Test different status values with the valid creator_id
      console.log('\nTesting status values with valid creator_id...');
      for (const status of ['draft', 'archived', 'open', 'closed']) {
        console.log(`Trying status value: "${status}"...`);
        const statusRecord = {
          title: `TEST OPPORTUNITY WITH STATUS ${status.toUpperCase()} - PLEASE DELETE`,
          description: `This is a test opportunity with status set to ${status}.`,
          creator_id: creatorId,
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
          
          // Clean up
          await cleanupTestRecord(statusData[0].id);
        }
      }
      
      // Clean up the original test opportunity
      await cleanupTestRecord(opportunity[0].id);
    }
    
  } catch (error) {
    console.error('Error in createOpportunityWithProfile:', error);
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
createOpportunityWithProfile().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 