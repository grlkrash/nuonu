#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Get the artist ID from command line arguments
const artistId = process.argv[2];

if (!artistId) {
  console.error('Error: Artist ID is required');
  console.log('Usage: npm run run-agent -- <artist_id>');
  process.exit(1);
}

console.log(`Running autonomous agent for artist: ${artistId}`);

// Log agent activity
async function logAgentActivity(activity) {
  try {
    const { data, error } = await supabase
      .from('agent_activities')
      .insert({
        id: uuidv4(),
        artist_id: activity.artist_id,
        activity_type: activity.activity_type,
        status: activity.status,
        details: activity.details
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error logging agent activity:', error);
    return null;
  }
}

// Discover opportunities using Browser Base
async function discoverOpportunities() {
  console.log('1. Discovering opportunities using Browser Base...');
  
  // Log the start of discovery
  await logAgentActivity({
    artist_id: artistId,
    activity_type: 'opportunity_discovery',
    status: 'in_progress',
    details: {
      message: 'Starting opportunity discovery',
      source: 'browser_base'
    }
  });
  
  // Define target URLs for opportunity discovery
  const targetUrls = [
    'https://www.grantsfoundation.org/opportunities',
    'https://www.artistgrants.com/open-calls',
    'https://www.creativeresidencies.org/upcoming'
  ];
  
  try {
    // In a real implementation, this would call the API endpoint
    console.log(`   Scraping ${targetUrls.length} websites for opportunities...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate discovered opportunities
    const opportunities = [
      {
        title: 'Emerging Artists Grant 2023',
        organization: 'Arts Foundation',
        amount: 5000,
        deadline: '2023-12-15',
        url: 'https://www.artsfoundation.org/grants/emerging-artists'
      },
      {
        title: 'Digital Media Production Fund',
        organization: 'Creative Tech Initiative',
        amount: 7500,
        deadline: '2023-11-30',
        url: 'https://www.creativetechinitiative.org/funds'
      },
      {
        title: 'Public Art Commission',
        organization: 'City Arts Council',
        amount: 10000,
        deadline: '2024-01-15',
        url: 'https://www.cityartscouncil.org/commissions'
      }
    ];
    
    console.log(`   Found ${opportunities.length} opportunities`);
    
    // Log successful discovery
    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'opportunity_discovery',
      status: 'completed',
      details: {
        message: `Discovered ${opportunities.length} opportunities`,
        source: 'browser_base',
        count: opportunities.length
      }
    });
    
    return opportunities;
  } catch (error) {
    console.error('Error discovering opportunities:', error);
    
    // Log failed discovery
    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'opportunity_discovery',
      status: 'failed',
      details: {
        message: error.message || 'Failed to discover opportunities',
        source: 'browser_base'
      }
    });
    
    return [];
  }
}

// Match opportunities with artist profile
async function matchOpportunities(opportunities) {
  console.log('2. Matching opportunities with artist profile...');
  
  // Log the start of matching
  await logAgentActivity({
    artist_id: artistId,
    activity_type: 'opportunity_matching',
    status: 'in_progress',
    details: {
      message: 'Starting opportunity matching',
      count: opportunities.length
    }
  });
  
  try {
    // Fetch artist profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', artistId)
      .single();
    
    if (error) throw error;
    
    console.log(`   Analyzing ${opportunities.length} opportunities for match with artist profile...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate matching process
    const matchedOpportunities = opportunities.map(opportunity => ({
      ...opportunity,
      match_score: Math.floor(Math.random() * 30) + 70 // Random score between 70-99
    }));
    
    // Sort by match score
    matchedOpportunities.sort((a, b) => b.match_score - a.match_score);
    
    console.log(`   Matched ${matchedOpportunities.length} opportunities with scores from ${matchedOpportunities[matchedOpportunities.length-1].match_score}% to ${matchedOpportunities[0].match_score}%`);
    
    // Log successful matching
    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'opportunity_matching',
      status: 'completed',
      details: {
        message: `Matched ${matchedOpportunities.length} opportunities`,
        top_match_score: matchedOpportunities[0].match_score,
        count: matchedOpportunities.length
      }
    });
    
    return matchedOpportunities;
  } catch (error) {
    console.error('Error matching opportunities:', error);
    
    // Log failed matching
    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'opportunity_matching',
      status: 'failed',
      details: {
        message: error.message || 'Failed to match opportunities',
        count: opportunities.length
      }
    });
    
    return [];
  }
}

