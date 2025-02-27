import { supabase } from '@/lib/supabase/client'
import { searchTwitterForOpportunities, convertTwitterToOpportunities } from './twitter-search'
import { findMatchingOpportunities } from './ai-agent'
import { generateApplicationContent } from './openai'
import { createApplication, updateApplication } from './applications'
import { getProfileById } from './profiles'
import { getOpportunityById } from './opportunities'
import { registerArtist, isArtistRegistered } from './flow-blockchain'

// Define activity types
export enum AgentActivityType {
  OPPORTUNITY_DISCOVERY = 'opportunity_discovery',
  OPPORTUNITY_MATCHING = 'opportunity_matching',
  APPLICATION_GENERATION = 'application_generation',
  APPLICATION_SUBMISSION = 'application_submission',
  FUND_DISTRIBUTION = 'fund_distribution',
  BLOCKCHAIN_INTERACTION = 'blockchain_interaction'
}

// Define activity status
export enum AgentActivityStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Define activity interface
export interface AgentActivity {
  id?: string
  artist_id: string
  activity_type: AgentActivityType
  status: AgentActivityStatus
  details?: any
  created_at?: string
  updated_at?: string
}

/**
 * Log an agent activity
 */
export async function logAgentActivity(
  activity: Omit<AgentActivity, 'id' | 'created_at' | 'updated_at'>
): Promise<AgentActivity> {
  try {
    const { data, error } = await supabase
      .from('agent_activities')
      .insert({
        ...activity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error logging agent activity:', error)
    throw error
  }
}

/**
 * Update an agent activity
 */
export async function updateAgentActivity(
  id: string,
  updates: Partial<AgentActivity>
): Promise<AgentActivity> {
  try {
    const { data, error } = await supabase
      .from('agent_activities')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error updating agent activity:', error)
    throw error
  }
}

/**
 * Get recent agent activities for an artist
 */
export async function getRecentAgentActivities(
  artistId: string,
  limit: number = 10
): Promise<AgentActivity[]> {
  try {
    const { data, error } = await supabase
      .from('agent_activities')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error getting recent agent activities:', error)
    return []
  }
}

/**
 * Autonomously discover opportunities for an artist
 */
export async function discoverOpportunities(artistId: string): Promise<string> {
  try {
    // Log the activity
    const activity = await logAgentActivity({
      artist_id: artistId,
      activity_type: AgentActivityType.OPPORTUNITY_DISCOVERY,
      status: AgentActivityStatus.IN_PROGRESS,
      details: {
        source: 'twitter',
        query: 'artist grant OR opportunity OR job OR commission'
      }
    })
    
    // Search Twitter for opportunities
    const twitterOpportunities = await searchTwitterForOpportunities()
    
    // Convert Twitter opportunities to the application format
    const opportunities = convertTwitterToOpportunities(twitterOpportunities)
    
    // Store opportunities in the database
    const { data, error } = await supabase
      .from('opportunities')
      .insert(opportunities.map(opp => ({
        ...opp,
        source: 'twitter',
        source_id: opp.id
      })))
      .select('id')
    
    if (error) {
      await updateAgentActivity(activity.id!, {
        status: AgentActivityStatus.FAILED,
        details: {
          ...activity.details,
          error: error.message
        }
      })
      throw error
    }
    
    // Update the activity
    await updateAgentActivity(activity.id!, {
      status: AgentActivityStatus.COMPLETED,
      details: {
        ...activity.details,
        opportunities_found: opportunities.length,
        opportunity_ids: data.map(o => o.id)
      }
    })
    
    return activity.id!
  } catch (error) {
    console.error('Error discovering opportunities:', error)
    throw error
  }
}

/**
 * Autonomously match opportunities for an artist
 */
export async function matchOpportunities(artistId: string): Promise<string> {
  try {
    // Log the activity
    const activity = await logAgentActivity({
      artist_id: artistId,
      activity_type: AgentActivityType.OPPORTUNITY_MATCHING,
      status: AgentActivityStatus.IN_PROGRESS
    })
    
    // Get the artist's profile
    const profile = await getProfileById(artistId)
    
    if (!profile) {
      await updateAgentActivity(activity.id!, {
        status: AgentActivityStatus.FAILED,
        details: {
          error: 'Artist profile not found'
        }
      })
      throw new Error('Artist profile not found')
    }
    
    // Find matching opportunities
    const matchedOpportunities = await findMatchingOpportunities(profile)
    
    // Update the activity
    await updateAgentActivity(activity.id!, {
      status: AgentActivityStatus.COMPLETED,
      details: {
        opportunities_matched: matchedOpportunities.length,
        opportunity_ids: matchedOpportunities.map(o => o.id),
        top_match: matchedOpportunities.length > 0 ? matchedOpportunities[0].id : null
      }
    })
    
    return activity.id!
  } catch (error) {
    console.error('Error matching opportunities:', error)
    throw error
  }
}

/**
 * Autonomously generate an application for an artist
 */
export async function generateApplication(
  artistId: string,
  opportunityId: string
): Promise<string> {
  try {
    // Log the activity
    const activity = await logAgentActivity({
      artist_id: artistId,
      activity_type: AgentActivityType.APPLICATION_GENERATION,
      status: AgentActivityStatus.IN_PROGRESS,
      details: {
        opportunity_id: opportunityId
      }
    })
    
    // Get the artist's profile
    const profile = await getProfileById(artistId)
    
    if (!profile) {
      await updateAgentActivity(activity.id!, {
        status: AgentActivityStatus.FAILED,
        details: {
          ...activity.details,
          error: 'Artist profile not found'
        }
      })
      throw new Error('Artist profile not found')
    }
    
    // Get the opportunity
    const opportunity = await getOpportunityById(opportunityId)
    
    if (!opportunity) {
      await updateAgentActivity(activity.id!, {
        status: AgentActivityStatus.FAILED,
        details: {
          ...activity.details,
          error: 'Opportunity not found'
        }
      })
      throw new Error('Opportunity not found')
    }
    
    // Generate application content
    const applicationContent = await generateApplicationContent(profile, opportunity)
    
    // Create the application
    const application = await createApplication({
      artist_id: artistId,
      opportunity_id: opportunityId,
      content: applicationContent.fullProposal,
      status: 'draft'
    })
    
    // Update the activity
    await updateAgentActivity(activity.id!, {
      status: AgentActivityStatus.COMPLETED,
      details: {
        ...activity.details,
        application_id: application.id
      }
    })
    
    return activity.id!
  } catch (error) {
    console.error('Error generating application:', error)
    throw error
  }
}

/**
 * Autonomously submit an application for an artist
 */
export async function submitApplication(
  artistId: string,
  applicationId: string
): Promise<string> {
  try {
    // Log the activity
    const activity = await logAgentActivity({
      artist_id: artistId,
      activity_type: AgentActivityType.APPLICATION_SUBMISSION,
      status: AgentActivityStatus.IN_PROGRESS,
      details: {
        application_id: applicationId
      }
    })
    
    // Update the application status
    await updateApplication(applicationId, {
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    
    // Update the activity
    await updateAgentActivity(activity.id!, {
      status: AgentActivityStatus.COMPLETED,
      details: {
        ...activity.details,
        submitted_at: new Date().toISOString()
      }
    })
    
    return activity.id!
  } catch (error) {
    console.error('Error submitting application:', error)
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
  try {
    // Log the activity
    const activity = await logAgentActivity({
      artist_id: artistId,
      activity_type: AgentActivityType.BLOCKCHAIN_INTERACTION,
      status: AgentActivityStatus.IN_PROGRESS,
      details: {
        application_id: applicationId,
        action: 'monitor_status'
      }
    })
    
    // Check if the artist is registered on Flow
    const isRegistered = await isArtistRegistered(artistId)
    
    if (!isRegistered) {
      // Register the artist on Flow
      await registerArtist(artistId, 'flow-address-placeholder')
    }
    
    // Simulate checking the application status
    // In a real implementation, this would interact with the blockchain
    const applicationStatus = Math.random() > 0.5 ? 'approved' : 'pending'
    
    // Update the application status
    await updateApplication(applicationId, {
      status: applicationStatus
    })
    
    // Update the activity
    await updateAgentActivity(activity.id!, {
      status: AgentActivityStatus.COMPLETED,
      details: {
        ...activity.details,
        application_status: applicationStatus,
        checked_at: new Date().toISOString()
      }
    })
    
    return activity.id!
  } catch (error) {
    console.error('Error monitoring application status:', error)
    throw error
  }
}

/**
 * Run the autonomous agent for an artist
 */
export async function runAutonomousAgent(artistId: string): Promise<void> {
  try {
    // Step 1: Discover opportunities
    await discoverOpportunities(artistId)
    
    // Step 2: Match opportunities
    const matchActivityId = await matchOpportunities(artistId)
    
    // Get the match activity to find the top match
    const { data: matchActivity } = await supabase
      .from('agent_activities')
      .select('*')
      .eq('id', matchActivityId)
      .single()
    
    if (matchActivity?.details?.top_match) {
      // Step 3: Generate an application for the top match
      const generateActivityId = await generateApplication(artistId, matchActivity.details.top_match)
      
      // Get the generate activity to find the application ID
      const { data: generateActivity } = await supabase
        .from('agent_activities')
        .select('*')
        .eq('id', generateActivityId)
        .single()
      
      if (generateActivity?.details?.application_id) {
        // Step 4: Submit the application
        const submitActivityId = await submitApplication(artistId, generateActivity.details.application_id)
        
        // Step 5: Monitor the application status
        await monitorApplicationStatus(artistId, generateActivity.details.application_id)
      }
    }
  } catch (error) {
    console.error('Error running autonomous agent:', error)
    throw error
  }
} 