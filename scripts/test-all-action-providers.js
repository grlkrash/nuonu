#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { ethers } = require('ethers');
const { Provider, Wallet } = require('zksync-web3');
const fcl = require('@onflow/fcl');

// Import action providers
const { ZkSyncArtistFundActionProvider } = require('../dist/lib/blockchain/action-providers/ZkSyncArtistFundActionProvider');
const { FlowArtistFundActionProvider } = require('../dist/lib/blockchain/action-providers/FlowArtistFundActionProvider');

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

// Flow wallet provider for testing
class TestFlowWalletProvider {
  constructor(privateKey, address) {
    this.privateKey = privateKey;
    this.address = address;
  }

  async get() {
          return {
      address: this.address,
      signer: {
        privateKey: this.privateKey,
        address: this.address
            }
          };
        }
      }

async function testZkSync() {
  try {
    console.log('\n=== Testing zkSync Artist Fund Action Provider ===');
    console.log('------------------------------------------------');

    // Check environment variables
    const privateKey = process.env.ZKSYNC_PRIVATE_KEY;
    const rpcUrl = process.env.NEXT_PUBLIC_ZKSYNC_RPC_URL || 'https://testnet.era.zksync.dev';
    const contractAddress = process.env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS;

    if (!privateKey) {
      console.error('Error: ZKSYNC_PRIVATE_KEY not found in environment variables');
      return false;
    }

    if (!contractAddress) {
      console.error('Error: NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS not found in environment variables');
      return false;
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

    console.log('\nzkSync tests completed!');
    return true;
    
  } catch (error) {
    console.error('Error running zkSync tests:', error);
    return false;
  }
}

async function testFlow() {
  try {
    console.log('\n=== Testing Flow Artist Fund Action Provider ===');
    console.log('--------------------------------------------');

    // Check environment variables
    const privateKey = process.env.FLOW_PRIVATE_KEY;
    const address = process.env.FLOW_ACCOUNT_ADDRESS;
    const contractAddress = process.env.NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS;

    if (!privateKey) {
      console.error('Error: FLOW_PRIVATE_KEY not found in environment variables');
      return false;
    }

    if (!address) {
      console.error('Error: FLOW_ACCOUNT_ADDRESS not found in environment variables');
      return false;
    }

    if (!contractAddress) {
      console.error('Error: NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS not found in environment variables');
      return false;
    }

    console.log(`Using Flow contract address: ${contractAddress}`);

    // Configure FCL
    fcl.config()
      .put('accessNode.api', process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
      .put('discovery.wallet', 'https://fcl-discovery.onflow.org/testnet/authn')
      .put('app.detail.title', 'Artist Grant AI')
      .put('app.detail.icon', 'https://placekitten.com/g/200/200')
      .put('flow.network', 'testnet');

    // Create wallet provider
    const walletProvider = new TestFlowWalletProvider(privateKey, address);
    const wallet = await walletProvider.get();
    console.log(`Using wallet address: ${wallet.address}`);

    // Create Flow action provider
    const flowActionProvider = new FlowArtistFundActionProvider({ walletProvider });
    
    // Get available actions
    const actions = flowActionProvider.getActions();
    console.log('\nAvailable actions:');
    actions.forEach(action => {
      console.log(`- ${action.name}: ${action.description}`);
    });

    // Create a test artist ID
    const testArtistId = `artist_${Date.now()}`;
    
    // Test 1: Get artist details (this should fail initially since the artist doesn't exist yet)
    console.log('\n--- Test 1: Get artist details (should fail initially) ---');
    try {
      const detailsResult = await flowActionProvider.flowGetArtistDetails({
        artistId: testArtistId,
      });
      console.log('Result:', detailsResult);
    } catch (error) {
      console.log('Expected error getting non-existent artist details:', error.message);
    }

    // Test 2: Register artist
    console.log('\n--- Test 2: Register artist with real transaction ---');
    const registerResult = await flowActionProvider.flowRegisterArtist({
      artistId: testArtistId,
      address: wallet.address,
    });
    console.log('Result:', registerResult);

    if (registerResult.success) {
      console.log('\nTransaction successful!');
      console.log('Transaction ID:', registerResult.data.transactionId);
    } else {
      console.error('Transaction failed:', registerResult.message);
    }

    console.log('\nFlow tests completed!');
    return true;
    
  } catch (error) {
    console.error('Error running Flow tests:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('Testing Action Providers with Real Transactions');
    console.log('===========================================');

    // Test zkSync
    const zkSyncSuccess = await testZkSync();
    
    // Test Flow
    const flowSuccess = await testFlow();
    
    console.log('\n=== Test Summary ===');
    console.log('zkSync tests:', zkSyncSuccess ? 'PASSED' : 'FAILED');
    console.log('Flow tests:', flowSuccess ? 'PASSED' : 'FAILED');
    
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