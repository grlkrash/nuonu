import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { 
  createArtistWallet, 
  getArtistWalletBalance, 
  runAgentWithAgentKit,
  distributeFundsWithAgentKit
} from '@/lib/services/agent-kit';

/**
 * POST /api/agent/agentkit
 * Create a wallet for an artist using AgentKit
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
    
    const { artistId, action, amount, token, instructions } = await request.json();
    
    if (!artistId) {
      return NextResponse.json(
        { error: 'Artist ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the user has permission to access this artist
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('user_id')
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
    
    let result;
    
    switch (action) {
      case 'create_wallet':
        result = await createArtistWallet(artistId);
        break;
      
      case 'get_balance':
        result = await getArtistWalletBalance(artistId);
        break;
      
      case 'run_agent':
        if (!instructions) {
          return NextResponse.json(
            { error: 'Instructions are required for running the agent' },
            { status: 400 }
          );
        }
        result = await runAgentWithAgentKit(artistId, instructions);
        break;
      
      case 'distribute_funds':
        if (!amount || !token) {
          return NextResponse.json(
            { error: 'Amount and token are required for fund distribution' },
            { status: 400 }
          );
        }
        result = await distributeFundsWithAgentKit(artistId, amount, token);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    if (!result) {
      return NextResponse.json(
        { error: 'Operation failed' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in AgentKit API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/agentkit
 * Get wallet balance for an artist
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const url = new URL(request.url);
    const artistId = url.searchParams.get('artistId');
    
    if (!artistId) {
      return NextResponse.json(
        { error: 'Artist ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the user has permission to access this artist
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('user_id')
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
    
    const balance = await getArtistWalletBalance(artistId);
    
    if (!balance) {
      return NextResponse.json(
        { error: 'Failed to get wallet balance' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: balance });
  } catch (error) {
    console.error('Error in AgentKit API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 