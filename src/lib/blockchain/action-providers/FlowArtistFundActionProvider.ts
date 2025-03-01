import { ActionProvider, ActionProviderParams, ActionProviderResult } from '@coinbase/agentkit';
import { z } from 'zod';
import * as fcl from '@onflow/fcl';
import { env } from '../../env';

// Input schema for disbursing grants on Flow
const flowDisburseGrantSchema = z.object({
  artistId: z.string().describe('The ID of the artist to disburse funds to'),
  amount: z.string().describe('The amount to disburse in the native token'),
});

// Input schema for retrieving artist details on Flow
const flowGetArtistDetailsSchema = z.object({
  artistId: z.string().describe('The ID of the artist to retrieve details for'),
});

// Input schema for registering artists on Flow
const flowRegisterArtistSchema = z.object({
  artistId: z.string().describe('The ID of the artist to register'),
  address: z.string().describe('The Flow address of the artist'),
  optimismAddress: z.string().optional().describe('The Optimism address of the artist (optional)'),
});

// Input schema for initiating cross-chain transactions
const flowInitiateCrossChainTransactionSchema = z.object({
  artistId: z.string().describe('The ID of the artist initiating the transaction'),
  amount: z.string().describe('The amount to transfer in the native token'),
  targetChain: z.string().describe('The target chain for the transaction (e.g., "optimism")'),
  targetAddress: z.string().describe('The address on the target chain to send funds to'),
});

/**
 * FlowArtistFundActionProvider - Provides actions for interacting with the Flow ArtistFundManager contract
 */
export class FlowArtistFundActionProvider implements ActionProvider {
  private walletProvider: any;
  private contractAddress: string;

