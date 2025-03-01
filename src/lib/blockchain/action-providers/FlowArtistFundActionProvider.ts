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

/**
 * FlowArtistFundActionProvider - Provides actions for interacting with the Flow ArtistFundManager contract
 */
export class FlowArtistFundActionProvider implements ActionProvider {
  private walletProvider: any;

  constructor(params: ActionProviderParams) {
    this.walletProvider = params.walletProvider;
    
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
    ];
  }

  /**
   * Disburse funds to an artist on Flow
   */
  async flowDisburseGrant(params: { artistId: string; amount: string }): Promise<ActionProviderResult> {
    try {
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
        import ArtistFundManager from 0xArtistFundManager
        
        transaction(artistId: String) {
          prepare(signer: AuthAccount) {
            let fundManager = signer.borrow<&ArtistFundManager.FundManager>(from: /storage/ArtistFundManager)
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
      // Cadence script for getting artist details
      const cadence = `
        import ArtistFundManager from 0xArtistFundManager
        
        pub fun main(artistId: String): {String: AnyStruct} {
          let fundManager = getAccount(0xArtistFundManager)
            .getCapability(/public/ArtistFundManager)
            .borrow<&ArtistFundManager.FundManager{ArtistFundManager.FundManagerPublic}>()
            ?? panic("Could not borrow capability from public collection")
          
          return fundManager.getArtistDetails(artistId: artistId)
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
}

// Export a factory function to create the action provider
export default function flowArtistFundActionProvider() {
  return (params: ActionProviderParams) => new FlowArtistFundActionProvider(params);
} 