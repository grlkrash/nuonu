import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { supabase } from '@/lib/supabase/client'
import { generateProfileInsights, evaluateOpportunityMatch, generateApplicationContent } from '@/lib/services/openai'
import { getMatchedOpportunities } from '@/lib/services/ai-matching'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { discoverOpportunitiesWithEliza } from '@/lib/services/eliza-twitter'
import { matchOpportunities, generateApplication, submitApplication, monitorApplicationStatus, runAutonomousAgent } from '@/lib/services/agent-activities'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { action, artistId } = body
    
    // Verify that the request is for the authenticated user
    if (artistId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to perform actions for this artist' },
        { status: 403 }
      )
    }
    
    // Handle different actions
    switch (action) {
      case 'discover':
        const source = body.source || 'eliza-twitter'
        const activityId = await discoverOpportunitiesWithEliza(artistId)
        return NextResponse.json({ success: true, activityId })
      
      case 'match':
        const matchActivityId = await matchOpportunities(artistId)
        return NextResponse.json({ success: true, activityId: matchActivityId })
      
      case 'generate_application':
        const { opportunityId } = body
        if (!opportunityId) {
          return NextResponse.json(
            { error: 'Opportunity ID is required' },
            { status: 400 }
          )
        }
        const generateActivityId = await generateApplication(artistId, opportunityId)
        return NextResponse.json({ success: true, activityId: generateActivityId })
      
      case 'submit_application':
        const { applicationId } = body
        if (!applicationId) {
          return NextResponse.json(
            { error: 'Application ID is required' },
            { status: 400 }
          )
        }
        const submitActivityId = await submitApplication(artistId, applicationId)
        return NextResponse.json({ success: true, activityId: submitActivityId })
      
      case 'monitor_application':
        const { applicationIdToMonitor } = body
        if (!applicationIdToMonitor) {
          return NextResponse.json(
            { error: 'Application ID is required' },
            { status: 400 }
          )
        }
        const monitorActivityId = await monitorApplicationStatus(artistId, applicationIdToMonitor)
        return NextResponse.json({ success: true, activityId: monitorActivityId })
      
      case 'autonomous':
        // Run the autonomous agent in the background
        // This will not wait for completion
        runAutonomousAgent(artistId).catch(error => {
          console.error('Error running autonomous agent:', error)
        })
        return NextResponse.json({ success: true, message: 'Autonomous agent started' })
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in agent API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle discovery requests
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const artistId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    
    if (action === 'activities') {
      // Get recent activities
      const { data, error } = await supabase
        .from('agent_activities')
        .select('*')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      
      return NextResponse.json({ success: true, activities: data })
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in agent API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

export async function search_opportunities(request: NextRequest) {
  try {
    const { query } = await request.json()

    // Validate request
    if (!query) {
      return NextResponse.json(
        { error: 'Missing required parameter: query' },
        { status: 400 }
      )
    }
    
    // Get opportunities from database
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      throw error
    }
    
    // Use OpenAI to find relevant opportunities based on the query
    const prompt = `
      I have a search query from an artist looking for opportunities: "${query}"
      
      Here are some available opportunities:
      ${opportunities.slice(0, 20).map((opp, index) => `
      Opportunity ${index + 1}:
      - ID: ${opp.id}
      - Title: ${opp.title}
      - Type: ${opp.opportunity_type}
      - Description: ${opp.description}
      - Organization: ${opp.organization}
      - Eligibility: ${opp.eligibility || 'Not specified'}
      - Amount: ${opp.amount || 'Not specified'}
      - Deadline: ${opp.deadline || 'Not specified'}
      `).join('\n')}
      
      Return the IDs of the opportunities that are most relevant to the search query "${query}".
      Format your response as a JSON array of opportunity IDs, ordered by relevance.
      Example: ["opp-id-1", "opp-id-2", "opp-id-3"]
    `
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system", 
          content: "You are an expert in matching artists with relevant opportunities. Analyze the search query and available opportunities to determine the best matches. Return your response as a JSON array of opportunity IDs."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    })
    
    // Parse the response
    const responseText = completion.choices[0].message.content
    const matchedIds = JSON.parse(responseText).ids || []
    
    // Filter and return the matched opportunities
    const matchedOpportunities = opportunities.filter(opp => 
      matchedIds.includes(opp.id)
    )
    
    return NextResponse.json({ results: matchedOpportunities })
  } catch (error) {
    console.error('Error in AI agent:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
} 