import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * GET handler for retrieving opportunities
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const searchParams = request.nextUrl.searchParams
    
    // Get query parameters
    const type = searchParams.get('type')
    const query = searchParams.get('query')
    const status = searchParams.get('status') || 'open'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Build the query
    let dbQuery = supabase
      .from('opportunities')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)
    
    // Apply type filter if provided
    if (type && type !== 'all') {
      dbQuery = dbQuery.eq('opportunity_type', type)
    }
    
    // Execute the query
    const { data: opportunities, error } = await dbQuery
    
    if (error) {
      console.error('Error fetching opportunities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch opportunities', message: error.message },
        { status: 500 }
      )
    }
    
    // Apply search filter if provided (client-side filtering would be better for small datasets)
    let filteredOpportunities = opportunities || []
    if (query) {
      const lowerQuery = query.toLowerCase()
      filteredOpportunities = filteredOpportunities.filter(opp => 
        opp.title.toLowerCase().includes(lowerQuery) ||
        opp.description.toLowerCase().includes(lowerQuery) ||
        opp.organization.toLowerCase().includes(lowerQuery) ||
        (opp.eligibility && opp.eligibility.toLowerCase().includes(lowerQuery))
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      opportunities: filteredOpportunities,
      total: filteredOpportunities.length,
      offset,
      limit
    })
  } catch (error) {
    console.error('Error in opportunities API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * POST handler for creating a new opportunity
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to create an opportunity' },
        { status: 401 }
      )
    }
    
    // Get the request body
    const opportunity = await request.json()
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'opportunity_type']
    for (const field of requiredFields) {
      if (!opportunity[field]) {
        return NextResponse.json(
          { error: 'Bad Request', message: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }
    
    // Add creator ID and default status
    opportunity.creator_id = session.user.id
    opportunity.status = opportunity.status || 'draft'
    opportunity.created_at = new Date().toISOString()
    opportunity.updated_at = new Date().toISOString()
    
    // Insert the opportunity
    const { data, error } = await supabase
      .from('opportunities')
      .insert(opportunity)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating opportunity:', error)
      return NextResponse.json(
        { error: 'Failed to create opportunity', message: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      opportunity: data
    })
  } catch (error) {
    console.error('Error in opportunities API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 