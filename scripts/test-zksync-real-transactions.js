#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { ethers } = require('ethers');
const { Provider, Wallet } = require('zksync-web3');
const { AgentKit } = require('@coinbase/agentkit');

// Import the zkSync action provider factory
const { ZkSyncArtistFundActionProvider } = require('../dist/lib/blockchain/action-providers/ZkSyncArtistFundActionProvider');

// Simple wallet provider for testing
class TestWalletProvider {
  constructor(privateKey, rpcUrl) {
    this.privateKey = privateKey;
    this.rpcUrl = rpcUrl;
    this.provider = new Provider(rpcUrl);
    this.wallet = new Wallet(privateKey, this.provider);
  }

  async get() {
    const address = await this.wallet.getAddress();
    return {
      address,
      signer: this.wallet
    };
  }
}

async function main() {
  try {
    console.log('Testing zkSync Artist Fund Action Provider with Real Transactions');
    console.log('--------------------------------------------------------');

    // Check environment variables
    const privateKey = process.env.ZKSYNC_PRIVATE_KEY;
    const rpcUrl = process.env.NEXT_PUBLIC_ZKSYNC_RPC_URL || 'https://testnet.era.zksync.dev';
    const contractAddress = process.env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS;

    if (!privateKey) {
      console.error('Error: ZKSYNC_PRIVATE_KEY not found in environment variables');
      process.exit(1);
    }

    if (!contractAddress) {
      console.error('Error: NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS not found in environment variables');
      process.exit(1);
    }

    console.log(`Using zkSync RPC URL: ${rpcUrl}`);
    console.log(`Using contract address: ${contractAddress}`);

    // Create wallet provider
    const walletProvider = new TestWalletProvider(privateKey, rpcUrl);
    const wallet = await walletProvider.get();
    console.log(`Using wallet address: ${wallet.address}`);

    // Create zkSync action provider
    const zkSyncActionProvider = new ZkSyncArtistFundActionProvider({ walletProvider });
    
    // Get available actions
    const actions = zkSyncActionProvider.getActions();
    console.log('\nAvailable actions:');
    actions.forEach(action => {
      console.log(`- ${action.name}: ${action.description}`);
    });

    // Create a test artist ID
    const testArtistId = `artist_${Date.now()}`;
    
    // Test 1: Get artist details (this should fail initially since the artist doesn't exist yet)
    console.log('\n--- Test 1: Get artist details (should fail initially) ---');
    try {
      const detailsResult = await zkSyncActionProvider.zkSyncGetArtistDetails({
        artistId: testArtistId,
      });
      console.log('Result:', detailsResult);
    } catch (error) {
      console.log('Expected error getting non-existent artist details:', error.message);
    }

    // Test 2: Disburse grant
    console.log('\n--- Test 2: Disburse grant with real transaction ---');
    const disburseResult = await zkSyncActionProvider.zkSyncDisburseGrant({
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