import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { supabase } from '@/lib/supabase/client'
import { generateProfileInsights, evaluateOpportunityMatch, generateApplicationContent } from '@/lib/services/openai'
import { getMatchedOpportunities } from '@/lib/services/ai-matching'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { discoverOpportunitiesWithEliza } from '@/lib/services/eliza-twitter'
import { matchOpportunities, generateApplication, submitApplication, monitorApplicationStatus, runAutonomousAgent } from '@/lib/services/agent-activities'
import { getProfileById } from '@/lib/services/profiles'

// Initialize OpenAI client with error handling
let openai: OpenAI | null = null
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error)
}

/**
 * Main API route handler for agent actions
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize OpenAI client
    let openai
    try {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    } catch (error) {
      console.error('Error initializing OpenAI client:', error)
    }
    
    // Get the request body
    const body = await request.json()
    const { action, userId, opportunityId, applicationId } = body
    
    // Check if the user is authenticated
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to use the AI agent' },
        { status: 401 }
      )
    }
    
    // Use the authenticated user's ID if userId is not provided
    const authenticatedUserId = session.user.id
    const targetUserId = userId || authenticatedUserId
    
    // Check if the user is trying to perform actions for another user
    if (targetUserId !== authenticatedUserId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only perform actions for your own account' },
        { status: 403 }
      )
    }
    
    // Handle different actions
    switch (action) {
      case 'discover':
        return discoverOpportunities(targetUserId)
      
      case 'match':
        if (!opportunityId) {
          return NextResponse.json(
            { error: 'Bad Request', message: 'Opportunity ID is required' },
            { status: 400 }
          )
        }
        return matchOpportunity(targetUserId, opportunityId)
      
      case 'get_matches':
        return getMatches(targetUserId)
      
      case 'generate_application':
        if (!opportunityId) {
          return NextResponse.json(
            { error: 'Bad Request', message: 'Opportunity ID is required' },
            { status: 400 }
          )
        }
        return generateApplication(targetUserId, opportunityId)
      
      case 'submit_application':
        if (!applicationId) {
          return NextResponse.json(
            { error: 'Bad Request', message: 'Application ID is required' },
            { status: 400 }
          )
        }
        return submitApplication(targetUserId, applicationId)
      
      case 'monitor_application':
        if (!applicationId) {
          return NextResponse.json(
            { error: 'Bad Request', message: 'Application ID is required' },
            { status: 400 }
          )
        }
        return monitorApplication(targetUserId, applicationId)
      
      case 'generate_insights':
        if (!opportunityId) {
          return NextResponse.json(
            { error: 'Bad Request', message: 'Opportunity ID is required' },
            { status: 400 }
          )
        }
        return generateInsights(targetUserId, opportunityId)
      
      case 'autonomous':
        return runAutonomousAgent(targetUserId)
      
      default:
        return NextResponse.json(
          { error: 'Bad Request', message: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in agent API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * GET handler for retrieving agent data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to access agent data' },
        { status: 401 }
      )
    }
    
    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'matches'
    
    switch (action) {
      case 'activities':
        // Get recent activities
        const { data: activities, error: activitiesError } = await supabase
          .from('agent_activities')
          .select('*')
          .eq('artist_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (activitiesError) throw activitiesError
        
        return NextResponse.json({ success: true, activities: activities || [] })
      
      case 'matches':
        // Get AI-matched opportunities
        try {
          const profile = await getProfileById(userId)
          
          if (!profile) {
            return NextResponse.json(
              { error: 'Not Found', message: 'User profile not found' },
              { status: 404 }
            )
          }
          
          const matchResults = await getMatchedOpportunities(profile)
          return NextResponse.json({ 
            success: true, 
            matches: {
              highMatches: matchResults.highMatches || [],
              mediumMatches: matchResults.mediumMatches || [],
              otherMatches: matchResults.otherMatches || []
            }
          })
        } catch (matchError) {
          console.error('Error getting matches:', matchError)
          return NextResponse.json(
            { error: 'Internal Server Error', message: 'Failed to get opportunity matches' },
            { status: 500 }
          )
        }
      
      case 'status':
        // Get agent status
        const { data: agentSettings, error: settingsError } = await supabase
          .from('agent_settings')
          .select('*')
          .eq('artist_id', userId)
          .single()
        
        if (settingsError && settingsError.code !== 'PGRST116') {
          throw settingsError
        }
        
        const isActive = agentSettings?.is_active || false
        const lastRun = agentSettings?.last_run || null
        
        return NextResponse.json({ 
          success: true, 
          status: {
            isActive,
            lastRun,
            settings: agentSettings || { artist_id: userId, is_active: false }
          }
        })
      
      default:
        return NextResponse.json(
          { error: 'Bad Request', message: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in agent API route:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Legacy functions - kept for backward compatibility
export async function match_opportunities(request: NextRequest) {
  try {
    const { profile } = await request.json()

    // Validate request
    if (!profile) {
      return NextResponse.json(
        { error: 'Missing required parameter: profile' },
        { status: 400 }
      )
    }
    
    const matchResults = await getMatchedOpportunities(profile)
    return NextResponse.json({ results: matchResults })
  } catch (error) {
    console.error('Error in AI agent:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}

export async function evaluate_match(request: NextRequest) {
  try {
    const { profile, opportunity } = await request.json()

    // Validate request
    if (!profile || !opportunity) {
      return NextResponse.json(
        { error: 'Missing required parameters: profile and/or opportunity' },
        { status: 400 }
      )
    }
    
    const matchEvaluation = await evaluateOpportunityMatch(profile, opportunity)
    return NextResponse.json({ evaluation: matchEvaluation })
  } catch (error) {
    console.error('Error in AI agent:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}

export async function generate_application(request: NextRequest) {
  try {
    const { profile, opportunity } = await request.json()

    // Validate request
    if (!profile || !opportunity) {
      return NextResponse.json(
        { error: 'Missing required parameters: profile and/or opportunity' },
        { status: 400 }
      )
    }
    
    const applicationContent = await generateApplicationContent(profile, opportunity)
    return NextResponse.json({ content: applicationContent })
  } catch (error) {
    console.error('Error in AI agent:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}

export async function generate_insights(request: NextRequest) {
  try {
    const { profile } = await request.json()

    // Validate request
    if (!profile) {
      return NextResponse.json(
        { error: 'Missing required parameter: profile' },
        { status: 400 }
      )
    }
    
    const insights = await generateProfileInsights(profile)
    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Error in AI agent:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}

// Handle the generate_insights action
async function generateInsights(userId: string, opportunityId: string) {
  try {
    // Validate parameters
    if (!opportunityId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Opportunity ID is required' },
        { status: 400 }
      )
    }
    
    // Fetch the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile', message: profileError.message },
        { status: 500 }
      )
    }
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Profile not found' },
        { status: 404 }
      )
    }
    
    // Fetch the opportunity
    const { data: opportunity, error: opportunityError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single()
    
    if (opportunityError) {
      console.error('Error fetching opportunity:', opportunityError)
      return NextResponse.json(
        { error: 'Failed to fetch opportunity', message: opportunityError.message },
        { status: 500 }
      )
    }
    
    if (!opportunity) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Opportunity not found' },
        { status: 404 }
      )
    }
    
    // Create a prompt for the OpenAI API
    const prompt = `
      You are an AI assistant helping an artist or creative professional understand how their profile matches with an opportunity.
      
      User Profile:
      - Name: ${profile.name || 'Not specified'}
      - Bio: ${profile.bio || 'Not specified'}
      - Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills || 'Not specified'}
      - Interests: ${Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests || 'Not specified'}
      - Experience: ${profile.experience || 'Not specified'}
      - Location: ${profile.location || 'Not specified'}
      
      Opportunity:
      - Title: ${opportunity.title}
      - Organization: ${opportunity.organization}
      - Description: ${opportunity.description}
      - Requirements: ${opportunity.requirements || 'Not specified'}
      - Eligibility: ${opportunity.eligibility || 'Not specified'}
      - Location: ${opportunity.location || 'Not specified'}
      - Remote: ${opportunity.is_remote ? 'Yes' : 'No'}
      
      Provide a brief analysis (3-5 sentences) of how the user's profile aligns with this opportunity. 
      Highlight strengths and potential areas where the user might want to emphasize in their application.
      Be honest but encouraging, and provide actionable advice.
    `
    
    // Call the OpenAI API
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant providing insights on opportunity matches.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      })
      
      const insights = completion.choices[0]?.message?.content?.trim()
      
      if (!insights) {
        throw new Error('Failed to generate insights')
      }
      
      return NextResponse.json({
        success: true,
        insights
      })
    } catch (error) {
      console.error('Error calling OpenAI API:', error)
      return NextResponse.json(
        { error: 'Service Unavailable', message: 'Failed to generate insights' },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Handle the get_matches action
async function getMatches(userId: string) {
  try {
    // Fetch the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile', message: profileError.message },
        { status: 500 }
      )
    }
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Profile not found' },
        { status: 404 }
      )
    }
    
    // Get matched opportunities using the AI matching service
    try {
      const { getMatchedOpportunities } = await import('@/lib/services/ai-matching')
      const matchResults = await getMatchedOpportunities(profile)
      
      return NextResponse.json({ 
        success: true, 
        matches: {
          highMatches: matchResults.highMatches || [],
          mediumMatches: matchResults.mediumMatches || [],
          otherMatches: matchResults.otherMatches || []
        }
      })
    } catch (matchError) {
      console.error('Error getting matches:', matchError)
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to get opportunity matches' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in getMatches:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 