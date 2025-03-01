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

async function checkFrontendIntegration() {
  try {
    console.log('Checking recently uploaded grant opportunities...');
    
    // Get the 10 most recent opportunities (likely to be our grants)
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching opportunities:', error);
      return;
    }
    
    if (!opportunities || opportunities.length === 0) {
      console.log('No opportunities found.');
      return;
    }
    
    console.log(`Found ${opportunities.length} recent opportunities.`);
    
    // Format the opportunities as they would appear in the frontend
    console.log('\n===== OPPORTUNITIES AS THEY WOULD APPEAR IN FRONTEND =====\n');
    
    opportunities.forEach((opp, index) => {
      console.log(`Opportunity #${index + 1}: ${opp.id}`);
      console.log(`Title: ${opp.title}`);
      console.log(`Status: ${opp.status}`);
      console.log(`Budget: ${formatBudget(opp.budget)}`);
      console.log(`Deadline: ${formatDate(opp.deadline)}`);
      console.log(`Tags: ${formatTags(opp.tags)}`);
      console.log(`Description: ${truncateText(opp.description, 100)}`);
      console.log(`Requirements: ${truncateText(opp.requirements, 100)}`);
      console.log('---');
    });
    
    // Check if these opportunities can be accessed via the frontend API route
    console.log('\nChecking if these opportunities would be accessible via the frontend API...');
    
    // Simulate the frontend API query
    const { data: apiOpportunities, error: apiError } = await supabase
      .from('opportunities')
      .select('id, title, description, budget, deadline, status, tags, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (apiError) {
      console.error('Error with simulated API query:', apiError);
    } else {
      console.log(`API would return ${apiOpportunities.length} opportunities.`);
      
      // Check if our grants are in the API results
      const matchingIds = apiOpportunities
        .filter(apiOpp => opportunities.some(opp => opp.id === apiOpp.id))
        .map(opp => opp.id);
      
      console.log(`${matchingIds.length} of our uploaded grants would appear in the frontend.`);
      
      if (matchingIds.length > 0) {
        console.log('Sample IDs that would appear:', matchingIds.slice(0, 3));
      }
    }
    
    // Check if the opportunity detail page would work for these opportunities
    console.log('\nChecking if opportunity detail pages would work...');
    
    if (opportunities.length > 0) {
      const sampleOpp = opportunities[0];
      const { data: detailOpp, error: detailError } = await supabase
        .from('opportunities')
        .select('*, profiles(full_name, avatar_url)')
        .eq('id', sampleOpp.id)
        .single();
      
      if (detailError) {
        console.error('Error fetching opportunity detail:', detailError);
      } else {
        console.log('Opportunity detail would work for:', detailOpp.title);
        console.log('Creator:', detailOpp.profiles ? detailOpp.profiles.full_name : 'Unknown');
        console.log('Would display budget:', formatBudget(detailOpp.budget));
        console.log('Would display deadline:', formatDate(detailOpp.deadline));
      }
    }
    
  } catch (error) {
    console.error('Error in checkFrontendIntegration:', error);
  }
}

// Helper functions to format data as it would appear in the frontend
function formatBudget(budget) {
  if (budget === null || budget === undefined) return 'Not specified';
  return `$${Number(budget).toLocaleString()}`;
}

function formatDate(dateString) {
  if (!dateString) return 'No deadline';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateString || 'Invalid date';
  }
}

function formatTags(tags) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return 'No tags';
  return tags.join(', ');
}

function truncateText(text, maxLength) {
  if (!text) return 'Not provided';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Run the check
checkFrontendIntegration().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 