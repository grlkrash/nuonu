import { ActionProvider, ActionProviderParams, ActionProviderResult } from '@coinbase/agentkit';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ethers } from 'ethers';
import { env } from '../../env';

// Initialize Supabase client
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ABI for the ArtistFundManager contract
const ArtistFundManagerABI = [
  "function submitApplication(string applicationId, string contentHash, string grantId) external",
  "function awardGrant(string grantId, string artistId) external",
  "function distributeFunds(string artistId) external",
  "function getApplication(string applicationId) external view returns (tuple(string id, string contentHash, address artistAddress, string grantId, uint8 status, uint256 timestamp))",
  "event ApplicationSubmitted(string indexed applicationId, string indexed grantId, address indexed artist)",
  "event GrantAwarded(string indexed grantId, string indexed artistId, uint256 amount)"
];

// Input schema for disbursing grants
const disburseGrantSchema = z.object({
  artistId: z.string().describe('The ID of the artist to disburse funds to'),
  amount: z.string().describe('The amount to disburse in the native token'),
});

// Input schema for retrieving artist details
const getArtistDetailsSchema = z.object({
  artistId: z.string().describe('The ID of the artist to retrieve details for'),
});

// Input schema for creating artist wallet
const createArtistWalletSchema = z.object({
  artistId: z.string().describe('The ID of the artist to create a wallet for'),
  email: z.string().email().describe('The email of the artist'),
});

/**
 * ArtistFundActionProvider - Provides actions for interacting with the ArtistFundManager contract
 */
export class ArtistFundActionProvider implements ActionProvider {
  private walletProvider: any;
  private contractAddress: string;

  constructor(params: ActionProviderParams) {
    this.walletProvider = params.walletProvider;
    // Get contract address from environment variables
    this.contractAddress = env.NEXT_PUBLIC_BASE_CONTRACT_ADDRESS || '';
    
    if (!this.contractAddress) {
      console.warn('Base contract address not configured');
    }
  }

  /**
   * Get the actions provided by this action provider
   */
  getActions() {
    return [
      {
        name: 'disburseGrant',
        description: 'Disburse funds to an artist from the grant fund',
        inputSchema: disburseGrantSchema,
        execute: this.disburseGrant.bind(this),
      },
      {
        name: 'getArtistDetails',
        description: 'Get details about an artist from the contract',
        inputSchema: getArtistDetailsSchema,
        execute: this.getArtistDetails.bind(this),
      },
      {
        name: 'createArtistWallet',
        description: 'Create a new wallet for an artist and store it in the database',
        inputSchema: createArtistWalletSchema,
        execute: this.createArtistWallet.bind(this),
      },
    ];
  }

  /**
   * Disburse funds to an artist
   */
  async disburseGrant(params: { artistId: string; amount: string }): Promise<ActionProviderResult> {
    try {
      // Get wallet from provider
      const wallet = await this.walletProvider.get();
      
      if (!wallet || !wallet.address) {
        return {
          success: false,
          message: 'Wallet not initialized',
        };
      }
      
      if (!this.contractAddress) {
        return {
          success: false,
          message: 'Contract address not configured',
        };
      }
      
      // Create contract instance
      const contract = new ethers.Contract(
        this.contractAddress,
        ArtistFundManagerABI,
        wallet.signer
      );
      
      // Call distributeFunds function
      const tx = await contract.distributeFunds(params.artistId);
      const receipt = await tx.wait();
      
      return {
        success: true,
        message: `Successfully disbursed funds to artist ${params.artistId}. Transaction hash: ${receipt.transactionHash}`,
        data: {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
        },
      };
    } catch (error) {
      console.error('Error disbursing grant:', error);
      return {
        success: false,
        message: `Failed to disburse grant: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get artist details from the contract
   */
  async getArtistDetails(params: { artistId: string }): Promise<ActionProviderResult> {
    try {
      // Get wallet from provider
      const wallet = await this.walletProvider.get();
      
      if (!wallet || !wallet.address) {
        return {
          success: false,
          message: 'Wallet not initialized',
        };
      }
      
      if (!this.contractAddress) {
        return {
          success: false,
          message: 'Contract address not configured',
        };
      }
      
      // Create contract instance
      const contract = new ethers.Contract(
        this.contractAddress,
        ArtistFundManagerABI,
        wallet.signer
      );
      
      // For this example, we'll query the application data as a proxy for artist details
      // In a real implementation, you would have a dedicated function for artist details
      const applicationId = `app-${params.artistId}`;
      const application = await contract.getApplication(applicationId);
      
      return {
        success: true,
        message: `Successfully retrieved artist details for ${params.artistId}`,
        data: {
          id: application.id,
          contentHash: application.contentHash,
          artistAddress: application.artistAddress,
          grantId: application.grantId,
          status: application.status,
          timestamp: application.timestamp.toString(),
        },
      };
    } catch (error) {
      console.error('Error getting artist details:', error);
      return {
        success: false,
        message: `Failed to get artist details: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Create a new wallet for an artist and store it in the database
   */
  async createArtistWallet(params: { artistId: string; email: string }): Promise<ActionProviderResult> {
    try {
      // Check if CDP wallet provider is available
      if (!this.walletProvider || typeof this.walletProvider.exportWallet !== 'function') {
        return {
          success: false,
          message: 'CDP wallet provider not available',
        };
      }
      
      // Get current wallet details
      const wallet = await this.walletProvider.get();
      
      if (!wallet || !wallet.address) {
        return {
          success: false,
          message: 'Wallet not initialized',
        };
      }
      
      // For this example, we'll use the existing wallet
      // In a production environment, you would create a new wallet for each artist
      const walletAddress = wallet.address;
      
      // Store wallet information in Supabase
      const { data, error } = await supabase
        .from('artist_wallets')
        .insert([
          {
            artist_id: params.artistId,
            wallet_address: walletAddress,
            email: params.email,
            created_at: new Date().toISOString(),
          },
        ]);
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      return {
        success: true,
        message: `Successfully created wallet for artist ${params.artistId}`,
        data: {
          artistId: params.artistId,
          walletAddress,
        },
      };
    } catch (error) {
      console.error('Error creating artist wallet:', error);
      return {
        success: false,
        message: `Failed to create artist wallet: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

// Export a factory function to create the action provider
export default function artistFundActionProvider() {
  return (params: ActionProviderParams) => new ArtistFundActionProvider(params);
} 