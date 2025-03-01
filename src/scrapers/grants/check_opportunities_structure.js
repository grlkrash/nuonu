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

async function checkTableStructure() {
  try {
    // SQL query to get table structure
    const { data: tableInfo, error: tableError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default
        FROM 
          information_schema.columns
        WHERE 
          table_schema = 'public' 
          AND table_name = 'opportunities'
        ORDER BY 
          ordinal_position;
      `
    });

    if (tableError) {
      console.error('Error getting table structure:', tableError);
      
      // Try an alternative approach
      console.log('\nTrying alternative approach...');
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .limit(0);
      
      if (error) {
        console.error('Error with alternative approach:', error);
      } else {
        console.log('Table exists but could not get structure details.');
      }
    } else {
      console.log('Opportunities table structure:');
      tableInfo.forEach(column => {
        console.log(`- ${column.column_name} (${column.data_type})${column.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'}${column.column_default ? ` DEFAULT ${column.column_default}` : ''}`);
      });
    }

    // Try to get constraints
    const { data: constraintInfo, error: constraintError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          tc.constraint_name, 
          tc.constraint_type,
          kcu.column_name
        FROM 
          information_schema.table_constraints tc
        JOIN 
          information_schema.key_column_usage kcu
        ON 
          tc.constraint_name = kcu.constraint_name
        WHERE 
          tc.table_schema = 'public' 
          AND tc.table_name = 'opportunities'
        ORDER BY 
          tc.constraint_name;
      `
    });

    if (constraintError) {
      console.error('Error getting constraints:', constraintError);
    } else if (constraintInfo.length > 0) {
      console.log('\nTable constraints:');
      constraintInfo.forEach(constraint => {
        console.log(`- ${constraint.constraint_name} (${constraint.constraint_type}) on column ${constraint.column_name}`);
      });
    }

  } catch (error) {
    console.error('Error checking table structure:', error);
    
    // If we can't get the structure, let's at least check if the table exists
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('Error confirming table existence:', error);
      } else {
        console.log('Confirmed that the opportunities table exists.');
      }
    } catch (existsError) {
      console.error('Error checking if table exists:', existsError);
    }
  }
}

// Run the check
checkTableStructure().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 