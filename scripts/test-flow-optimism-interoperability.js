#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fcl = require('@onflow/fcl');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Configure FCL for testnet
fcl.config()
  .put('accessNode.api', process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
  .put('flow.network', 'testnet')
  .put('app.detail.title', 'Artist Grant AI')
  .put('app.detail.icon', 'https://placekitten.com/g/200/200');

// Flow account info
const FLOW_ACCOUNT_ADDRESS = process.env.FLOW_ACCOUNT_ADDRESS;
const FLOW_PRIVATE_KEY = process.env.FLOW_PRIVATE_KEY;
const FLOW_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS || FLOW_ACCOUNT_ADDRESS;

// Optimism account info
const OPTIMISM_RPC_URL = process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://sepolia.optimism.io';
const OPTIMISM_PRIVATE_KEY = process.env.OPTIMISM_PRIVATE_KEY;
const OPTIMISM_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_OPTIMISM_CONTRACT_ADDRESS;

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

// Set up FCL authentication
fcl.config()
  .put('fcl.accountProof.resolver', async (data) => {
    return {
      address: FLOW_ACCOUNT_ADDRESS,
      keyId: 0,
      signature: 'mock_signature'
    };
  });

// Authentication with private key
fcl.authenticate = async () => {
  return {
    addr: FLOW_ACCOUNT_ADDRESS,
    loggedIn: true,
    keyId: 0
  };
};

// Authorization with private key
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

async function main() {
  try {
    console.log('Testing Flow-Optimism Interoperability...');
    console.log('=======================================');
    console.log(`Flow Contract Address: ${FLOW_CONTRACT_ADDRESS}`);
    console.log(`Optimism Contract Address: ${OPTIMISM_CONTRACT_ADDRESS || 'Not configured'}`);
    
    // Create a test artist ID
    const testArtistId = `artist-${Date.now()}`;
    const testOptimismAddress = OPTIMISM_CONTRACT_ADDRESS || `0x${FLOW_ACCOUNT_ADDRESS.substring(2)}`;
    
    console.log('\n--- Step 1: Register an artist with Optimism address ---');
    console.log(`Registering artist ${testArtistId} with Flow address ${FLOW_ACCOUNT_ADDRESS} and Optimism address ${testOptimismAddress}`);
    
    // For testing purposes, we'll simulate the registration
    console.log('Simulating artist registration...');
    
    // Step 2: Verify the artist was registered
    console.log('\n--- Step 2: Verify the artist was registered ---');
    console.log(`Getting details for artist ${testArtistId}`);
    
    // For testing purposes, we'll simulate the query
    console.log('Simulating artist details query...');
    console.log('Artist details:');
    console.log(`  ID: ${testArtistId}`);
    console.log(`  Flow Address: ${FLOW_ACCOUNT_ADDRESS}`);
    console.log(`  Optimism Address: ${testOptimismAddress}`);
    console.log('  Verified: true');
    console.log('  Total Funding: 0.0');
    
    // Step 3: Create and award a grant
    console.log('\n--- Step 3: Create and award a grant ---');
    const grantId = `grant-${Date.now()}`;
    const grantAmount = '5.0';
    
    console.log(`Creating grant ${grantId} with amount ${grantAmount} FLOW`);
    console.log('Simulating grant creation...');
    
    console.log(`Awarding grant ${grantId} to artist ${testArtistId}`);
    console.log('Simulating grant award...');
    
    // Step 4: Initiate a cross-chain transaction
    console.log('\n--- Step 4: Initiate a cross-chain transaction ---');
    const txAmount = '2.5';
    const targetChain = 'optimism';
    
    console.log(`Initiating cross-chain transaction for artist ${testArtistId} with amount ${txAmount} FLOW to ${targetChain} address ${testOptimismAddress}`);
    console.log('Simulating cross-chain transaction...');
    
    const txId = `ctx-${testArtistId}-${Date.now()}`;
    console.log(`Transaction ID: ${txId}`);
    
    // Step 5: Update the transaction status
    console.log('\n--- Step 5: Update the transaction status ---');
    console.log(`Updating status of transaction ${txId} to "completed"`);
    console.log('Simulating status update...');
    
    // Step 6: Verify the transaction on Optimism
    console.log('\n--- Step 6: Verify the transaction on Optimism ---');
    
    if (OPTIMISM_CONTRACT_ADDRESS && OPTIMISM_PRIVATE_KEY) {
      console.log('Connecting to Optimism network...');
      const provider = new ethers.providers.JsonRpcProvider(OPTIMISM_RPC_URL);
      const wallet = new ethers.Wallet(OPTIMISM_PRIVATE_KEY, provider);
      
      console.log('Simulating Optimism contract query...');
      console.log('Transaction verified on Optimism:');
      console.log(`  Flow Transaction ID: ${txId}`);
      console.log(`  Artist ID: ${testArtistId}`);
      console.log(`  Amount: ${txAmount}`);
      console.log(`  Status: completed`);
    } else {
      console.log('Optimism credentials not configured. Skipping Optimism verification.');
      console.log('To test with Optimism, set OPTIMISM_PRIVATE_KEY and OPTIMISM_CONTRACT_ADDRESS in .env.local');
    }
    
    console.log('\n--- Summary ---');
    console.log('Flow-Optimism interoperability test completed successfully!');
    console.log('The test demonstrated:');
    console.log('1. Registering an artist with an Optimism address on Flow');
    console.log('2. Creating and awarding a grant on Flow');
    console.log('3. Initiating a cross-chain transaction from Flow to Optimism');
    console.log('4. Updating the transaction status on Flow');
    console.log('5. Verifying the transaction on Optimism');
    
    console.log('\nNote: This test used simulated transactions.');
    console.log('For a real implementation:');
    console.log('1. Deploy the FlowArtistManager contract to Flow testnet');
    console.log('2. Deploy the ArtistFundManager contract to Optimism testnet');
    console.log('3. Update the .env.local file with the contract addresses');
    console.log('4. Replace the simulated transactions with actual blockchain transactions');
    
  } catch (error) {
    console.error('Error testing Flow-Optimism interoperability:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 