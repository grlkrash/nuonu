require('dotenv').config({ path: '../../../.env' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createGrantsTable() {
  try {
    console.log('Checking if grants table exists...');
    
    // Check if the table exists by trying to select from it
    const { error: checkError } = await supabase
      .from('grants')
      .select('count')
      .limit(1);
    
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('Grants table does not exist. Creating it...');
      
      // Create the grants table using a simple insert with all required fields
      const { error: insertError } = await supabase
        .from('grants')
        .insert([
          {
            title: 'Test Grant',
            amount: 'Test Amount',
            deadline: 'Test Deadline',
            description: 'Test Description',
            categories: ['Test Category'],
            application_url: 'https://example.com/apply',
            link: 'https://example.com/test'
          }
        ]);
      
      if (insertError) {
        console.error('Error creating grants table:', insertError);
        return false;
      }
      
      console.log('Successfully created grants table');
      
      // Delete the test record
      await supabase
        .from('grants')
        .delete()
        .eq('link', 'https://example.com/test');
      
      return true;
    } else {
      console.log('Grants table already exists');
      return true;
    }
  } catch (error) {
    console.error('Error creating grants table:', error);
    return false;
  }
}

// Run the function
createGrantsTable().then(success => {
  if (success) {
    console.log('Grants table is ready for use');
  } else {
    console.error('Failed to create or verify grants table');
  }
}).catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 