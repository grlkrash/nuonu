require('dotenv').config();
const { AgentKit, CdpWalletProvider } = require('@coinbase/agentkit');
const fs = require('fs');
const path = require('path');
const fcl = require('@onflow/fcl');

async function main() {
  try {
    console.log('Testing Flow Artist Fund Action Provider...');
    
    // Validate environment variables
    const requiredVars = ['CDP_API_KEY_NAME', 'CDP_API_KEY_PRIVATE_KEY', 'FLOW_ACCOUNT_ADDRESS', 'FLOW_PRIVATE_KEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Error: Required environment variables are not set');
      missingVars.forEach(varName => {
        console.error(`${varName}=your_${varName.toLowerCase()}_here`);
      });
      process.exit(1);
    }
    
    // Configure wallet data file
    const WALLET_DATA_FILE = path.join(__dirname, '../wallet_data.txt');
    let walletDataStr = null;
    
    // Read existing wallet data if available
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, 'utf8');
        console.log('Found existing wallet data');
      } catch (error) {
        console.error('Error reading wallet data:', error);
      }
    }
    
    // Configure CDP Wallet Provider
    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      cdpWalletData: walletDataStr || undefined,
      networkId: process.env.NETWORK_ID || 'flow-testnet',
    };
    
    console.log('Initializing CDP Wallet Provider...');
    const walletProvider = await CdpWalletProvider.configureWithWallet(config);
    
    // Get wallet details
    const wallet = await walletProvider.get();
    console.log('Wallet address:', wallet.address);
    
    // Save wallet data for future use
    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));
    console.log('Wallet data saved to', WALLET_DATA_FILE);
    
    // Configure FCL for Flow testnet
    fcl.config()
      .put('accessNode.api', process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
      .put('flow.network', 'testnet')
      .put('app.detail.title', 'Artist Grant AI')
      .put('app.detail.icon', 'https://placekitten.com/g/200/200');
    
    // Initialize AgentKit with our custom action providers
    console.log('Initializing AgentKit...');
    
    // Note: In production, you would import the compiled JS files
    // For this example, we'll use placeholder imports
    const flowArtistFundActionProvider = () => ({
      name: 'flowArtistFundActionProvider',
      getActions: () => [
        {
          name: 'flowDisburseGrant',
          description: 'Disburse funds to an artist from the Flow grant fund',
          execute: async (params) => {
            console.log('Executing flowDisburseGrant with params:', params);
            return {
              success: true,
              message: `Mock disbursement to artist ${params.artistId} on Flow`,
              data: {
                artistId: params.artistId,
                amount: params.amount,
                transactionId: `mock-flow-tx-${Date.now()}`
              }
            };
          },
        },
        {
          name: 'flowGetArtistDetails',
          description: 'Get details about an artist from the Flow contract',
          execute: async (params) => {
            console.log('Executing flowGetArtistDetails with params:', params);
            return {
              success: true,
              message: `Mock artist details for ${params.artistId} on Flow`,
              data: {
                artistId: params.artistId,
                name: 'Test Artist',
                flowAddress: process.env.FLOW_ACCOUNT_ADDRESS,
                optimismAddress: `0x${process.env.FLOW_ACCOUNT_ADDRESS?.substring(2)}`,
                totalFunding: '10.0'
              }
            };
          },
        }
      ],
    });
    
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        flowArtistFundActionProvider(),
      ],
    });
    
    // Test the action provider
    console.log('\n--- Testing flowDisburseGrant action ---');
    const disburseResult = await agentkit.execute('flowDisburseGrant', {
      artistId: 'test-artist-123',
      amount: '5.0',
    });
    
    console.log('Action result:', disburseResult);
    
    console.log('\n--- Testing flowGetArtistDetails action ---');
    const detailsResult = await agentkit.execute('flowGetArtistDetails', {
      artistId: 'test-artist-123',
    });
    
    console.log('Action result:', detailsResult);
    
    console.log('\nTest completed successfully!');
    console.log('\nNote: This script uses mock implementations for testing purposes.');
    console.log('To use actual Flow contract interactions:');
    console.log('1. Deploy the FlowArtistManager contract to Flow testnet');
    console.log('2. Update the .env.local file with the contract address');
    console.log('3. Modify the action provider to use actual FCL transactions and scripts');
    
  } catch (error) {
    console.error('Error testing Flow Artist Fund Action Provider:', error);
    process.exit(1);
  }
}

main(); 