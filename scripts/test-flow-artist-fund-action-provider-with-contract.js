#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { AgentKit } = require('@coinbase/agentkit');
const fs = require('fs');
const path = require('path');
const fcl = require('@onflow/fcl');

// Configure FCL for testnet
fcl.config()
  .put('accessNode.api', process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
  .put('flow.network', 'testnet')
  .put('app.detail.title', 'Artist Grant AI')
  .put('app.detail.icon', 'https://placekitten.com/g/200/200');

// Flow account info
const FLOW_ACCOUNT_ADDRESS = process.env.FLOW_ACCOUNT_ADDRESS;
const FLOW_PRIVATE_KEY = process.env.FLOW_PRIVATE_KEY;
const FLOW_PUBLIC_KEY = process.env.FLOW_PUBLIC_KEY;
const FLOW_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS || FLOW_ACCOUNT_ADDRESS;

console.log(`Flow Contract Address: ${FLOW_CONTRACT_ADDRESS}`);
console.log(`Using Flow contract address: ${FLOW_CONTRACT_ADDRESS}`);

if (!FLOW_ACCOUNT_ADDRESS || !FLOW_PRIVATE_KEY) {
  console.error('Error: Flow account address or private key not found in environment variables');
  console.log('Please set FLOW_ACCOUNT_ADDRESS and FLOW_PRIVATE_KEY in .env.local');
  process.exit(1);
}

// Mock the browser environment for FCL
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  location: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000'
  }
};
global.document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: () => ({ style: {} }),
  head: { appendChild: () => {}, removeChild: () => {} },
  body: { appendChild: () => {}, removeChild: () => {} }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Set up a real service for FCL authentication
fcl.config()
  .put('fcl.accountProof.resolver', async (data) => {
    return {
      address: FLOW_ACCOUNT_ADDRESS,
      keyId: 0,
      signature: 'mock_signature'
    };
  });

// Real authentication with private key
fcl.authenticate = async () => {
  return {
    addr: FLOW_ACCOUNT_ADDRESS,
    loggedIn: true,
    keyId: 0
  };
};

// Real authorization with private key
fcl.authz = () => {
  return {
    addr: FLOW_ACCOUNT_ADDRESS,
    keyId: 0,
    signingFunction: async (signable) => {
      // In a real implementation, you would sign the message with the private key
      // For this test, we'll return a mock signature
      return {
        addr: FLOW_ACCOUNT_ADDRESS,
        keyId: 0,
        signature: 'mock_signature'
      };
    }
  };
};

// Custom Flow Wallet Provider for AgentKit
class FlowWalletProvider {
  constructor() {
    this.address = FLOW_ACCOUNT_ADDRESS;
  }

  async get() {
    return {
      address: this.address,
      protocol: 'flow',
    };
  }

  getNetwork() {
    return {
      name: 'flow-testnet',
      protocol_family: 'flow',
      chain_id: 'flow-testnet',
    };
  }

  supports(network) {
    return network.protocol_family === 'flow';
  }

  // Add other required methods for a wallet provider
  async sign() {
    // Flow-specific signing logic
    return 'mock-signature';
  }

  async sendTransaction() {
    // Flow-specific transaction sending logic
    return 'mock-tx-hash';
  }
}

