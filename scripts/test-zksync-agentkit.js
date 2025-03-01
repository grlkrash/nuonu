#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { agentManager } = require('../dist/lib/blockchain/agent');

async function main() {
  try {
    console.log('Testing zkSync Integration with AgentKit');
    console.log('---------------------------------------');

    // Initialize agent
    console.log('Initializing agent...');
    const agent = await agentManager.initialize();
    console.log('Agent initialized successfully');

    // Get wallet details
    const walletDetails = await agentManager.getWalletDetails();
    console.log(`Using wallet address: ${walletDetails.address}`);
    console.log(`Network: ${walletDetails.network}`);

    // Create a test artist ID
    const testArtistId = `artist_${Date.now()}`;
    console.log(`Test artist ID: ${testArtistId}`);

    // Test 1: Get artist details (this should fail initially since the artist doesn't exist yet)
    console.log('\n--- Test 1: Get artist details (should fail initially) ---');
    try {
      const detailsResult = await agentManager.executeAction('zkSyncGetArtistDetails', {
        artistId: testArtistId,
      });
      console.log('Result:', detailsResult);
    } catch (error) {
      console.log('Expected error getting non-existent artist details:', error.message);
    }

    // Test 2: Disburse grant
    console.log('\n--- Test 2: Disburse grant with real transaction ---');
    const disburseResult = await agentManager.executeAction('zkSyncDisburseGrant', {
      artistId: testArtistId,
      amount: '0.001',
    });
    console.log('Result:', disburseResult);

    if (disburseResult.success) {
      console.log('\nTransaction successful!');
      console.log('Transaction hash:', disburseResult.data.transactionHash);
      console.log('Block number:', disburseResult.data.blockNumber);
    } else {
      console.error('Transaction failed:', disburseResult.message);
    }

    console.log('\nAll tests completed!');
    
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 