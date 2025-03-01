/**
 * Simple test script for Coinbase SDK
 * This script tests the basic functionality of the Coinbase SDK directly
 */

require('dotenv').config({ path: '.env.local' });
const { Coinbase, Wallet } = require('@coinbase/coinbase-sdk');

async function main() {
  try {
    console.log('Testing Coinbase SDK directly...');
    
    // Check for required environment variables
    const apiKeyName = process.env.COINBASE_API_KEY;
    const apiKeyPrivateKey = process.env.COINBASE_API_SECRET;
    const networkId = process.env.NETWORK_ID || 'base-sepolia';
    
    if (!apiKeyName || !apiKeyPrivateKey) {
      throw new Error('Missing Coinbase credentials. Please set COINBASE_API_KEY and COINBASE_API_SECRET environment variables.');
    }
    
    console.log('Environment variables validated');
    console.log(`Network ID: ${networkId}`);
    console.log(`API Key Name: ${apiKeyName}`);
    console.log(`API Key Private Key length: ${apiKeyPrivateKey.length} characters`);
    
    // Configure the Coinbase SDK
    console.log('Configuring Coinbase SDK...');
    Coinbase.configure({ 
      apiKeyName: apiKeyName, 
      privateKey: apiKeyPrivateKey.replace(/\\n/g, '\n')
    });
    
    // List wallets
    console.log('Listing wallets...');
    const wallets = await Wallet.listWallets();
    console.log(`Found ${wallets.data.length} wallets`);
    
    // Create a new wallet
    console.log('Creating a new wallet...');
    const wallet = await Wallet.create({ networkId });
    console.log(`Created wallet with ID: ${wallet.getId()}`);
    
    // Get the default address
    const address = await wallet.getDefaultAddress();
    console.log(`Default address: ${address.getId()}`);
    
    console.log('Coinbase SDK test completed successfully!');
    return {
      walletId: wallet.getId(),
      address: address.getId()
    };
  } catch (error) {
    console.error('Error testing Coinbase SDK:', error);
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