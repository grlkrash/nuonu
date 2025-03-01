import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
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
    
    // Check if the user has an active agent
    const { data: agentData, error: agentError } = await supabase
      .from('agent_instances')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single()
    
    if (agentError && agentError.code !== 'PGRST116') {
      console.error('Error checking agent status:', agentError)
      return NextResponse.json(
        { error: 'Failed to check agent status' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      isRunning: !!agentData,
      agentData: agentData || null
    })
  } catch (error) {
    console.error('Error in agent status check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 