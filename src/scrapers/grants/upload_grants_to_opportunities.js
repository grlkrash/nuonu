require('dotenv').config({ path: '../../../.env' });
const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');

// Configuration
const FINAL_REPORT_FILE = 'final_grants_report.json';

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

// Function to extract numeric value from amount string
function extractNumericValue(amountString) {
  if (!amountString) return null;
  
  // Try to extract a numeric value
  const numericMatch = amountString.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
  if (numericMatch) {
    // Remove commas and convert to number
    return parseFloat(numericMatch[1].replace(/,/g, ''));
  }
  
  return null;
}

// Function to convert deadline string to ISO date
function convertDeadlineToISO(deadlineString) {
  if (!deadlineString) return null;
  
  try {
    // Assume the current year if not specified
    const currentYear = new Date().getFullYear();
    const fullDeadline = `${deadlineString} ${currentYear}`;
    
    // Parse the date
    const date = new Date(fullDeadline);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.log(`  Invalid date: "${deadlineString}"`);
      return null;
    }
    
    // If the date is in the past, assume it's for next year
    if (date < new Date()) {
      date.setFullYear(date.getFullYear() + 1);
    }
    
    // Return ISO string
    return date.toISOString();
  } catch (error) {
    console.log(`  Error parsing date "${deadlineString}": ${error.message}`);
    return null;
  }
}

async function uploadGrantsToOpportunities() {
  try {
    console.log('Starting upload of grants to opportunities table...');
    
    // Read the grants data from the final report
    let grantsData;
    try {
      const reportData = JSON.parse(await fs.readFile(FINAL_REPORT_FILE, 'utf8'));
      grantsData = reportData.grants;
      console.log(`Read ${grantsData.length} grants from ${FINAL_REPORT_FILE}`);
    } catch (error) {
      console.error(`Error reading grant data: ${error.message}`);
      return;
    }
    
    // Get a valid creator_id from the profiles table
    console.log('Getting a valid creator_id from the profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.error('Error getting profiles:', profilesError);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.error('No profiles found. Cannot proceed without a valid creator_id.');
      return;
    }
    
    const creatorId = profiles[0].id;
    console.log(`Using creator_id: ${creatorId}`);
    
    // Process and insert each grant
    let successCount = 0;
    for (const grant of grantsData) {
      try {
        console.log(`Processing grant: ${grant.title}`);
        
        // Extract numeric value from amount
        const budgetValue = extractNumericValue(grant.amount);
        console.log(`  Amount: "${grant.amount}" -> Budget: ${budgetValue !== null ? budgetValue : 'null'}`);
        
        // Convert deadline to ISO date
        const deadlineISO = convertDeadlineToISO(grant.deadline);
        console.log(`  Deadline: "${grant.deadline}" -> ISO: ${deadlineISO || 'null'}`);
        
        // Map grant fields to opportunity fields
        const opportunity = {
          title: grant.title,
          description: grant.description || 'No description available',
          creator_id: creatorId,
          status: 'open', // Set all grants as open
          deadline: deadlineISO, // Use converted ISO date or null
          budget: budgetValue, // Use extracted numeric value or null
          tags: grant.categories || [],
          is_remote: true,
          requirements: `Amount: ${grant.amount || 'N/A'}\nDeadline: ${grant.deadline || 'N/A'}\nApplication URL: ${grant.applicationUrl || 'N/A'}\nOriginal Link: ${grant.link || 'N/A'}`
        };
        
        // Insert the opportunity
        const { data, error } = await supabase
          .from('opportunities')
          .insert([opportunity])
          .select();
        
        if (error) {
          console.error(`Error inserting grant "${grant.title}":`, error);
        } else {
          console.log(`Successfully inserted grant as opportunity: ${grant.title} (ID: ${data[0].id})`);
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing grant "${grant.title}":`, error);
      }
    }
    
    console.log(`\nUpload complete. Inserted ${successCount} out of ${grantsData.length} grants as opportunities.`);
    
    // Verify the data was inserted
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, title, status, budget, deadline')
      .order('created_at', { ascending: false })
      .limit(grantsData.length);
    
    if (error) {
      console.error('Error verifying inserted data:', error);
    } else {
      console.log(`\nVerified ${data.length} recently created opportunities:`);
      data.forEach(opp => {
        console.log(`  - ID: ${opp.id}, Title: ${opp.title}, Status: ${opp.status}, Budget: ${opp.budget}, Deadline: ${opp.deadline}`);
      });
    }
    
  } catch (error) {
    console.error('Error in uploadGrantsToOpportunities:', error);
  }
}

// Run the uploader
uploadGrantsToOpportunities().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 