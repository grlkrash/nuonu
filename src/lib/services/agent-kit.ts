/**
 * AgentKit integration for the Artist Grant AI Agent
 * This service provides blockchain interaction capabilities using Coinbase's AgentKit
 */

import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { Database } from '@/types/supabase';
import { logAgentActivity, updateAgentActivityStatus } from './agent-activities';
import { AgentKit, CdpWalletProvider } from '@coinbase/agentkit';
import { 
  cdpWalletActionProvider,
  cdpApiActionProvider,
  erc20ActionProvider,
  pythActionProvider,
  walletActionProvider,
  wethActionProvider
} from '@coinbase/agentkit/providers';
import { HumanMessage } from 'langchain/schema';
import { getLangChainTools, createReactAgent } from '@coinbase/agentkit-langchain';
import { agentConfig, AGENT_ID } from '@/config/agent.config';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

/**
 * Initialize AgentKit with the necessary configuration
 */
export async function initializeAgentKit() {
  try {
    const cdpConfig = {
      apiKey: process.env.COINBASE_API_KEY,
      apiSecret: process.env.COINBASE_API_SECRET,
      ...agentConfig // Include our network and persistence settings
    };
    
    if (!cdpConfig.apiKey || !cdpConfig.apiSecret) {
      throw new Error('Missing CDP credentials');
    }
    
    const walletProvider = new CdpWalletProvider(cdpConfig);
    
    const agentkit = new AgentKit({
      walletProvider,
      actionProviders: [
        cdpWalletActionProvider(),
        cdpApiActionProvider(),
        erc20ActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        wethActionProvider(),
      ]
    });
    
    return agentkit;
  } catch (error) {
    console.error('Error initializing AgentKit:', error);
    throw error;
  }
}

/**
 * Create a wallet for an artist using AgentKit
 * @param artistId The ID of the artist
 */
export async function createArtistWallet(artistId: string) {
  try {
    const activityId = await logAgentActivity({
      artist_id: artistId,
      activity_type: 'wallet_creation',
      status: 'in_progress',
      details: { message: 'Creating wallet for artist' },
    });
    
    // Initialize AgentKit
    const agentKit = await initializeAgentKit();
    
    // Create wallet using CDP
    const wallet = await agentKit.walletProvider.createWallet({
      name: `Artist Wallet - ${artistId}`,
      description: 'Wallet for managing artist grants and funds',
    });
    
    // Store wallet address in database
    const { error } = await supabase
      .from('artist_wallets')
      .upsert({
        artist_id: artistId,
        wallet_address: wallet.address,
        blockchain: 'ethereum',
        created_at: new Date().toISOString(),
        wallet_id: wallet.id, // Store CDP wallet ID
      });
    
    if (error) {
      await updateAgentActivityStatus(activityId, 'failed', {
        message: 'Failed to store wallet address',
        error: error.message,
      });
      return null;
    }
    
    await updateAgentActivityStatus(activityId, 'completed', {
      message: 'Wallet created successfully',
      wallet_address: wallet.address,
      wallet_id: wallet.id,
    });
    
    return wallet.address;
  } catch (error) {
    console.error('Error creating artist wallet:', error);
    return null;
  }
}

/**
 * Get the balance of an artist's wallet
 * @param artistId The ID of the artist
 */
export async function getArtistWalletBalance(artistId: string) {
  try {
    // Get wallet address from database
    const { data: walletData, error: walletError } = await supabase
      .from('artist_wallets')
      .select('wallet_address, wallet_id')
      .eq('artist_id', artistId)
      .single();
    
    if (walletError || !walletData) {
      console.error('Error getting wallet address:', walletError);
      return null;
    }
    
    const activityId = await logAgentActivity({
      artist_id: artistId,
      activity_type: 'wallet_balance_check',
      status: 'in_progress',
      details: { 
        message: 'Checking wallet balance',
        wallet_address: walletData.wallet_address,
      },
    });
    
    // Initialize AgentKit
    const agentKit = await initializeAgentKit();
    
    // Get balance using CDP
    const balance = await agentKit.walletProvider.getBalance({
      walletId: walletData.wallet_id,
      address: walletData.wallet_address,
    });
    
    await updateAgentActivityStatus(activityId, 'completed', {
      message: 'Wallet balance retrieved successfully',
      wallet_address: walletData.wallet_address,
      balance: balance.balance,
      symbol: balance.symbol,
    });
    
    return balance;
  } catch (error) {
    console.error('Error getting artist wallet balance:', error);
    return null;
  }
}

/**
 * Run the autonomous agent with AgentKit capabilities
 * @param artistId The ID of the artist
 * @param instructions Instructions for the agent
 */
export async function runAgentWithAgentKit(artistId: string, instructions: string) {
  try {
    const activityId = await logAgentActivity({
      artist_id: artistId,
      activity_type: 'agent_run',
      status: 'in_progress',
      details: { 
        message: 'Running autonomous agent with AgentKit',
        instructions,
      },
    });
    
    // Get artist profile
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single();
    
    if (artistError || !artistData) {
      await updateAgentActivityStatus(activityId, 'failed', {
        message: 'Failed to get artist profile',
        error: artistError?.message,
      });
      return null;
    }
    
    // Initialize AgentKit
    const agentKit = await initializeAgentKit();
    
    // Create LangChain agent with AgentKit tools
    const tools = getLangChainTools(agentKit);
    const agent = await createReactAgent({
      llm: openai,
      tools,
      systemMessage: `You are an AI agent for artist ${artistData.name}. You have access to blockchain capabilities through AgentKit.`,
    });
    
    // Run the agent
    const response = await agent.invoke([
      new HumanMessage(instructions)
    ]);
    
    await updateAgentActivityStatus(activityId, 'completed', {
      message: 'Agent run completed successfully',
      response: response.content,
    });
    
    return response.content;
  } catch (error) {
    console.error('Error running agent with AgentKit:', error);
    return null;
  }
}

/**
 * Distribute funds to an artist using AgentKit
 * @param artistId The ID of the artist
 * @param amount The amount to distribute
 * @param token The token symbol (e.g., 'ETH', 'USDC')
 */
export async function distributeFundsWithAgentKit(
  artistId: string, 
  amount: string, 
  token: string
) {
  try {
    // Get wallet address from database
    const { data: walletData, error: walletError } = await supabase
      .from('artist_wallets')
      .select('wallet_address, wallet_id')
      .eq('artist_id', artistId)
      .single();
    
    if (walletError || !walletData) {
      console.error('Error getting wallet address:', walletError);
      return null;
    }
    
    const activityId = await logAgentActivity({
      artist_id: artistId,
      activity_type: 'fund_distribution',
      status: 'in_progress',
      details: { 
        message: 'Distributing funds to artist',
        wallet_address: walletData.wallet_address,
        amount,
        token,
      },
    });
    
    // Initialize AgentKit
    const agentKit = await initializeAgentKit();
    
    // Send transaction using CDP
    const tx = await agentKit.walletProvider.sendTransaction({
      walletId: walletData.wallet_id,
      to: walletData.wallet_address,
      value: amount,
      token,
    });
    
    await updateAgentActivityStatus(activityId, 'completed', {
      message: 'Funds distributed successfully',
      wallet_address: walletData.wallet_address,
      amount,
      token,
      transaction_hash: tx.hash,
    });
    
    return {
      success: true,
      transaction_hash: tx.hash,
    };
  } catch (error) {
    console.error('Error distributing funds with AgentKit:', error);
    return null;
  }
} 