// Generate applications for matched opportunities
async function generateApplications(matchedOpportunities) {
  console.log('3. Generating applications for high-match opportunities...');
  
  // Filter for high-match opportunities (>85%)
  const highMatchOpportunities = matchedOpportunities.filter(opp => opp.match_score > 85);
  
  // Log the start of generation
  await logAgentActivity({
    artist_id: artistId,
    activity_type: 'application_generation',
    status: 'in_progress',
    details: {
      message: `Starting application generation for ${highMatchOpportunities.length} high-match opportunities`,
      count: highMatchOpportunities.length
    }
  });
  
  try {
    console.log(`   Generating applications for ${highMatchOpportunities.length} opportunities with match scores >85%...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate application generation
    const generatedApplications = highMatchOpportunities.map(opportunity => ({
      opportunity,
      application: {
        artistStatement: "Artist statement generated by AI...",
        projectDescription: "Project description generated by AI...",
        budget: "Budget breakdown generated by AI...",
        timeline: "Project timeline generated by AI...",
        impactStatement: "Impact statement generated by AI..."
      }
    }));
    
    console.log(`   Generated ${generatedApplications.length} applications`);
    
    // Log successful generation
    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'application_generation',
      status: 'completed',
      details: {
        message: `Generated ${generatedApplications.length} applications`,
        count: generatedApplications.length
      }
    });
    
    return generatedApplications;
  } catch (error) {
    console.error('Error generating applications:', error);
    
    // Log failed generation
    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'application_generation',
      status: 'failed',
      details: {
        message: error.message || 'Failed to generate applications',
        count: highMatchOpportunities.length
      }
    });
    
    return [];
  }
}

// Submit applications using Browser Base
async function submitApplications(generatedApplications) {
  console.log('4. Submitting applications using Browser Base...');
  
  // Log the start of submission
  await logAgentActivity({
    artist_id: artistId,
    activity_type: 'application_submission',
    status: 'in_progress',
    details: {
      message: `Starting submission for ${generatedApplications.length} applications`,
      count: generatedApplications.length
    }
  });
  
  try {
    const submittedApplications = [];
    
    for (const app of generatedApplications) {
      console.log(`   Submitting application to ${app.opportunity.organization} for "${app.opportunity.title}"...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate submission process using Browser Base
      const submissionId = `browser-base-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // In a real implementation, this would call the API endpoint
      const submissionResult = {
        success: Math.random() > 0.2, // 80% success rate
        submissionId: submissionId,
        status: 'submitted'
      };
      
      if (submissionResult.success) {
        submittedApplications.push({
          ...app,
          submissionId: submissionResult.submissionId,
          status: submissionResult.status
        });
        
        console.log(`   ✓ Successfully submitted application to ${app.opportunity.organization}`);
        
        // Log individual submission success
        await logAgentActivity({
          artist_id: artistId,
          activity_type: 'application_submission',
          status: 'completed',
          details: {
            message: `Successfully submitted application to ${app.opportunity.organization}`,
            opportunity_title: app.opportunity.title,
            organization: app.opportunity.organization,
            submission_id: submissionResult.submissionId
          }
        });
      } else {
        console.log(`   ✗ Failed to submit application to ${app.opportunity.organization}`);
        
        // Log individual submission failure
        await logAgentActivity({
          artist_id: artistId,
          activity_type: 'application_submission',
          status: 'failed',
          details: {
            message: `Failed to submit application to ${app.opportunity.organization}`,
            opportunity_title: app.opportunity.title,
            organization: app.opportunity.organization
          }
        });
      }
    }
    
    console.log(`   Submitted ${submittedApplications.length} out of ${generatedApplications.length} applications`);
    
    // Log overall submission status
    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'application_submission',
      status: 'completed',
      details: {
        message: `Submitted ${submittedApplications.length} out of ${generatedApplications.length} applications`,
        success_count: submittedApplications.length,
        total_count: generatedApplications.length
      }
    });
    
    return submittedApplications;
  } catch (error) {
    console.error('Error submitting applications:', error);
    
    // Log failed submission
    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'application_submission',
      status: 'failed',
      details: {
        message: error.message || 'Failed to submit applications',
        count: generatedApplications.length
      }
    });
    
    return [];
  }
}

// Monitor application status using Browser Base
async function monitorApplicationStatus(submittedApplications) {
  console.log('5. Monitoring application status using Browser Base...');
  
  if (submittedApplications.length === 0) {
    console.log('   No applications to monitor');
    return [];
  }
  
  // Log the start of monitoring
  await logAgentActivity({
    artist_id: artistId,
    activity_type: 'application_monitoring',
    status: 'in_progress',
    details: {
      message: `Starting status monitoring for ${submittedApplications.length} applications`,
      count: submittedApplications.length
    }
  });
  
  try {
    const applicationStatuses = [];
    
    for (const app of submittedApplications) {
      console.log(`   Checking status for application to ${app.opportunity.organization}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate status check using Browser Base
      const possibleStatuses = ['submitted', 'under_review', 'accepted', 'rejected'];
      const randomStatus = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
      
      applicationStatuses.push({
        ...app,
        currentStatus: randomStatus,
        lastChecked: new Date().toISOString()
      });
      
      console.log(`   Status for ${app.opportunity.organization}: ${randomStatus}`);
      
      // Log individual status check
      await logAgentActivity({
        artist_id: artistId,
        activity_type: 'application_monitoring',
        status: 'completed',
        details: {
          message: `Application status for ${app.opportunity.organization}: ${randomStatus}`,
          opportunity_title: app.opportunity.title,
          organization: app.opportunity.organization,
          application_status: randomStatus,
          submission_id: app.submissionId
        }
      });
    }
    
    // Summarize statuses
    const statusCounts = applicationStatuses.reduce((acc, app) => {
      acc[app.currentStatus] = (acc[app.currentStatus] || 0) + 1;
      return acc;
    }, {});
    
    const statusSummary = Object.entries(statusCounts)
      .map(([status, count]) => `${count} ${status}`)
      .join(', ');
    
    console.log(`   Current status summary: ${statusSummary}`);
    
    // Log overall monitoring status
    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'application_monitoring',
      status: 'completed',
      details: {
        message: `Completed status monitoring for ${submittedApplications.length} applications`,
        status_summary: statusCounts,
        count: submittedApplications.length
      }
    });
    
    return applicationStatuses;
  } catch (error) {
    console.error('Error monitoring application status:', error);
    
    // Log failed monitoring
    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'application_monitoring',
      status: 'failed',
      details: {
        message: error.message || 'Failed to monitor application status',
        count: submittedApplications.length
      }
    });
    
    return [];
  }
}

