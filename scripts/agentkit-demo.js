/**
 * Comprehensive AgentKit Demo
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

// File paths
const WALLET_DATA_FILE = path.resolve(process.cwd(), 'wallet-data.json');
const API_KEY_JSON_PATH = path.resolve(process.cwd(), 'cdp_api_key.json');

// Network configuration
const NETWORK_ID = process.env.NETWORK_ID || 'base-sepolia';

async function main() {
  try {
    console.log('Starting AgentKit Demo...');
    
    // Load API key from JSON file
    const apiKeyJson = JSON.parse(fs.readFileSync(API_KEY_JSON_PATH, 'utf8'));
    console.log(`Using API key JSON file with name: ${apiKeyJson.name}`);
    console.log(`Using network ID: ${NETWORK_ID}`);
    
    // Initialize wallet provider
    let walletDataStr;
    if (fs.existsSync(WALLET_DATA_FILE)) {
      console.log('Found existing wallet data');
      walletDataStr = fs.readFileSync(WALLET_DATA_FILE, 'utf8');
    }
    
    // Configure Coinbase SDK with the JSON file
    Coinbase.configure({
      apiKeyName: apiKeyJson.name.split('/').pop(),
      privateKey: apiKeyJson.privateKey
    });
    
    console.log(`Initializing CDP wallet provider for network: ${NETWORK_ID}`);
    const config = {
      apiKeyName: apiKeyJson.name.split('/').pop(),
      apiKeyPrivateKey: apiKeyJson.privateKey,
      cdpWalletData: walletDataStr,
      networkId: NETWORK_ID,
    };
    
    const walletProvider = await CdpWalletProvider.configureWithWallet(config);
    
    // Save wallet data for future use
    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));
    
    // Initialize AgentKit
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
    
    // Get wallet information
    const walletAddress = walletProvider.getAddress();
    console.log(`Wallet address: ${walletAddress}`);
    
    // Get wallet balance
    console.log('Getting wallet balance...');
    const balance = await walletProvider.getBalance();
    console.log(`Wallet balance: ${balance.toString()} WEI`);
    
    // Get available actions
    console.log('Getting available actions...');
    const actions = agentkit.getActions();
    console.log(`Found ${actions.length} available actions`);
    
    // Display all available actions
    console.log('\nAvailable Actions:');
    actions.forEach((action, index) => {
      console.log(`${index + 1}. ${action.name}: ${action.description}`);
    });
    
    // Execute wallet details action
    console.log('\nGetting wallet details...');
    const walletAction = actions.find(a => a.name === 'WalletActionProvider_get_wallet_details');
    if (walletAction) {
      const walletDetails = await walletAction.invoke({});
      console.log('Wallet details:', walletDetails);
    } else {
      console.warn('Wallet details action not found');
    }
    
    // Get token balances
    console.log('\nGetting token balances...');
    const tokenBalanceAction = actions.find(a => a.name === 'ERC20ActionProvider_get_balance');
    if (tokenBalanceAction) {
      // Check USDC balance on Base Sepolia
      const usdcAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // USDC on Base Sepolia
      const tokenBalance = await tokenBalanceAction.invoke({
        contractAddress: usdcAddress
      });
      console.log(`USDC Balance: ${tokenBalance}`);
    } else {
      console.warn('Token balance action not found');
    }
    
    // Get address reputation
    console.log('\nGetting address reputation...');
    const reputationAction = actions.find(a => a.name === 'CdpApiActionProvider_address_reputation');
    if (reputationAction) {
      const reputation = await reputationAction.invoke({
        network: NETWORK_ID,
        address: walletAddress
      });
      console.log('Address reputation:', reputation);
    } else {
      console.warn('Address reputation action not found');
    }
    
    // Check if we need ETH from faucet
    if (balance.toString() === '0') {
      console.log('\nRequesting ETH from faucet...');
      const faucetAction = actions.find(a => a.name === 'CdpApiActionProvider_request_faucet_funds');
      if (faucetAction) {
        const faucetResult = await faucetAction.invoke({
          assetId: 'eth'
        });
        console.log('Faucet result:', faucetResult);
      } else {
        console.warn('Faucet action not found');
      }
    }
    
    // Send a small amount of ETH to another address
    console.log('\nSending a small amount of ETH...');
    const sendEthAction = actions.find(a => a.name === 'WalletActionProvider_send_eth');
    if (sendEthAction && balance.toString() !== '0') {
      // Send a very small amount to avoid depleting test funds
      const recipientAddress = '0x000000000000000000000000000000000000dEaD'; // Burn address
      const amountWei = '1000'; // Very small amount (1000 wei)
      
      try {
        const sendResult = await sendEthAction.invoke({
          to: recipientAddress,
          value: amountWei
        });
        console.log('Transaction sent:', sendResult);
      } catch (error) {
        console.error('Error sending ETH:', error.message);
      }
    } else {
      console.warn('Send ETH action not found or no balance available');
    }
    
    // Get gas price
    console.log('\nGetting gas price...');
    const gasPriceAction = actions.find(a => a.name === 'CdpApiActionProvider_gas_price');
    if (gasPriceAction) {
      const gasPrice = await gasPriceAction.invoke({
        network: NETWORK_ID
      });
      console.log('Current gas price:', gasPrice);
    } else {
      console.warn('Gas price action not found');
    }
    
    // Get transaction history
    console.log('\nGetting transaction history...');
    const txHistoryAction = actions.find(a => a.name === 'CdpApiActionProvider_get_transactions');
    if (txHistoryAction) {
      const txHistory = await txHistoryAction.invoke({
        network: NETWORK_ID,
        address: walletAddress,
        limit: 5
      });
      console.log('Recent transactions:', JSON.stringify(txHistory, null, 2));
    } else {
      console.warn('Transaction history action not found');
    }
    
    console.log('\nAgentKit demo completed successfully!');
    return {
      address: walletAddress,
      balance: balance.toString()
    };
  } catch (error) {
    console.error('Error in AgentKit demo:', error);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
}

// Run the main function
main()
  .then(result => {
    console.log('Success!', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  }); 