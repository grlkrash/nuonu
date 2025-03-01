import { ActionProvider, ActionProviderParams, ActionProviderResult } from '@coinbase/agentkit';
import { z } from 'zod';
import { Contract, Provider, Wallet } from 'zksync-web3';
import { ethers } from 'ethers';
import { env } from '../../env';

// ABI for the zkSync ArtistFundManager contract
const ZkSyncArtistFundManagerABI = [
  "function submitApplication(string applicationId, string contentHash, string grantId) external",
  "function awardGrant(string grantId, string artistId) external",
  "function distributeFunds(string artistId) external",
  "function getApplication(string applicationId) external view returns (tuple(string id, string contentHash, address artistAddress, string grantId, uint8 status, uint256 timestamp))",
  "event ApplicationSubmitted(string indexed applicationId, string indexed grantId, address indexed artist)",
  "event GrantAwarded(string indexed grantId, string indexed artistId, uint256 amount)"
];

// Input schema for disbursing grants on zkSync
const zkSyncDisburseGrantSchema = z.object({
  artistId: z.string().describe('The ID of the artist to disburse funds to'),
  amount: z.string().describe('The amount to disburse in the native token'),
});

// Input schema for retrieving artist details on zkSync
const zkSyncGetArtistDetailsSchema = z.object({
  artistId: z.string().describe('The ID of the artist to retrieve details for'),
});

/**
 * ZkSyncArtistFundActionProvider - Provides actions for interacting with the zkSync ArtistFundManager contract
 */
export class ZkSyncArtistFundActionProvider implements ActionProvider {
  private walletProvider: any;
  private contractAddress: string;
  private zkSyncProvider: Provider;

  constructor(params?: ActionProviderParams) {
    this.walletProvider = params?.walletProvider;
    // Get contract address from environment variables
    this.contractAddress = env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS || '';
    
    if (!this.contractAddress) {
      console.warn('zkSync contract address not configured');
    }
    
    // Initialize zkSync provider
    this.zkSyncProvider = new Provider(env.NEXT_PUBLIC_ZKSYNC_RPC_URL || 'https://testnet.era.zksync.dev');
  }

  /**
   * Get the actions provided by this action provider
   */
  getActions() {
    return [
      {
        name: 'zkSyncDisburseGrant',
        description: 'Disburse funds to an artist from the zkSync grant fund',
        inputSchema: zkSyncDisburseGrantSchema,
        execute: this.zkSyncDisburseGrant.bind(this),
      },
      {
        name: 'zkSyncGetArtistDetails',
        description: 'Get details about an artist from the zkSync contract',
        inputSchema: zkSyncGetArtistDetailsSchema,
        execute: this.zkSyncGetArtistDetails.bind(this),
      },
    ];
  }

  /**
   * Get a wallet instance for zkSync transactions
   * @private
   */
  private async getWallet() {
    if (!this.walletProvider) {
      throw new Error('Wallet provider not initialized');
    }
    
    const wallet = await this.walletProvider.get();
    
    if (!wallet || !wallet.address) {
      throw new Error('Wallet not initialized');
    }
    
    return wallet;
  }

  /**
   * Get a contract instance for the zkSync ArtistFundManager
   * @private
   */
  private async getContract() {
    if (!this.contractAddress) {
      throw new Error('zkSync contract address not configured');
    }
    
    const wallet = await this.getWallet();
    
    return new Contract(
      this.contractAddress,
      ZkSyncArtistFundManagerABI,
      wallet.signer
    );
  }

  /**
   * Disburse funds to an artist on zkSync
   */
  async zkSyncDisburseGrant(params: { artistId: string; amount: string }): Promise<ActionProviderResult> {
    try {
      const contract = await this.getContract();
      
      // Call distributeFunds function
      const tx = await contract.distributeFunds(params.artistId);
      const receipt = await tx.wait();
      
      return {
        success: true,
        message: `Successfully disbursed funds to artist ${params.artistId} on zkSync. Transaction hash: ${receipt.transactionHash}`,
        data: {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
        },
      };
    } catch (error) {
      console.error('Error disbursing grant on zkSync:', error);
      return {
        success: false,
        message: `Failed to disburse grant on zkSync: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get artist details from the zkSync contract
   */
  async zkSyncGetArtistDetails(params: { artistId: string }): Promise<ActionProviderResult> {
    try {
      const contract = await this.getContract();
      
      // For this example, we'll query the application data as a proxy for artist details
      // In a real implementation, you would have a dedicated function for artist details
      const applicationId = `app-${params.artistId}`;
      const application = await contract.getApplication(applicationId);
      
      return {
        success: true,
        message: `Successfully retrieved artist details for ${params.artistId} from zkSync`,
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
      console.error('Error getting artist details from zkSync:', error);
      return {
        success: false,
        message: `Failed to get artist details from zkSync: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

// Export a factory function to create the action provider
export default function zkSyncArtistFundActionProvider() {
  return (params: ActionProviderParams) => new ZkSyncArtistFundActionProvider(params);
} 