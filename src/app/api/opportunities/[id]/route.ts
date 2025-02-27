import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET handler for retrieving a single opportunity by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Opportunity ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Fetch the opportunity
    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Not Found', message: 'Opportunity not found' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching opportunity:', error)
      return NextResponse.json(
        { error: 'Failed to fetch opportunity', message: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      opportunity 
    })
  } catch (error) {
    console.error('Error in opportunity API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * PATCH handler for updating an opportunity
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Opportunity ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to update an opportunity' },
        { status: 401 }
      )
    }
    
    // Fetch the opportunity to check ownership
    const { data: existingOpportunity, error: fetchError } = await supabase
      .from('opportunities')
      .select('creator_id')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Not Found', message: 'Opportunity not found' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching opportunity:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch opportunity', message: fetchError.message },
        { status: 500 }
      )
    }
    
    // Check if the user is the creator of the opportunity
    if (existingOpportunity.creator_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only update your own opportunities' },
        { status: 403 }
      )
    }
    
    // Get the request body
    const updates = await request.json()
    
    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()
    
    // Update the opportunity
    const { data, error } = await supabase
      .from('opportunities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating opportunity:', error)
      return NextResponse.json(
        { error: 'Failed to update opportunity', message: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      opportunity: data 
    })
  } catch (error) {
    console.error('Error in opportunity API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE handler for deleting an opportunity
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Opportunity ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to delete an opportunity' },
        { status: 401 }
      )
    }
    
    // Fetch the opportunity to check ownership
    const { data: existingOpportunity, error: fetchError } = await supabase
      .from('opportunities')
      .select('creator_id')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Not Found', message: 'Opportunity not found' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching opportunity:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch opportunity', message: fetchError.message },
        { status: 500 }
      )
    }
    
    // Check if the user is the creator of the opportunity
    if (existingOpportunity.creator_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only delete your own opportunities' },
        { status: 403 }
      )
    }
    
    // Delete the opportunity
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting opportunity:', error)
      return NextResponse.json(
        { error: 'Failed to delete opportunity', message: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Opportunity deleted successfully' 
    })
  } catch (error) {
    console.error('Error in opportunity API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 