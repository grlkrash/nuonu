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

// List of potential fields to test
const potentialFields = [
  'id',
  'title',
  'description',
  'amount',
  'deadline',
  'categories',
  'application_url',
  'link',
  'organization',
  'location',
  'type',
  'status',
  'created_at',
  'updated_at',
  'url',
  'source',
  'tags',
  'funding',
  'funding_amount',
  'funding_currency',
  'application_deadline',
  'start_date',
  'end_date',
  'eligibility',
  'requirements',
  'contact_email',
  'contact_name',
  'website',
  'logo',
  'image',
  'category',
  'subcategory'
];

async function testField(fieldName, fieldValue) {
  console.log(`Testing field: ${fieldName}`);
  
  const testRecord = {
    [fieldName]: fieldValue
  };
  
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .insert([testRecord])
      .select();
    
    if (error) {
      if (error.message && error.message.includes(`Could not find the '${fieldName}' column`)) {
        console.log(`❌ Field '${fieldName}' does not exist in the table.`);
        return false;
      } else {
        console.log(`⚠️ Error testing field '${fieldName}': ${error.message}`);
        return null; // Unknown result
      }
    } else {
      console.log(`✅ Field '${fieldName}' exists in the table.`);
      
      // Clean up the test record
      const { error: deleteError } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', data[0].id);
      
      if (deleteError) {
        console.error(`Error deleting test record for field '${fieldName}':`, deleteError);
      }
      
      return true;
    }
  } catch (error) {
    console.error(`Exception testing field '${fieldName}':`, error);
    return null; // Unknown result
  }
}

async function discoverTableStructure() {
  try {
    console.log('Starting discovery of opportunities table structure...');
    
    const validFields = [];
    const invalidFields = [];
    const unknownFields = [];
    
    // Test each field individually
    for (const field of potentialFields) {
      // Choose an appropriate test value based on the field name
      let testValue;
      
      if (field === 'categories' || field === 'tags') {
        testValue = ['test'];
      } else if (field.includes('date') || field === 'deadline' || field === 'application_deadline') {
        testValue = '2023-12-31';
      } else if (field.includes('amount') || field === 'funding') {
        testValue = '10000';
      } else if (field.includes('email')) {
        testValue = 'test@example.com';
      } else if (field.includes('url') || field === 'website' || field === 'link') {
        testValue = 'https://example.com/test';
      } else {
        testValue = `Test ${field}`;
      }
      
      const result = await testField(field, testValue);
      
      if (result === true) {
        validFields.push(field);
      } else if (result === false) {
        invalidFields.push(field);
      } else {
        unknownFields.push(field);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Print the results
    console.log('\n=== DISCOVERY RESULTS ===');
    console.log('\nValid fields:');
    validFields.forEach(field => console.log(`- ${field}`));
    
    console.log('\nInvalid fields:');
    invalidFields.forEach(field => console.log(`- ${field}`));
    
    if (unknownFields.length > 0) {
      console.log('\nFields with unknown status:');
      unknownFields.forEach(field => console.log(`- ${field}`));
    }
    
    console.log('\nRecommended mapping from grants to opportunities:');
    const grantFields = ['title', 'amount', 'deadline', 'description', 'categories', 'application_url', 'link'];
    
    grantFields.forEach(grantField => {
      if (validFields.includes(grantField)) {
        console.log(`- grants.${grantField} → opportunities.${grantField}`);
      } else {
        // Try to find a similar field
        const similarField = validFields.find(validField => 
          validField.includes(grantField) || grantField.includes(validField)
        );
        
        if (similarField) {
          console.log(`- grants.${grantField} → opportunities.${similarField} (similar field)`);
        } else {
          console.log(`- grants.${grantField} → No matching field found`);
        }
      }
    });
    
  } catch (error) {
    console.error('Error in discoverTableStructure:', error);
  }
}

// Run the discovery
discoverTableStructure().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 