/**
 * Test script for AgentKit integration using JSON file for authentication
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
const { Coinbase } = require('@coinbase/coinbase-sdk');
const fs = require('fs');
const path = require('path');

// Define wallet data file path
const WALLET_DATA_FILE = path.resolve(process.cwd(), 'wallet_data.json');
const API_KEY_JSON_PATH = path.resolve(process.cwd(), 'cdp_api_key.json');

async function main() {
  try {
    console.log('Testing AgentKit integration with JSON file...');
    
    // Verify the API key JSON file exists
    if (!fs.existsSync(API_KEY_JSON_PATH)) {
      throw new Error(`API key JSON file not found at ${API_KEY_JSON_PATH}`);
    }
    
    // Read the API key JSON file
    const apiKeyJson = JSON.parse(fs.readFileSync(API_KEY_JSON_PATH, 'utf8'));
    console.log(`Using API key JSON file with name: ${apiKeyJson.name}`);
    
    // Set the network ID
    const networkId = process.env.NETWORK_ID || 'base-sepolia';
    console.log(`Using network ID: ${networkId}`);
    
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
    console.log(`Initializing CDP wallet provider for network: ${networkId}`);
    
    try {
      // Configure Coinbase SDK with the JSON file
      Coinbase.configure({
        apiKeyName: apiKeyJson.name.split('/').pop(),
        privateKey: apiKeyJson.privateKey
      });
      
      // Configure the wallet provider
      const config = {
        apiKeyName: apiKeyJson.name.split('/').pop(),
        apiKeyPrivateKey: apiKeyJson.privateKey,
        cdpWalletData: walletDataStr,
        networkId,
      };
      
      const walletProvider = await CdpWalletProvider.configureWithWallet(config);
      
      // Initialize AgentKit with all required action providers
      console.log('Initializing AgentKit...');
      const agentkit = new AgentKit({
        walletProvider,
        actionProviders: [
          wethActionProvider(),
          pythActionProvider(),
          walletActionProvider(),
          erc20ActionProvider(),
          cdpApiActionProvider({
            apiKeyName: apiKeyJson.name.split('/').pop(),
            apiKeyPrivateKey: apiKeyJson.privateKey,
          }),
          cdpWalletActionProvider({
            apiKeyName: apiKeyJson.name.split('/').pop(),
            apiKeyPrivateKey: apiKeyJson.privateKey,
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
      
      // Get available actions
      console.log('Getting available actions...');
      const actions = agentkit.getActions();
      console.log(`Found ${actions.length} available actions`);
      
      // Test wallet action
      console.log('Testing wallet action...');
      const walletDetailsAction = actions.find(action => action.name === 'WalletActionProvider_get_wallet_details');
      if (walletDetailsAction) {
        const walletDetails = await walletDetailsAction.invoke({});
        console.log('Wallet details:', walletDetails);
      } else {
        console.warn('WalletActionProvider_get_wallet_details action not found');
      }
      
      // Test ERC20 action
      console.log('Testing ERC20 action...');
      const erc20BalanceAction = actions.find(action => action.name === 'ERC20ActionProvider_get_balance');
      if (erc20BalanceAction) {
        try {
          // For testing, we'll use a well-known token contract address on Base Sepolia
          // USDC on Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
          const tokenBalance = await erc20BalanceAction.invoke({ 
            contractAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' 
          });
          console.log('Token balance:', tokenBalance);
        } catch (error) {
          console.warn('ERC20ActionProvider_get_balance action failed:', error.message);
        }
      } else {
        console.warn('ERC20ActionProvider_get_balance action not found');
      }
      
      // Test CDP API action
      console.log('Testing CDP API action...');
      const addressReputationAction = actions.find(action => action.name === 'CdpApiActionProvider_address_reputation');
      if (addressReputationAction) {
        try {
          const addressReputation = await addressReputationAction.invoke({ 
            network: networkId,
            address: address
          });
          console.log('Address reputation:', addressReputation);
        } catch (error) {
          console.warn('CdpApiActionProvider_address_reputation action failed:', error.message);
        }
      } else {
        console.warn('CdpApiActionProvider_address_reputation action not found');
      }
      
      // Test faucet action
      console.log('Testing faucet action...');
      const faucetAction = actions.find(action => action.name === 'CdpApiActionProvider_request_faucet_funds');
      if (faucetAction) {
        try {
          const faucetResult = await faucetAction.invoke({ 
            assetId: 'eth'
          });
          console.log('Faucet result:', faucetResult);
        } catch (error) {
          console.warn('CdpApiActionProvider_request_faucet_funds action failed:', error.message);
        }
      } else {
        console.warn('CdpApiActionProvider_request_faucet_funds action not found');
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