// Run the autonomous agent
async function runAutonomousAgent() {
  console.log('\n=== Starting Autonomous Agent Run ===\n');
  
  // Log agent run start
  await logAgentActivity({
    artist_id: artistId,
    activity_type: 'agent_run',
    status: 'in_progress',
    details: {
      message: 'Starting autonomous agent run',
      browser_base_enabled: true
    }
  });
  
  try {
    // Step 1: Discover opportunities
    const opportunities = await discoverOpportunities();
    
    // Step 2: Match opportunities with artist profile
    const matchedOpportunities = await matchOpportunities(opportunities);
    
    // Step 3: Generate applications
    const generatedApplications = await generateApplications(matchedOpportunities);
    
    // Step 4: Submit applications
    const submittedApplications = await submitApplications(generatedApplications);
    
    // Step 5: Monitor application status
    const applicationStatuses = await monitorApplicationStatus(submittedApplications);
    
    console.log('\n=== Autonomous Agent Run Completed ===\n');
    
    // Log agent run completion
    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'agent_run',
      status: 'completed',
      details: {
        message: 'Completed autonomous agent run',
        opportunities_discovered: opportunities.length,
        opportunities_matched: matchedOpportunities.length,
        applications_generated: generatedApplications.length,
        applications_submitted: submittedApplications.length,
        browser_base_enabled: true
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error running autonomous agent:', error);
    
    // Log agent run failure
    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'agent_run',
      status: 'failed',
      details: {
        message: error.message || 'Failed to complete autonomous agent run',
        error: error.toString(),
        browser_base_enabled: true
      }
    });
    
    return false;
  }
}

// Run the autonomous agent
runAutonomousAgent()
  .then(success => {
    if (success) {
      console.log(`\nAgent run completed successfully for artist: ${artistId}`);
      console.log('\nNote: This is a simulation with Browser Base integration. In a production environment:');
      console.log('- Browser Base would automate interactions with external grant websites');
      console.log('- Applications would be submitted directly to external platforms');
      console.log('- Application status would be monitored by periodically checking external sites');
      process.exit(0);
    } else {
      console.error(`Agent run failed for artist: ${artistId}`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error running agent:', error);
    process.exit(1);
  }); 