const fcl = require('@onflow/fcl');

// Configure FCL for testnet
fcl.config()
  .put('accessNode.api', process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
  .put('flow.network', 'testnet')
  .put('app.detail.title', 'Artist Grant AI')
  .put('app.detail.icon', 'https://placekitten.com/g/200/200');

// Flow contract address - ensure it's properly formatted
const FLOW_CONTRACT_ADDRESS = '0x28736dfc4d9e84c6';

// Cadence scripts and transactions
const REGISTER_ARTIST_TRANSACTION = `
import FlowArtistManager from 0x${FLOW_CONTRACT_ADDRESS.replace(/^0x/, '')}

transaction(artistId: String, address: Address, optimismAddress: String) {
  prepare(signer: auth(Storage) &Account) {
    FlowArtistManager.registerArtist(
      artistId: artistId,
      address: address,
      optimismAddress: optimismAddress
    )
  }

  execute {
    log("Artist registered successfully")
  }
}
`;

const GET_ARTIST_DETAILS_SCRIPT = `
import FlowArtistManager from 0x${FLOW_CONTRACT_ADDRESS.replace(/^0x/, '')}

pub fun main(artistId: String): {String: String} {
  let artist = FlowArtistManager.getArtist(id: artistId)
  
  if artist == nil {
    return {"error": "Artist not found"}
  }
  
  let result: {String: String} = {}
  result["id"] = artist!.id
  result["address"] = artist!.address.toString()
  result["verified"] = artist!.verified ? "true" : "false"
  
  if artist!.optimismAddress != nil {
    result["optimismAddress"] = artist!.optimismAddress!
  } else {
    result["optimismAddress"] = "none"
  }
  
  return result
}
`;

const DISBURSE_FUNDS_TRANSACTION = `
import FlowArtistManager from 0x${FLOW_CONTRACT_ADDRESS.replace(/^0x/, '')}

transaction(artistId: String) {
  prepare(signer: auth(Storage) &Account) {
    // Create a grant for the artist
    let grantId = "grant-".concat(getCurrentBlock().timestamp.toString())
    
    // Create a new grant
    FlowArtistManager.createGrant(
      grantId: grantId,
      title: "AI Agent Grant",
      amount: 5.0
    )
    
    // Award the grant to the artist
    FlowArtistManager.awardGrant(
      grantId: grantId,
      artistId: artistId
    )
    
    // Distribute funds to the artist
    FlowArtistManager.distributeFunds(
      artistId: artistId
    )
  }

  execute {
    log("Funds disbursed successfully")
  }
}
`;

const CROSS_CHAIN_TRANSACTION = `
import FlowArtistManager from 0x${FLOW_CONTRACT_ADDRESS.replace(/^0x/, '')}

transaction(artistId: String, amount: UFix64, targetChain: String, targetAddress: String) {
  prepare(signer: auth(Storage) &Account) {
    // First, let's create a grant and award it to have some funds
    let grantId = "grant-cross-chain-".concat(getCurrentBlock().timestamp.toString())
    
    // Create a new grant
    FlowArtistManager.createGrant(
      grantId: grantId,
      title: "Cross-Chain Grant",
      amount: amount
    )
    
    // Award the grant to the artist
    FlowArtistManager.awardGrant(
      grantId: grantId,
      artistId: artistId
    )
    
    // Initiate the cross-chain transaction
    let txId = FlowArtistManager.initiateCrossChainTransaction(
      artistId: artistId,
      amount: amount,
      targetChain: targetChain,
      targetAddress: targetAddress
    )
    
    log("Cross-chain transaction initiated with ID: ".concat(txId))
  }

  execute {
    log("Cross-chain transaction initiated successfully")
  }
}
`;

class FlowArtistFundActionProvider {
  constructor() {
    this.contractAddress = FLOW_CONTRACT_ADDRESS;
    console.log(`Using Flow contract address: ${this.contractAddress}`);
  }

  get name() {
    return 'flowArtistFundActionProvider';
  }

  supports_network(network) {
    return network.protocol_family === 'flow';
  }

  getActions() {
    return [
      {
        name: 'flowDisburseGrant',
        description: 'Disburse funds to an artist from the Flow grant fund',
        execute: this.flowDisburseGrant.bind(this),
      },
      {
        name: 'flowGetArtistDetails',
        description: 'Get details about an artist from the Flow contract',
        execute: this.flowGetArtistDetails.bind(this),
      },
      {
        name: 'flowRegisterArtist',
        description: 'Register an artist with the Flow contract',
        execute: this.flowRegisterArtist.bind(this),
      },
      {
        name: 'flowInitiateCrossChainTransaction',
        description: 'Initiate a cross-chain transaction to Optimism',
        execute: this.flowInitiateCrossChainTransaction.bind(this),
      },
    ];
  }

  async flowDisburseGrant(params) {
    try {
      console.log(`Disbursing grant to artist ${params.artistId} with amount ${params.amount} FLOW`);
      
      // Execute the transaction using FCL
      const transactionId = await fcl.mutate({
        cadence: DISBURSE_FUNDS_TRANSACTION,
        args: (arg, t) => [
          arg(params.artistId, t.String)
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000
      });
      
      console.log(`Transaction sent with ID: ${transactionId}`);
      
      // Wait for transaction to be sealed
      const txStatus = await fcl.tx(transactionId).onceSealed();
      console.log('Transaction sealed:', txStatus);
      
      return {
        success: true,
        message: `Successfully disbursed ${params.amount} FLOW to artist ${params.artistId}`,
        data: {
          artistId: params.artistId,
          amount: params.amount,
          transactionId: transactionId,
        },
      };
    } catch (error) {
      console.error('Error disbursing grant:', error);
      return {
        success: false,
        message: `Failed to disburse grant: ${error.message || error}`,
      };
    }
  }

  async flowGetArtistDetails(params) {
    try {
      console.log(`Getting details for artist ${params.artistId}`);
      
      // Execute the script using FCL
      const result = await fcl.query({
        cadence: GET_ARTIST_DETAILS_SCRIPT,
        args: (arg, t) => [
          arg(params.artistId, t.String)
        ]
      });
      
      console.log('Artist details:', result);
      
      if (result.error) {
        return {
          success: false,
          message: `Artist not found: ${params.artistId}`,
        };
      }
      
      return {
        success: true,
        message: `Successfully retrieved details for artist ${params.artistId}`,
        data: {
          artistId: params.artistId,
          address: result.address,
          optimismAddress: result.optimismAddress !== 'none' ? result.optimismAddress : null,
          verified: result.verified === 'true',
          totalFunding: '10.0', // This would come from the contract in a real implementation
        },
      };
    } catch (error) {
      console.error('Error getting artist details:', error);
      return {
        success: false,
        message: `Failed to get artist details: ${error.message || error}`,
      };
    }
  }

  async flowRegisterArtist(params) {
    try {
      // Ensure Flow address is properly formatted with exactly 16 characters
      const formattedAddress = params.address.startsWith('0x') 
        ? params.address.length === 18 
          ? params.address 
          : `0x${params.address.replace(/^0x/, '').padStart(16, '0').slice(-16)}`
        : `0x${params.address.padStart(16, '0').slice(-16)}`;
      
      console.log(`Registering artist ${params.artistId} with Flow address ${formattedAddress} and Optimism address ${params.optimismAddress}`);
      
      // Execute the transaction using FCL
      const transactionId = await fcl.mutate({
        cadence: REGISTER_ARTIST_TRANSACTION,
        args: (arg, t) => [
          arg(params.artistId, t.String),
          arg(formattedAddress, t.Address),
          arg(params.optimismAddress || '', t.String)
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000
      });
      
      console.log(`Transaction sent with ID: ${transactionId}`);
      
      // Wait for transaction to be sealed
      const txStatus = await fcl.tx(transactionId).onceSealed();
      console.log('Transaction sealed:', txStatus);
      
      return {
        success: true,
        message: `Successfully registered artist ${params.artistId}`,
        data: {
          artistId: params.artistId,
          address: formattedAddress,
          optimismAddress: params.optimismAddress,
          transactionId: transactionId,
        },
      };
    } catch (error) {
      console.error('Error registering artist:', error);
      return {
        success: false,
        message: `Failed to register artist: ${error.message || error}`,
      };
    }
  }

  async flowInitiateCrossChainTransaction(params) {
    try {
      console.log(`Initiating cross-chain transaction for artist ${params.artistId} with amount ${params.amount} FLOW to ${params.targetChain} address ${params.targetAddress}`);
      
      // Execute the transaction using FCL
      const transactionId = await fcl.mutate({
        cadence: CROSS_CHAIN_TRANSACTION,
        args: (arg, t) => [
          arg(params.artistId, t.String),
          arg(params.amount, t.UFix64),
          arg(params.targetChain, t.String),
          arg(params.targetAddress, t.String)
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000
      });
      
      console.log(`Transaction sent with ID: ${transactionId}`);
      
      // Wait for transaction to be sealed
      const txStatus = await fcl.tx(transactionId).onceSealed();
      console.log('Transaction sealed:', txStatus);
      
      return {
        success: true,
        message: `Successfully initiated cross-chain transaction ${transactionId}`,
        data: {
          transactionId: transactionId,
          artistId: params.artistId,
          amount: params.amount,
          targetChain: params.targetChain,
          targetAddress: params.targetAddress,
          status: 'initiated',
        },
      };
    } catch (error) {
      console.error('Error initiating cross-chain transaction:', error);
      return {
        success: false,
        message: `Failed to initiate cross-chain transaction: ${error.message || error}`,
      };
    }
  }
}

// Create a factory function for the action provider
function createFlowActionProvider() {
  return {
    name: 'flowArtistFundActionProvider',
    getActions: () => {
      const provider = new FlowArtistFundActionProvider();
      return provider.getActions();
    }
  };
}

module.exports = {
  FlowArtistFundActionProvider,
  createFlowActionProvider
}; 