  constructor(params: ActionProviderParams) {
    this.walletProvider = params.walletProvider;
    this.contractAddress = env.NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS || '';
    
    // Configure FCL
    fcl.config()
      .put('accessNode.api', env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
      .put('discovery.wallet', env.NEXT_PUBLIC_FLOW_WALLET_DISCOVERY || 'https://fcl-discovery.onflow.org/testnet/authn')
      .put('app.detail.title', 'Artist Grant AI')
      .put('app.detail.icon', 'https://placekitten.com/g/200/200');
  }

  /**
   * Get the actions provided by this action provider
   */
  getActions() {
    return [
      {
        name: 'flowDisburseGrant',
        description: 'Disburse funds to an artist from the Flow grant fund',
        inputSchema: flowDisburseGrantSchema,
        execute: this.flowDisburseGrant.bind(this),
      },
      {
        name: 'flowGetArtistDetails',
        description: 'Get details about an artist from the Flow contract',
        inputSchema: flowGetArtistDetailsSchema,
        execute: this.flowGetArtistDetails.bind(this),
      },
      {
        name: 'flowRegisterArtist',
        description: 'Register an artist with the Flow contract',
        inputSchema: flowRegisterArtistSchema,
        execute: this.flowRegisterArtist.bind(this),
      },
      {
        name: 'flowInitiateCrossChainTransaction',
        description: 'Initiate a cross-chain transaction to Optimism',
        inputSchema: flowInitiateCrossChainTransactionSchema,
        execute: this.flowInitiateCrossChainTransaction.bind(this),
      },
    ];
  }

  /**
   * Disburse funds to an artist on Flow
   */
  async flowDisburseGrant(params: { artistId: string; amount: string }): Promise<ActionProviderResult> {
    try {
      console.log(`Disbursing grant to artist ${params.artistId} with amount ${params.amount} FLOW`);
      
      // Check if Flow is configured
      const user = await fcl.currentUser().snapshot();
      
      if (!user.loggedIn) {
        return {
          success: false,
          message: 'Flow wallet not authenticated',
        };
      }
      
      // Cadence script for disbursing funds
      const cadence = `
        import FlowArtistManager from ${this.contractAddress}
        
        transaction(artistId: String) {
          prepare(signer: AuthAccount) {
            let fundManager = signer.borrow<&FlowArtistManager.FundManager>(from: /storage/ArtistFundManager)
              ?? panic("Could not borrow reference to the fund manager")
            
            fundManager.distributeFunds(artistId: artistId)
          }
        }
      `;
      
      // Execute transaction
      const txId = await fcl.mutate({
        cadence,
        args: (arg: any, t: any) => [arg(params.artistId, t.String)],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000,
      });
      
      // Wait for transaction to be sealed
      const txStatus = await fcl.tx(txId).onceSealed();
      
      return {
        success: true,
        message: `Successfully disbursed funds to artist ${params.artistId} on Flow. Transaction ID: ${txId}`,
        data: {
          transactionId: txId,
          status: txStatus.status,
          amount: params.amount,
        },
      };
    } catch (error) {
      console.error('Error disbursing grant on Flow:', error);
      return {
        success: false,
        message: `Failed to disburse grant on Flow: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get artist details from the Flow contract
   */
  async flowGetArtistDetails(params: { artistId: string }): Promise<ActionProviderResult> {
    try {
      console.log(`Getting details for artist ${params.artistId}`);
      
      // Cadence script for getting artist details
      const cadence = `
        import FlowArtistManager from ${this.contractAddress}
        
        pub fun main(artistId: String): {String: AnyStruct} {
          let artist = FlowArtistManager.getArtist(id: artistId)
          
          let result: {String: AnyStruct} = {}
          result["id"] = artist.id
          result["address"] = artist.address
          result["verified"] = artist.verified
          
          if artist.optimismAddress != nil {
            result["optimismAddress"] = artist.optimismAddress
          }
          
          // Get pending funds
          let pendingFunds = FlowArtistManager.getPendingFunds(artistId: artistId)
          result["pendingFunds"] = pendingFunds
          
          return result
        }
      `;
      
      // Execute script
      const result = await fcl.query({
        cadence,
        args: (arg: any, t: any) => [arg(params.artistId, t.String)],
      });
      
      return {
        success: true,
        message: `Successfully retrieved artist details for ${params.artistId} from Flow`,
        data: result,
      };
    } catch (error) {
      console.error('Error getting artist details from Flow:', error);
      return {
        success: false,
        message: `Failed to get artist details from Flow: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Register an artist with the Flow contract
   */
  async flowRegisterArtist(params: { artistId: string; address: string; optimismAddress?: string }): Promise<ActionProviderResult> {
    try {
      console.log(`Registering artist ${params.artistId} with Flow address ${params.address} and Optimism address ${params.optimismAddress}`);
      
      // Check if Flow is configured
      const user = await fcl.currentUser().snapshot();
      
      if (!user.loggedIn) {
        return {
          success: false,
          message: 'Flow wallet not authenticated',
        };
      }
      
      // Cadence script for registering an artist
      const cadence = `
        import FlowArtistManager from ${this.contractAddress}
        
        transaction(artistId: String, address: Address, optimismAddress: String?) {
          prepare(signer: AuthAccount) {
            FlowArtistManager.registerArtist(
              artistId: artistId,
              address: address,
              optimismAddress: optimismAddress
            )
          }
        }
      `;
      
      // Execute transaction
      const txId = await fcl.mutate({
        cadence,
        args: (arg: any, t: any) => [
          arg(params.artistId, t.String),
          arg(params.address, t.Address),
          arg(params.optimismAddress || null, t.Optional(t.String)),
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000,
      });
      
      // Wait for transaction to be sealed
      const txStatus = await fcl.tx(txId).onceSealed();
      
      return {
        success: true,
        message: `Successfully registered artist ${params.artistId} on Flow. Transaction ID: ${txId}`,
        data: {
          transactionId: txId,
          status: txStatus.status,
          artistId: params.artistId,
          address: params.address,
          optimismAddress: params.optimismAddress,
        },
      };
    } catch (error) {
      console.error('Error registering artist on Flow:', error);
      return {
        success: false,
        message: `Failed to register artist on Flow: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Initiate a cross-chain transaction to Optimism
   */
  async flowInitiateCrossChainTransaction(params: { 
    artistId: string; 
    amount: string; 
    targetChain: string; 
    targetAddress: string 
  }): Promise<ActionProviderResult> {
    try {
      console.log(`Initiating cross-chain transaction for artist ${params.artistId} with amount ${params.amount} FLOW to ${params.targetChain} address ${params.targetAddress}`);
      
      // Check if Flow is configured
      const user = await fcl.currentUser().snapshot();
      
      if (!user.loggedIn) {
        return {
          success: false,
          message: 'Flow wallet not authenticated',
        };
      }
      
      // Cadence script for initiating a cross-chain transaction
      const cadence = `
        import FlowArtistManager from ${this.contractAddress}
        
        transaction(artistId: String, amount: UFix64, targetChain: String, targetAddress: String) {
          prepare(signer: AuthAccount) {
            let txId = FlowArtistManager.initiateCrossChainTransaction(
              artistId: artistId,
              amount: amount,
              targetChain: targetChain,
              targetAddress: targetAddress
            )
          }
        }
      `;
      
      // Execute transaction
      const txId = await fcl.mutate({
        cadence,
        args: (arg: any, t: any) => [
          arg(params.artistId, t.String),
          arg(params.amount, t.UFix64),
          arg(params.targetChain, t.String),
          arg(params.targetAddress, t.String),
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000,
      });
      
      // Wait for transaction to be sealed
      const txStatus = await fcl.tx(txId).onceSealed();
      
      return {
        success: true,
        message: `Successfully initiated cross-chain transaction for artist ${params.artistId} on Flow. Transaction ID: ${txId}`,
        data: {
          transactionId: txId,
          status: txStatus.status,
          artistId: params.artistId,
          amount: params.amount,
          targetChain: params.targetChain,
          targetAddress: params.targetAddress,
        },
      };
    } catch (error) {
      console.error('Error initiating cross-chain transaction on Flow:', error);
      return {
        success: false,
        message: `Failed to initiate cross-chain transaction on Flow: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

// Export a factory function to create the action provider
export default function flowArtistFundActionProvider() {
  return (params: ActionProviderParams) => new FlowArtistFundActionProvider(params);
} 