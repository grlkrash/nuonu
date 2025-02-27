#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fcl = require('@onflow/fcl');

// Configure FCL for testnet
fcl.config()
  .put('accessNode.api', process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
  .put('flow.network', 'testnet')
  .put('app.detail.title', 'Nuonu Artist Platform')
  .put('app.detail.icon', 'https://nuonu.app/logo.png');

// Flow account info
const FLOW_ACCOUNT_ADDRESS = process.env.FLOW_ACCOUNT_ADDRESS || process.env.NEXT_PUBLIC_ARTIST_FUND_MANAGER_FLOW;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ARTIST_FUND_MANAGER_FLOW;

if (!CONTRACT_ADDRESS) {
  console.error('Error: Flow contract address not found in environment variables');
  console.log('Please set NEXT_PUBLIC_ARTIST_FUND_MANAGER_FLOW in .env.local');
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

async function testFlowIntegration() {
  console.log('Testing Flow blockchain integration...');
  console.log('-----------------------------------------------');
  console.log(`Using contract address: ${CONTRACT_ADDRESS}`);
  
  try {
    // Test artist registration
    const artistId = `artist_${Date.now()}`;
    const artistAddress = '0x0123456789abcdef';
    
    console.log(`\nSimulating artist registration for ID: ${artistId}`);
    console.log(`Artist address: ${artistAddress}`);
    console.log('Transaction would call: registerArtist(artistId, address)');
    
    // Test checking if artist is registered
    console.log('\nChecking if artist is registered (should be false)');
    console.log('Query would call: isArtistRegistered(artistId)');
    console.log('Expected result: false');
    
    // Test receiving funds
    const opportunityId = `opportunity_${Date.now()}`;
    const amount = 100.0;
    
    console.log(`\nSimulating receiving funds for artist: ${artistId}`);
    console.log(`Opportunity ID: ${opportunityId}`);
    console.log(`Amount: ${amount} FLOW`);
    console.log('Transaction would call: receiveFunds(opportunityId, artistId, amount)');
    
    // Test getting pending funds
    console.log('\nChecking pending funds');
    console.log('Query would call: getPendingFunds(artistId)');
    console.log(`Expected result after receiving funds: ${amount} FLOW`);
    
    // Test distributing funds
    console.log(`\nSimulating fund distribution for artist: ${artistId}`);
    console.log('Transaction would call: distributeFunds(artistId)');
    
    // Test getting total funds received
    console.log('\nChecking total funds received');
    console.log('Query would call: getTotalFundsReceived(artistId)');
    console.log(`Expected result: ${amount} FLOW`);
    
    console.log('\nFlow integration testing completed (simulation mode)');
    console.log('To perform actual transactions, update the script to use real FCL authentication and transactions.');
    
  } catch (error) {
    console.error('Error in Flow integration test:', error);
  }
}

// Run the test
testFlowIntegration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 