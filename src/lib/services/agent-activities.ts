import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import { discoverOpportunitiesWithEliza } from './eliza-twitter'
import { getMatchedOpportunities } from './ai-matching'
import { generateApplicationContent } from './openai'

// Activity types
export type AgentActivityType = 
  | 'discover_opportunities' 
  | 'match_opportunities' 
  | 'generate_application'
  | 'submit_application'
  | 'monitor_application'
  | 'distribute_funds'

// Activity status
export type AgentActivityStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'failed'

// Activity interface
export interface AgentActivity {
  id: string
  artist_id: string
  activity_type: AgentActivityType
  status: AgentActivityStatus
  details?: any
  created_at: string
  updated_at: string
}

/**
 * Log an agent activity in the database
 */
export async function logAgentActivity(
  artistId: string,
  activityType: AgentActivityType,
  status: AgentActivityStatus = 'pending',
  details?: any
): Promise<string> {
  const supabase = createClient()
  const activityId = uuidv4()
  
  const { error } = await supabase
    .from('agent_activities')
    .insert({
      id: activityId,
      artist_id: artistId,
      activity_type: activityType,
      status,
      details
    })
  
  if (error) {
    console.error('Error logging agent activity:', error)
    throw new Error(`Failed to log agent activity: ${error.message}`)
  }
  
  return activityId
}

/**
 * Update an agent activity status
 */
export async function updateAgentActivityStatus(
  activityId: string,
  status: AgentActivityStatus,
  details?: any
): Promise<void> {
  const supabase = createClient()
  
  const updateData: any = { status }
  if (details) {
    updateData.details = details
  }
  
  const { error } = await supabase
    .from('agent_activities')
    .update(updateData)
    .eq('id', activityId)
  
  if (error) {
    console.error('Error updating agent activity:', error)
    throw new Error(`Failed to update agent activity: ${error.message}`)
  }
}

/**
 * Discover opportunities for an artist
 */
export async function matchOpportunities(artistId: string): Promise<string> {
  // Log the activity
  const activityId = await logAgentActivity(
    artistId, 
    'match_opportunities', 
    'in_progress'
  )
  
  try {
    // Get the artist's profile
    const supabase = createClient()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', artistId)
      .single()
    
    if (profileError || !profile) {
      throw new Error(`Failed to get artist profile: ${profileError?.message || 'Profile not found'}`)
    }
    
    // Get matched opportunities
    const matchedOpportunities = await getMatchedOpportunities(profile)
    
    // Update the activity status
    await updateAgentActivityStatus(
      activityId, 
      'completed', 
      { 
        matched_opportunities: matchedOpportunities.map(opp => ({
          id: opp.id,
          title: opp.title,
          match_score: opp.match_score
        }))
      }
    )
    
    return activityId
  } catch (error) {
    console.error('Error matching opportunities:', error)
    
    // Update the activity status to failed
    await updateAgentActivityStatus(
      activityId, 
      'failed', 
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )
    
    throw error
  }
}

/**
 * Generate an application for an opportunity
 */
