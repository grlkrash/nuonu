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

async function checkSupabaseConnection() {
  try {
    console.log('Checking Supabase connection...');
    
    // Try to get the current user to test the connection
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Error connecting to Supabase Auth:', authError);
    } else {
      console.log('Successfully connected to Supabase Auth');
      console.log('Auth data:', authData);
    }
    
    // Try to list all tables in the public schema
    console.log('\nAttempting to list tables...');
    
    // Method 1: Using system tables
    try {
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (error) {
        console.error('Error listing tables using information_schema:', error);
      } else {
        console.log('Tables in public schema:', tables);
      }
    } catch (error) {
      console.error('Exception when listing tables using information_schema:', error);
    }
    
    // Method 2: Try to access some common tables
    console.log('\nTrying to access specific tables...');
    const tablesToCheck = ['grants', 'users', 'profiles', 'items'];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`Table '${table}' access error:`, error.message);
        } else {
          console.log(`Table '${table}' exists and is accessible`);
        }
      } catch (error) {
        console.error(`Exception when checking table '${table}':`, error);
      }
    }
    
    // Try to create a test table
    console.log('\nAttempting to create a test table...');
    try {
      const { error } = await supabase
        .from('test_table')
        .insert([{ name: 'Test Record' }]);
      
      if (error) {
        console.error('Error creating test table:', error);
      } else {
        console.log('Successfully created or inserted into test_table');
        
        // Clean up
        await supabase
          .from('test_table')
          .delete()
          .eq('name', 'Test Record');
      }
    } catch (error) {
      console.error('Exception when creating test table:', error);
    }
    
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
  }
}

// Run the check
checkSupabaseConnection().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 