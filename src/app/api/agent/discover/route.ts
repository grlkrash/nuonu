import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { scrapeExternalOpportunities } from '@/lib/services/browser-base'
import { logAgentActivity } from '@/lib/services/agent-activities'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { query, preferences } = body
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }
    
    // Log the discovery request
    await supabase
      .from('agent_activities')
      .insert({
        user_id: session.user.id,
        activity_type: 'discovery',
        details: {
          query,
          preferences: preferences || {}
        }
      })
    
    // Log the start of the discovery process
    await logAgentActivity({
      artist_id: session.user.id,
      activity_type: 'discover_opportunities',
      status: 'in_progress',
      details: {
        message: `Starting external opportunity discovery`,
        source: 'browser_base'
      }
    })

    // Discover opportunities using Browser Base
    const result = await scrapeExternalOpportunities(query)

    // Log the completion of the discovery process
    await logAgentActivity({
      artist_id: session.user.id,
      activity_type: 'discover_opportunities',
      status: 'completed',
      details: {
        message: `Discovered ${result?.opportunities?.length || 0} external opportunities`,
        source: 'browser_base',
        count: result?.opportunities?.length || 0
      }
    })

    // Return the result
    return NextResponse.json({
      success: true,
      opportunities: result?.opportunities || [],
      message: `Discovered ${result?.opportunities?.length || 0} opportunities`
    })
  } catch (error) {
    console.error('Error in agent discovery:', error)
    
    // Log the error
    try {
      await logAgentActivity({
        artist_id: 'system',
        activity_type: 'discover_opportunities',
        status: 'failed',
        details: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          source: 'browser_base'
        }
      })
    } catch (logError) {
      console.error('Error logging activity:', logError)
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 