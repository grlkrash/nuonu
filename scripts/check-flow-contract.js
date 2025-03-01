#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fcl = require('@onflow/fcl');

// Configure FCL for testnet
fcl.config()
  .put('accessNode.api', process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
  .put('flow.network', 'testnet');

// Flow contract address
const FLOW_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS || '0x01cf0e2f2f715450';

console.log(`Checking if FlowArtistManager contract exists at address: ${FLOW_CONTRACT_ADDRESS}`);

async function checkContract() {
  try {
    // Simple script to check if the contract exists
    const script = `
      pub fun main(): Bool {
        let address = 0x${FLOW_CONTRACT_ADDRESS.replace(/^0x/, '')}
        let account = getAccount(address)
        let exists = account.contracts.names.contains("FlowArtistManager")
        return exists
      }
    `;

    const result = await fcl.query({
      cadence: script
    });

    if (result === true) {
      console.log(`✅ FlowArtistManager contract exists at ${FLOW_CONTRACT_ADDRESS}`);
    } else {
      console.log(`❌ FlowArtistManager contract does NOT exist at ${FLOW_CONTRACT_ADDRESS}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error checking contract:', error);
    return false;
  }
}

checkContract()
  .then(exists => {
    if (!exists) {
      console.log('\nThe contract may not be deployed yet. You need to:');
      console.log('1. Deploy the FlowArtistManager contract to Flow testnet');
      console.log('2. Update the NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS in .env.local');
    }
    process.exit(exists ? 0 : 1);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 