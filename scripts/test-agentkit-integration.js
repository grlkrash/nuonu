/**
 * Test script for AgentKit integration
 * This script tests the basic functionality of our AgentKit implementation
 */

const { initializeAgentKit } = require('../src/lib/services/agent-kit');
require('dotenv').config({ path: '.env.local' });

async function main() {
  try {
    console.log('Testing AgentKit integration...');
    
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
    
    // Initialize AgentKit
    console.log('Initializing AgentKit...');
    const agentKit = await initializeAgentKit();
    
    // Get wallet address
    const address = agentKit.walletProvider.getAddress();
    console.log(`Wallet address: ${address}`);
    
    // Get wallet balance
    console.log('Getting wallet balance...');
    const balance = await agentKit.walletProvider.getBalance();
    console.log(`Wallet balance: ${balance.toString()} WEI`);
    
    // Test wallet action provider
    console.log('Testing wallet action provider...');
    const walletInfo = await agentKit.executeAction('wallet', 'getWalletInfo');
    console.log('Wallet info:', walletInfo);
    
    // Test ERC20 action provider
    console.log('Testing ERC20 action provider...');
    try {
      const tokenList = await agentKit.executeAction('erc20', 'listTokens');
      console.log('Token list:', tokenList);
    } catch (error) {
      console.warn('ERC20 listTokens action failed:', error.message);
    }
    
    // Test CDP API action provider
    console.log('Testing CDP API action provider...');
    try {
      const networkInfo = await agentKit.executeAction('cdpApi', 'getNetworkInfo', { networkId: process.env.NETWORK_ID });
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
    console.error('Error testing AgentKit integration:', error);
    throw error;
  }
}

main()
  .then(result => console.log('Success!', result))
  .catch(error => console.error('Failed:', error)); 