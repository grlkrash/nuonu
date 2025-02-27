import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logAgentActivity, updateAgentActivityStatus } from '@/lib/services/agent-activities';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * POST /api/agent/run
 * Run the autonomous agent for an artist
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { artistId, instructions, autonomousMode, creativeMode, blockchainEnabled } = await request.json();
    
    if (!artistId) {
      return NextResponse.json(
        { error: 'Artist ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the user has permission to access this artist
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('user_id, name')
      .eq('id', artistId)
      .single();
    
    if (artistError || !artistData) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }
    
    if (artistData.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this artist' },
        { status: 403 }
      );
    }
    
    // Log the agent run activity
    const activityId = await logAgentActivity({
      artist_id: artistId,
      activity_type: 'agent_run',
      status: 'in_progress',
      details: {
        message: 'Starting agent run',
        instructions: instructions || 'No specific instructions provided',
        settings: {
          autonomousMode,
          creativeMode,
          blockchainEnabled,
        },
      },
    });
    
    // For the web API, we'll simulate the agent run rather than actually running the script
    // In a production environment, you might use a queue or background job
    
    try {
      // In a real implementation, you would run the agent script
      // For now, we'll simulate success after a short delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the activity with success
      await updateAgentActivityStatus(activityId, 'completed', {
        message: 'Agent run completed successfully',
        results: {
          opportunitiesDiscovered: 5,
          opportunitiesMatched: 3,
          applicationsGenerated: 2,
          applicationsSubmitted: 1,
        },
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json({
        success: true,
        message: 'Agent started successfully',
        activityId,
      });
    } catch (error) {
      console.error('Error running agent:', error);
      
      // Update the activity with failure
      await updateAgentActivityStatus(activityId, 'failed', {
        message: 'Agent run failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json(
        { error: 'Failed to run agent' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in agent run API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 