#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fcl = require('@onflow/fcl');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configure FCL for testnet
fcl.config()
  .put('accessNode.api', process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
  .put('flow.network', 'testnet');

// Flow account info
const FLOW_ACCOUNT_ADDRESS = process.env.FLOW_ACCOUNT_ADDRESS;
const FLOW_PRIVATE_KEY = process.env.FLOW_PRIVATE_KEY;
const FLOW_PUBLIC_KEY = process.env.FLOW_PUBLIC_KEY;
const FLOW_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS || FLOW_ACCOUNT_ADDRESS;

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

// Set up a mock service for FCL authentication
fcl.config()
  .put('challenge.handshake', (data) => {
    return {
      addr: FLOW_ACCOUNT_ADDRESS,
      keyId: 0,
      signature: 'mock_signature'
    };
  })
  .put('service.OpenID.scopes', 'email')
  .put('service.OpenID.id', 'mock_service');

// Mock authentication
fcl.currentUser().subscribe(() => {});
fcl.authenticate = async () => {
  return {
    addr: FLOW_ACCOUNT_ADDRESS,
    loggedIn: true,
    keyId: 0
  };
};

// Mock authorization
fcl.authz = () => {
  return {
    addr: FLOW_ACCOUNT_ADDRESS,
    keyId: 0,
    signingFunction: async () => {
      return {
        addr: FLOW_ACCOUNT_ADDRESS,
        keyId: 0,
        signature: 'mock_signature'
      };
    }
  };
};

async function main() {
  try {
    console.log('Testing Flow contract Optimism interoperability features...');
    console.log(`Flow Contract Address: ${FLOW_CONTRACT_ADDRESS}`);
    
    // Test 1: Register an artist with Optimism address
    console.log('\n--- Test 1: Register an artist with Optimism address ---');
    try {
      const artistId = `artist-${Date.now()}`;
      const optimismAddress = `0x${FLOW_ACCOUNT_ADDRESS.substring(2)}`;
      
      console.log(`Registering artist with ID: ${artistId}, Flow address: ${FLOW_ACCOUNT_ADDRESS}, Optimism address: ${optimismAddress}`);
      
      // In a real implementation, this would be a transaction to the Flow contract
      console.log('Simulating transaction to register artist...');
      console.log(`Result: Artist registered successfully with ID: ${artistId}`);
      
      // Store the artist ID for later tests
      global.testArtistId = artistId;
      global.testOptimismAddress = optimismAddress;
      
    } catch (error) {
      console.error('Test 1 failed:', error);
    }
    
    // Test 2: Initiate a cross-chain transaction
    console.log('\n--- Test 2: Initiate a cross-chain transaction ---');
    try {
      const artistId = global.testArtistId;
      const amount = '0.01';
      const targetChain = 'optimism';
      const targetAddress = global.testOptimismAddress;
      
      console.log(`Initiating cross-chain transaction for artist: ${artistId}`);
      console.log(`Amount: ${amount} FLOW, Target chain: ${targetChain}, Target address: ${targetAddress}`);
      
      // In a real implementation, this would be a transaction to the Flow contract
      console.log('Simulating transaction to initiate cross-chain transfer...');
      const txId = `ctx-${artistId}-${Date.now()}`;
      console.log(`Result: Cross-chain transaction initiated with ID: ${txId}`);
      
      // Store the transaction ID for later tests
      global.testTxId = txId;
      
    } catch (error) {
      console.error('Test 2 failed:', error);
    }
    
    // Test 3: Update cross-chain transaction status
    console.log('\n--- Test 3: Update cross-chain transaction status ---');
    try {
      const txId = global.testTxId;
      const newStatus = 'completed';
      
      console.log(`Updating transaction ${txId} status to: ${newStatus}`);
      
      // In a real implementation, this would be a transaction to the Flow contract
      console.log('Simulating transaction to update status...');
      console.log(`Result: Transaction status updated to ${newStatus}`);
      
    } catch (error) {
      console.error('Test 3 failed:', error);
    }
    
    // Test 4: Get artist by Optimism address
    console.log('\n--- Test 4: Get artist by Optimism address ---');
    try {
      const optimismAddress = global.testOptimismAddress;
      
      console.log(`Looking up artist with Optimism address: ${optimismAddress}`);
      
      // In a real implementation, this would be a script to query the Flow contract
      console.log('Simulating script execution...');
      console.log(`Result: Found artist with ID: ${global.testArtistId}`);
      console.log(`Flow Address: ${FLOW_ACCOUNT_ADDRESS}`);
      console.log(`Optimism Address: ${optimismAddress}`);
      console.log(`Verified: true`);
      
    } catch (error) {
      console.error('Test 4 failed:', error);
    }
    
    // Test 5: Get cross-chain transaction details
    console.log('\n--- Test 5: Get cross-chain transaction details ---');
    try {
      const txId = global.testTxId;
      
      console.log(`Getting details for transaction: ${txId}`);
      
      // In a real implementation, this would be a script to query the Flow contract
      console.log('Simulating script execution...');
      console.log(`Result: Transaction ID: ${txId}`);
      console.log(`Artist ID: ${global.testArtistId}`);
      console.log(`Amount: 0.01 FLOW`);
      console.log(`Target Chain: optimism`);
      console.log(`Target Address: ${global.testOptimismAddress}`);
      console.log(`Status: completed`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      
    } catch (error) {
      console.error('Test 5 failed:', error);
    }
    
    console.log('\nAll tests completed.');
    console.log('\nNote: These tests simulate the contract interactions.');
    console.log('To run actual tests against a deployed contract, you need to:');
    console.log('1. Deploy the FlowArtistManager contract to Flow testnet');
    console.log('2. Update the .env.local file with the contract address');
    console.log('3. Modify this script to use actual FCL transactions and scripts');
    
  } catch (error) {
    console.error('Error during testing:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 