require('dotenv').config({ path: '../../../.env' });
const fs = require('fs');
const path = require('path');
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

// Helper function to extract numeric value from amount string
function extractNumericValue(amountString) {
  if (!amountString) return null;
  
  try {
    // Convert to lowercase for consistency
    const amount = amountString.toLowerCase();
    
    // Extract numeric values using regex
    const numericMatch = amount.match(/(\d+(?:\.\d+)?)/);
    if (!numericMatch) return null;
    
    let value = parseFloat(numericMatch[0]);
    
    // Adjust for K (thousands)
    if (amount.includes('k')) {
      value *= 1000;
    }
    
    // Adjust for M (millions)
    if (amount.includes('m')) {
      value *= 1000000;
    }
    
    return value;
  } catch (error) {
    console.error(`Error extracting numeric value from "${amountString}":`, error.message);
    return null;
  }
}

// Helper function to convert deadline string to ISO date
function convertDeadlineToISO(deadlineString) {
  if (!deadlineString) return null;
  
  try {
    // Parse the deadline string
    const parts = deadlineString.trim().split(' ');
    if (parts.length < 2) return null;
    
    const month = parts[0]; // e.g., "Jan"
    const day = parseInt(parts[1], 10); // e.g., "22"
    
    // Map month abbreviations to month numbers
    const monthMap = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    
    const monthNum = monthMap[month.toLowerCase().substring(0, 3)];
    if (monthNum === undefined || isNaN(day)) {
      console.log(`Invalid date format: ${deadlineString}`);
      return null;
    }
    
    // Get current date for reference
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Determine the year (assume next occurrence of the month)
    let year = currentYear;
    if (monthNum < currentMonth) {
      year = currentYear + 1;
    }
    
    // Create date object
    const date = new Date(year, monthNum, day);
    
    // If the date is in the past, add another year
    if (date < now) {
      date.setFullYear(date.getFullYear() + 1);
    }
    
    // Add 3 more years to ensure deadlines are in the future
    date.setFullYear(date.getFullYear() + 3);
    
    return date.toISOString();
  } catch (error) {
    console.error(`Error converting deadline "${deadlineString}" to ISO:`, error.message);
    return null;
  }
}

// Function to get a valid creator_id from the profiles table
async function getValidCreatorId() {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return null;
    }
    
    if (!profiles || profiles.length === 0) {
      console.error('No profiles found in the database. Please create at least one profile.');
      return null;
    }
    
    return profiles[0].id;
  } catch (error) {
    console.error('Error in getValidCreatorId:', error);
    return null;
  }
}

// Main function to upload grants to opportunities table
async function uploadGrantsToOpportunities(filePath, batchSize = 10) {
  try {
    // Read the JSON file
    const grantsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`Read ${grantsData.length} grants from ${filePath}`);
    
    // Get a valid creator_id
    const creatorId = await getValidCreatorId();
    if (!creatorId) {
      console.error('Failed to get a valid creator_id. Aborting upload.');
      return;
    }
    console.log('Using creator_id:', creatorId);
    
    // Process grants in batches
    const totalGrants = grantsData.length;
    let successCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    
    // Process in batches
    for (let i = 0; i < totalGrants; i += batchSize) {
      const batch = grantsData.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1} (${batch.length} grants)...`);
      
      const opportunitiesBatch = batch.map(grant => {
        // Extract budget value
        const budget = extractNumericValue(grant.amount);
        console.log(`Grant: ${grant.title.substring(0, 30)}..., Amount: "${grant.amount}" -> Budget: ${budget}`);
        
        // Convert deadline to ISO format
        const deadlineISO = convertDeadlineToISO(grant.deadline);
        console.log(`Deadline: "${grant.deadline}" -> ISO: ${deadlineISO}`);
        
        // Determine tags based on grant category or content
        let tags = [];
        if (grant.title.toLowerCase().includes('blockchain')) {
          tags.push('blockchain');
        }
        if (grant.title.toLowerCase().includes('grant')) {
          tags.push('grants');
        }
        if (grant.description && grant.description.toLowerCase().includes('development')) {
          tags.push('development');
        }
        if (grant.description && grant.description.toLowerCase().includes('infrastructure')) {
          tags.push('infrastructure');
        }
        
        // If no tags were determined, add a default tag
        if (tags.length === 0) {
          tags.push('blockchain grants');
        }
        
        // Construct requirements field to preserve original grant data
        const requirements = `Amount: ${grant.amount}
Deadline: ${grant.deadline}
Application URL: ${grant.applicationUrl || 'N/A'}
${grant.originalLink ? `Original Link: ${grant.originalLink}` : ''}`;
        
        return {
          id: uuidv4(),
          title: grant.title,
          description: grant.description || 'No description provided',
          requirements: requirements,
          budget: budget,
          deadline: deadlineISO,
          status: 'open',
          creator_id: creatorId,
          category: null,
          location: null,
          is_remote: true,
          tags: tags
        };
      });
      
      // Insert opportunities batch
      const { data: insertedOpportunities, error } = await supabase
        .from('opportunities')
        .insert(opportunitiesBatch)
        .select();
      
      if (error) {
        console.error('Error inserting opportunities batch:', error);
        errorCount += batch.length;
      } else {
        console.log(`Successfully inserted ${insertedOpportunities.length} opportunities`);
        successCount += insertedOpportunities.length;
        
        // Log the IDs of inserted opportunities
        insertedOpportunities.forEach(opp => {
          console.log(`- ID: ${opp.id}, Title: ${opp.title.substring(0, 30)}...`);
        });
      }
      
      processedCount += batch.length;
      console.log(`Progress: ${processedCount}/${totalGrants} (${Math.round(processedCount/totalGrants*100)}%)`);
    }
    
    console.log('\n===== UPLOAD SUMMARY =====');
    console.log(`Total grants processed: ${totalGrants}`);
    console.log(`Successfully inserted: ${successCount}`);
    console.log(`Failed to insert: ${errorCount}`);
    console.log(`Success rate: ${Math.round(successCount/totalGrants*100)}%`);
    
  } catch (error) {
    console.error('Error in uploadGrantsToOpportunities:', error);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const filePath = args[0] || path.join(__dirname, 'final_grants_report.json');
const batchSize = parseInt(args[1], 10) || 10;

console.log(`Starting upload process with batch size: ${batchSize}`);
console.log(`Using grants file: ${filePath}`);

// Run the upload function
uploadGrantsToOpportunities(filePath, batchSize).catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 