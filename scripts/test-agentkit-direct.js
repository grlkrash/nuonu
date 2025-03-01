/**
 * Direct test script for AgentKit integration
 * This script tests the basic functionality of AgentKit directly
 */

require('dotenv').config({ path: '.env.local' });
const { 
  AgentKit, 
  CdpWalletProvider,
  wethActionProvider,
  pythActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider
} = require('@coinbase/agentkit');
const fs = require('fs');
const path = require('path');

// Define wallet data file path
const WALLET_DATA_FILE = path.resolve(process.cwd(), 'wallet_data.json');

async function main() {
  try {
    console.log('Testing direct AgentKit integration...');
    
    // Map our existing environment variables to the ones expected by AgentKit
    if (process.env.COINBASE_API_KEY && !process.env.CDP_API_KEY_NAME) {
      process.env.CDP_API_KEY_NAME = process.env.COINBASE_API_KEY;
      console.log('Using COINBASE_API_KEY as CDP_API_KEY_NAME');
    }
    
    if (process.env.COINBASE_API_SECRET && !process.env.CDP_API_KEY_PRIVATE_KEY) {
      process.env.CDP_API_KEY_PRIVATE_KEY = process.env.COINBASE_API_SECRET;
      console.log('Using COINBASE_API_SECRET as CDP_API_KEY_PRIVATE_KEY');
    }
    
    if (!process.env.NETWORK_ID) {
      process.env.NETWORK_ID = 'base-sepolia';
      console.log('Using default network: base-sepolia');
    }
    
    // Check for required environment variables
    const apiKeyName = process.env.CDP_API_KEY_NAME;
    const apiKeyPrivateKey = process.env.CDP_API_KEY_PRIVATE_KEY;
    const networkId = process.env.NETWORK_ID;
    
    if (!apiKeyName || !apiKeyPrivateKey) {
      throw new Error('Missing CDP credentials. Please set CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY environment variables.');
    }
    
    console.log('Environment variables validated');
    console.log(`Network ID: ${networkId}`);
    console.log(`API Key Name: ${apiKeyName}`);
    console.log(`API Key Private Key length: ${apiKeyPrivateKey.length} characters`);
    
    // Read existing wallet data if available
    let walletDataStr;
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
      apiKeyName,
      apiKeyPrivateKey: apiKeyPrivateKey.replace(/\\n/g, '\n'),
      cdpWalletData: walletDataStr,
      networkId,
    };
    
    console.log(`Initializing CDP wallet provider for network: ${networkId}`);
    
    try {
      const walletProvider = await CdpWalletProvider.configureWithWallet(config);
      
      // Initialize AgentKit with all required action providers
      console.log('Initializing AgentKit...');
      const agentkit = await AgentKit.from({
        walletProvider,
        actionProviders: [
          wethActionProvider(),
          pythActionProvider(),
          walletActionProvider(),
          erc20ActionProvider(),
          cdpApiActionProvider({
            apiKeyName,
            apiKeyPrivateKey: apiKeyPrivateKey.replace(/\\n/g, '\n'),
          }),
          cdpWalletActionProvider({
            apiKeyName,
            apiKeyPrivateKey: apiKeyPrivateKey.replace(/\\n/g, '\n'),
          }),
        ],
      });
      
      // Save wallet data for future use
      const exportedWallet = await walletProvider.exportWallet();
      fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));
      
      // Get wallet address
      const address = walletProvider.getAddress();
      console.log(`Wallet address: ${address}`);
      
      // Get wallet balance
      console.log('Getting wallet balance...');
      const balance = await walletProvider.getBalance();
      console.log(`Wallet balance: ${balance.toString()} WEI`);
      
      // Test wallet action provider
      console.log('Testing wallet action provider...');
      const walletInfo = await agentkit.executeAction('wallet', 'getWalletInfo');
      console.log('Wallet info:', walletInfo);
      
      // Test ERC20 action provider
      console.log('Testing ERC20 action provider...');
      try {
        const tokenList = await agentkit.executeAction('erc20', 'listTokens');
        console.log('Token list:', tokenList);
      } catch (error) {
        console.warn('ERC20 listTokens action failed:', error.message);
      }
      
      // Test CDP API action provider
      console.log('Testing CDP API action provider...');
      try {
        const networkInfo = await agentkit.executeAction('cdpApi', 'getNetworkInfo', { networkId });
        console.log('Network info:', networkInfo);
      } catch (error) {
        console.warn('CDP API getNetworkInfo action failed:', error.message);
      }
      
      console.log('AgentKit integration test completed successfully!');
      return {
        address,
        balance: balance.toString()
      };
    } catch (error) {
      console.error('Error in wallet provider configuration:', error);
      if (error.cause) {
        console.error('Cause:', error.cause);
      }
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error testing AgentKit integration:', error);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
}

main()
  .then(result => console.log('Success!', result))
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  }); 