export async function generateApplication(
  artistId: string, 
  opportunityId: string
): Promise<string> {
  // Log the activity
  const activityId = await logAgentActivity(
    artistId, 
    'generate_application', 
    'in_progress',
    { opportunity_id: opportunityId }
  )
  
  try {
    const supabase = createClient()
    
    // Get the artist's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', artistId)
      .single()
    
    if (profileError || !profile) {
      throw new Error(`Failed to get artist profile: ${profileError?.message || 'Profile not found'}`)
    }
    
    // Get the opportunity
    const { data: opportunity, error: opportunityError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single()
    
    if (opportunityError || !opportunity) {
      throw new Error(`Failed to get opportunity: ${opportunityError?.message || 'Opportunity not found'}`)
    }
    
    // Generate application content
    const applicationContent = await generateApplicationContent(profile, opportunity)
    
    // Create the application in the database
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .insert({
        artist_id: artistId,
        opportunity_id: opportunityId,
        content: applicationContent.content,
        status: 'draft'
      })
      .select()
      .single()
    
    if (applicationError) {
      throw new Error(`Failed to create application: ${applicationError.message}`)
    }
    
    // Update the activity status
    await updateAgentActivityStatus(
      activityId, 
      'completed', 
      { 
        application_id: application.id,
        content_preview: applicationContent.content.substring(0, 200) + '...'
      }
    )
    
    return activityId
  } catch (error) {
    console.error('Error generating application:', error)
    
    // Update the activity status to failed
    await updateAgentActivityStatus(
      activityId, 
      'failed', 
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )
    
    throw error
  }
}

/**
 * Submit an application
 */
export async function submitApplication(
  artistId: string, 
  applicationId: string
): Promise<string> {
  // Log the activity
  const activityId = await logAgentActivity(
    artistId, 
    'submit_application', 
    'in_progress',
    { application_id: applicationId }
  )
  
  try {
    const supabase = createClient()
    
    // Get the application
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .select('*, opportunities(*)')
      .eq('id', applicationId)
      .eq('artist_id', artistId)
      .single()
    
    if (applicationError || !application) {
      throw new Error(`Failed to get application: ${applicationError?.message || 'Application not found'}`)
    }
    
    // Update the application status to submitted
    const { error: updateError } = await supabase
      .from('applications')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', applicationId)
    
    if (updateError) {
      throw new Error(`Failed to update application status: ${updateError.message}`)
    }
    
    // Update the activity status
    await updateAgentActivityStatus(
      activityId, 
      'completed', 
      { 
        application_id: applicationId,
        opportunity_title: application.opportunities?.title || 'Unknown opportunity'
      }
    )
    
    return activityId
  } catch (error) {
    console.error('Error submitting application:', error)
    
    // Update the activity status to failed
    await updateAgentActivityStatus(
      activityId, 
      'failed', 
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )
    
    throw error
  }
}

/**
 * Monitor application status
 */
export async function monitorApplicationStatus(
  artistId: string, 
  applicationId: string
): Promise<string> {
  // Log the activity
  const activityId = await logAgentActivity(
    artistId, 
    'monitor_application', 
    'in_progress',
    { application_id: applicationId }
  )
  
  try {
    const supabase = createClient()
    
    // Get the application
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .select('*, opportunities(*)')
      .eq('id', applicationId)
      .eq('artist_id', artistId)
      .single()
    
    if (applicationError || !application) {
      throw new Error(`Failed to get application: ${applicationError?.message || 'Application not found'}`)
    }
    
    // In a real implementation, this would check external APIs or services
    // For now, we'll just simulate checking the status
    const currentStatus = application.status
    const statusDetails = {
      current_status: currentStatus,
      last_checked: new Date().toISOString(),
      opportunity_title: application.opportunities?.title || 'Unknown opportunity',
      next_check_scheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours later
    }
    
    // Update the activity status
    await updateAgentActivityStatus(
      activityId, 
      'completed', 
      statusDetails
    )
    
    return activityId
  } catch (error) {
    console.error('Error monitoring application status:', error)
    
    // Update the activity status to failed
    await updateAgentActivityStatus(
      activityId, 
      'failed', 
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )
    
    throw error
  }
}

/**
 * Run the autonomous agent for an artist
 * This function orchestrates the entire process:
 * 1. Discover opportunities
 * 2. Match opportunities
 * 3. Generate applications for high-match opportunities
 * 4. Submit applications
 * 5. Monitor application status
 */
export async function runAutonomousAgent(artistId: string): Promise<{
  success: boolean;
  discoveredOpportunities?: number;
  matchedOpportunities?: any[];
  generatedApplications?: string[];
  submittedApplications?: string[];
  monitoredApplications?: string[];
  error?: string;
}> {
  // Log the autonomous agent run
  const autonomousActivityId = await logAgentActivity(
    artistId,
    'discover_opportunities',
    'in_progress',
    { autonomous_mode: true }
  )
  
  try {
    console.log(`Starting autonomous agent for artist ${artistId}`)
    
    // Step 1: Discover opportunities
    console.log('Step 1: Discovering opportunities')
    const discoverResult = await discoverOpportunitiesWithEliza(artistId)
    console.log(`Discovered opportunities: ${discoverResult.opportunities?.length || 0}`)
    
    // Step 2: Match opportunities
    console.log('Step 2: Matching opportunities')
    const matchActivityId = await matchOpportunities(artistId)
    
    // Get the matched opportunities
    const supabase = createClient()
    const { data: activity, error: activityError } = await supabase
      .from('agent_activities')
      .select('details')
      .eq('id', matchActivityId)
      .single()
    
    if (activityError || !activity || !activity.details?.matched_opportunities) {
      const errorMsg = 'Failed to get matched opportunities'
      console.error(errorMsg, activityError)
      
      // Update the autonomous activity status
      await updateAgentActivityStatus(
        autonomousActivityId,
        'failed',
        { error: errorMsg }
      )
      
      return { 
        success: false, 
        discoveredOpportunities: discoverResult.opportunities?.length || 0,
        error: errorMsg
      }
    }
    
    const matchedOpportunities = activity.details.matched_opportunities
    console.log(`Matched opportunities: ${matchedOpportunities.length}`)
    
    // Step 3: Generate applications for high-match opportunities
    console.log('Step 3: Generating applications for high-match opportunities')
    const highMatchOpportunities = matchedOpportunities
      .filter((opp: any) => opp.match_score >= 0.8)
      .slice(0, 3) // Limit to top 3 high-match opportunities
    
    console.log(`High-match opportunities: ${highMatchOpportunities.length}`)
    
    const generatedApplications: string[] = []
    const submittedApplications: string[] = []
    const monitoredApplications: string[] = []
    
    for (const opportunity of highMatchOpportunities) {
      try {
        console.log(`Processing opportunity: ${opportunity.id} (${opportunity.title})`)
        
        // Generate application
        console.log(`Generating application for opportunity: ${opportunity.id}`)
        const generateActivityId = await generateApplication(artistId, opportunity.id)
        
        // Get the generated application
        const { data: generateActivity, error: generateActivityError } = await supabase
          .from('agent_activities')
          .select('details')
          .eq('id', generateActivityId)
          .single()
        
        if (generateActivityError || !generateActivity || !generateActivity.details?.application_id) {
          console.error('Failed to get generated application', generateActivityError)
          continue
        }
        
        const applicationId = generateActivity.details.application_id
        generatedApplications.push(applicationId)
        
        // Step 4: Submit application
        console.log(`Submitting application: ${applicationId}`)
        const submitActivityId = await submitApplication(artistId, applicationId)
        submittedApplications.push(applicationId)
        
        // Step 5: Monitor application status
        console.log(`Monitoring application status: ${applicationId}`)
        const monitorActivityId = await monitorApplicationStatus(artistId, applicationId)
        monitoredApplications.push(applicationId)
      } catch (opportunityError) {
        console.error(`Error processing opportunity ${opportunity.id}:`, opportunityError)
        // Continue with next opportunity
      }
    }
    
    // Update the autonomous activity status
    await updateAgentActivityStatus(
      autonomousActivityId,
      'completed',
      {
        discovered_opportunities: discoverResult.opportunities?.length || 0,
        matched_opportunities: matchedOpportunities.length,
        high_match_opportunities: highMatchOpportunities.length,
        generated_applications: generatedApplications,
        submitted_applications: submittedApplications,
        monitored_applications: monitoredApplications
      }
    )
    
    console.log('Autonomous agent completed successfully')
    
    return {
      success: true,
      discoveredOpportunities: discoverResult.opportunities?.length || 0,
      matchedOpportunities,
      generatedApplications,
      submittedApplications,
      monitoredApplications
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error running autonomous agent:', error)
    
    // Update the autonomous activity status
    await updateAgentActivityStatus(
      autonomousActivityId,
      'failed',
      { error: errorMsg }
    )
    
    return {
      success: false,
      error: errorMsg
    }
  }
} 