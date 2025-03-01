/**
 * Test script using the JSON file directly for authentication
 */

require('dotenv').config({ path: '.env.local' });
const { Coinbase, Wallet } = require('@coinbase/coinbase-sdk');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    console.log('Testing Coinbase SDK with JSON file...');
    
    // Read the API key JSON file
    const apiKeyJsonPath = path.resolve(process.cwd(), 'cdp_api_key.json');
    
    if (!fs.existsSync(apiKeyJsonPath)) {
      // Create the JSON file from the downloaded one
      const downloadedJsonPath = path.resolve(process.cwd(), 'cdp_api_key (2).json');
      if (fs.existsSync(downloadedJsonPath)) {
        fs.copyFileSync(downloadedJsonPath, apiKeyJsonPath);
        console.log(`Copied API key JSON file from ${downloadedJsonPath} to ${apiKeyJsonPath}`);
      } else {
        throw new Error(`API key JSON file not found at ${downloadedJsonPath}`);
      }
    }
    
    console.log(`Using API key JSON file at: ${apiKeyJsonPath}`);
    
    // Configure the Coinbase SDK with the JSON file
    console.log('Configuring Coinbase SDK from JSON file...');
    Coinbase.configureFromJson({ filePath: apiKeyJsonPath });
    
    // Set the network ID
    const networkId = process.env.NETWORK_ID || 'base-sepolia';
    console.log(`Using network ID: ${networkId}`);
    
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