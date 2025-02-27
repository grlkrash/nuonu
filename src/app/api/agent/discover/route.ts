import { NextResponse } from 'next/server'
import { scrapeExternalOpportunities } from '@/lib/services/browser-base'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logAgentActivity } from '@/lib/services/agent-activities'

export async function POST(request: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { urls, artistId } = body

    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Valid URLs array is required' },
        { status: 400 }
      )
    }

    // Log the start of the discovery process
    await logAgentActivity({
      artist_id: artistId || session.user.id,
      activity_type: 'opportunity_discovery',
      status: 'in_progress',
      details: {
        message: `Starting external opportunity discovery from ${urls.length} sources`,
        source: 'browser_base'
      }
    })

    // Discover opportunities using Browser Base
    const result = await scrapeExternalOpportunities(urls)

    // Log the completion of the discovery process
    await logAgentActivity({
      artist_id: artistId || session.user.id,
      activity_type: 'opportunity_discovery',
      status: 'completed',
      details: {
        message: `Discovered ${result.opportunities.length} external opportunities`,
        source: 'browser_base',
        count: result.opportunities.length
      }
    })

    // Return the result
    return NextResponse.json({
      success: true,
      opportunities: result.opportunities,
      message: `Discovered ${result.opportunities.length} opportunities`
    })
  } catch (error) {
    console.error('Error in discover API route:', error)
    
    // Log the error
    try {
      const body = await request.json()
      await logAgentActivity({
        artist_id: body.artistId || 'system',
        activity_type: 'opportunity_discovery',
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
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    )
  }
} 