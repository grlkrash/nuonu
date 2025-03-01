#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fcl = require('@onflow/fcl');
const fs = require('fs');
const path = require('path');

// Configure FCL for testnet
fcl.config()
  .put('accessNode.api', process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
  .put('flow.network', 'testnet');

// Flow account info
const FLOW_ACCOUNT_ADDRESS = process.env.FLOW_ACCOUNT_ADDRESS;
const FLOW_PRIVATE_KEY = process.env.FLOW_PRIVATE_KEY;
const FLOW_PUBLIC_KEY = process.env.FLOW_PUBLIC_KEY;

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
    console.log('Deploying FlowArtistManager contract to Flow testnet with Optimism interoperability...');
    
    // Read the contract code
    const contractPath = path.resolve(__dirname, '../src/contracts/flow/FlowArtistManager.cdc');
    
    // Check if the contract file exists
    if (!fs.existsSync(contractPath)) {
      console.error(`Contract file not found at: ${contractPath}`);
      process.exit(1);
    }
    
    const contractCode = fs.readFileSync(contractPath, 'utf8');
    
    // Simulate deployment (actual deployment requires a browser environment)
    console.log('Simulating contract deployment...');
    console.log(`Contract would be deployed to account: ${FLOW_ACCOUNT_ADDRESS}`);
    
    // Update .env.local file with the Flow contract address
    console.log('Updating .env.local file with contract address...');
    
    let envContent;
    try {
      envContent = fs.readFileSync('.env.local', 'utf8');
    } catch (error) {
      envContent = '';
    }
    
    // Update or add the contract address
    if (envContent.includes('NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=.*/g,
        `NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=${FLOW_ACCOUNT_ADDRESS}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=${FLOW_ACCOUNT_ADDRESS}`;
    }
    
    // Add Optimism environment variables if they don't exist
    if (!envContent.includes('NEXT_PUBLIC_OPTIMISM_RPC_URL=')) {
      envContent += `\nNEXT_PUBLIC_OPTIMISM_RPC_URL=https://sepolia.optimism.io`;
    }
    
    if (!envContent.includes('NEXT_PUBLIC_OPTIMISM_CHAIN_ID=')) {
      envContent += `\nNEXT_PUBLIC_OPTIMISM_CHAIN_ID=11155420`;
    }
    
    fs.writeFileSync('.env.local', envContent);
    
    console.log('Environment variables updated successfully');
    
    // Test the contract functionality
    console.log('\nTesting contract functionality...');
    
    // Register an artist with Optimism address
    console.log('Simulating: Register an artist with Optimism address...');
    const artistId = 'artist1';
    const artistAddress = FLOW_ACCOUNT_ADDRESS;
    const optimismAddress = '0x' + FLOW_ACCOUNT_ADDRESS.substring(2); // Using a derived address for demo
    
    console.log(`Artist would be registered with ID: ${artistId}, Flow address: ${artistAddress}, Optimism address: ${optimismAddress}`);
    
    // Create a test grant
    console.log('\nSimulating: Create a test grant...');
    const grantId = 'grant1';
    const grantTitle = 'Test Grant';
    const grantAmount = '0.01';
    
    console.log(`Grant would be created with ID: ${grantId}, title: ${grantTitle}, amount: ${grantAmount} FLOW`);
    
    // Award grant to artist
    console.log('\nSimulating: Award grant to artist...');
    console.log(`Grant ${grantId} would be awarded to artist ${artistId}`);
    
    // Initiate cross-chain transaction
    console.log('\nSimulating: Initiate cross-chain transaction to Optimism...');
    const txAmount = '0.005';
    const targetChain = 'optimism';
    const txId = `ctx-${artistId}-${FLOW_ACCOUNT_ADDRESS}-${Date.now()}`;
    
    console.log(`Cross-chain transaction would be initiated with ID: ${txId}, amount: ${txAmount} FLOW, target chain: ${targetChain}, target address: ${optimismAddress}`);
    
    // Update transaction status
    console.log('\nSimulating: Update transaction status to "completed"...');
    console.log(`Transaction ${txId} status would be updated to "completed"`);
    
    // Get artist details
    console.log('\nSimulating: Get artist details...');
    console.log(`Artist ID: ${artistId}`);
    console.log(`Flow Address: ${artistAddress}`);
    console.log(`Optimism Address: ${optimismAddress}`);
    console.log(`Verified: true`);
    
    // Get artist by Optimism address
    console.log('\nSimulating: Get artist by Optimism address...');
    console.log(`Artist ID: ${artistId}`);
    console.log(`Flow Address: ${artistAddress}`);
    console.log(`Optimism Address: ${optimismAddress}`);
    console.log(`Verified: true`);
    
    // Get cross-chain transaction details
    console.log('\nSimulating: Get cross-chain transaction details...');
    console.log(`Transaction ID: ${txId}`);
    console.log(`Artist ID: ${artistId}`);
    console.log(`Amount: ${txAmount} FLOW`);
    console.log(`Target Chain: ${targetChain}`);
    console.log(`Target Address: ${optimismAddress}`);
    console.log(`Status: completed`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    console.log('\nDeployment and testing simulation completed successfully');
    console.log('\nImportant: This script simulates deployment for testing purposes.');
    console.log('To actually deploy the contract, you need to:');
    console.log('1. Use the Flow CLI or Flow web interface to deploy the contract');
    console.log('2. Update the .env.local file with the actual contract address');
    console.log('3. Run the tests to verify the contract functionality');
    
    console.log('\nOptimism Interoperability Features:');
    console.log('- Artists can now register with an Optimism address');
    console.log('- The contract supports cross-chain transactions to Optimism');
    console.log('- Transaction status can be updated and tracked');
    console.log('- Artists can be looked up by their Optimism address');
    
  } catch (error) {
    console.error('Error during deployment:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 