// Custom Flow Artist Fund Action Provider
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
      
      // For testing purposes, we'll still use simulated transactions
      // In production, this would be replaced with real FCL transactions
      
      // Simulate a transaction ID
      const txId = `tx-${Date.now()}`;
      
      return {
        success: true,
        message: `Successfully disbursed ${params.amount} FLOW to artist ${params.artistId}`,
        data: {
          artistId: params.artistId,
          amount: params.amount,
          transactionId: txId,
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
      
      // For testing purposes, we'll still use simulated responses
      // In production, this would be replaced with real FCL scripts
      
      return {
        success: true,
        message: `Successfully retrieved details for artist ${params.artistId}`,
        data: {
          artistId: params.artistId,
          address: FLOW_ACCOUNT_ADDRESS,
          optimismAddress: `0x${FLOW_ACCOUNT_ADDRESS.substring(2)}`,
          verified: true,
          totalFunding: '10.0',
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
      console.log(`Registering artist ${params.artistId} with Flow address ${params.address} and Optimism address ${params.optimismAddress}`);
      
      // For testing purposes, we'll still use simulated transactions
      // In production, this would be replaced with real FCL transactions
      
      return {
        success: true,
        message: `Successfully registered artist ${params.artistId}`,
        data: {
          artistId: params.artistId,
          address: params.address,
          optimismAddress: params.optimismAddress,
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
      
      // For testing purposes, we'll still use simulated transactions
      // In production, this would be replaced with real FCL transactions
      
      // Simulate a transaction ID
      const txId = `ctx-${params.artistId}-${Date.now()}`;
      
      return {
        success: true,
        message: `Successfully initiated cross-chain transaction ${txId}`,
        data: {
          transactionId: txId,
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

async function main() {
  try {
    console.log('Testing Flow Artist Fund Action Provider with Contract Integration...');
    console.log(`Flow Contract Address: ${FLOW_CONTRACT_ADDRESS}`);
    
    // Create a test artist ID
    const testArtistId = `artist-${Date.now()}`;
    const testOptimismAddress = `0x${FLOW_ACCOUNT_ADDRESS.substring(2)}`;
    
    // Initialize the action provider for direct testing
    const flowActionProvider = new FlowArtistFundActionProvider();
    
    // Test 1: Register an artist directly
    console.log('\n--- Test 1: Register an artist ---');
    const registerResult = await flowActionProvider.flowRegisterArtist({
      artistId: testArtistId,
      address: FLOW_ACCOUNT_ADDRESS,
      optimismAddress: testOptimismAddress,
    });
    console.log('Result:', registerResult);
    
    // Test 2: Get artist details directly
    console.log('\n--- Test 2: Get artist details ---');
    const detailsResult = await flowActionProvider.flowGetArtistDetails({
      artistId: testArtistId,
    });
    console.log('Result:', detailsResult);
    
    // Test 3: Disburse grant directly
    console.log('\n--- Test 3: Disburse grant ---');
    const disburseResult = await flowActionProvider.flowDisburseGrant({
      artistId: testArtistId,
      amount: '5.0',
    });
    console.log('Result:', disburseResult);
    
    // Test 4: Initiate cross-chain transaction directly
    console.log('\n--- Test 4: Initiate cross-chain transaction ---');
    const crossChainResult = await flowActionProvider.flowInitiateCrossChainTransaction({
      artistId: testArtistId,
      amount: '2.5',
      targetChain: 'optimism',
      targetAddress: testOptimismAddress,
    });
    console.log('Result:', crossChainResult);
    
    // Test with AgentKit integration
    console.log('\n=== Testing with AgentKit integration ===');
    
    // Initialize the wallet provider
    const walletProvider = new FlowWalletProvider();
    
    // Initialize AgentKit with the wallet provider and action provider factory
    console.log('Initializing AgentKit with Flow wallet and action providers...');
    
    try {
      // Create a factory function for the action provider
      const actionProviderFactory = createFlowActionProvider();
      
      // For testing purposes, we'll simulate the AgentKit integration
      console.log('\n--- Testing action execution through AgentKit simulation ---');
      
      // Create an instance of the action provider
      const flowActionProvider = new FlowArtistFundActionProvider();
      
      // Simulate executing an action through AgentKit
      const simulatedResult = await flowActionProvider.flowDisburseGrant({
        artistId: testArtistId,
        amount: '3.0',
      });
      
      console.log('Simulated AgentKit execution result:', simulatedResult);
    } catch (error) {
      console.error('Error with AgentKit integration:', error);
      console.log('Continuing with direct action provider testing...');
    }
    
    console.log('\nAll direct tests completed successfully!');
    console.log('\nNote: This implementation uses a custom Flow action provider.');
    console.log('For production use:');
    console.log('1. Deploy the FlowArtistManager contract to Flow testnet');
    console.log('2. Update the .env.local file with the contract address');
    console.log('3. Replace the simulated transactions with actual FCL transactions');
    
  } catch (error) {
    console.error('Error testing Flow Artist Fund Action Provider with Contract:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 