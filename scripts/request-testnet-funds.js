const { Coinbase, ExternalAddress } = require('@coinbase/coinbase-sdk');
require('dotenv').config({ path: '.env.local' });

async function main() {
  try {
    console.log('Initializing Coinbase SDK...');
    
    // Configure the Coinbase SDK with your API key
    Coinbase.configure({
      apiKeyName: process.env.COINBASE_API_KEY,
      privateKey: process.env.COINBASE_API_KEY_PRIVATE,
      source: 'artist-grant-ai-agent',
    });
    
    // Create a new wallet or use an existing one
    console.log('Creating wallet...');
    const wallet = await Coinbase.createWallet({
      network: 'base-sepolia',
    });
    
    console.log(`Wallet created with address: ${wallet.getAddress()}`);
    
    // Get the wallet balance
    const balance = await wallet.getBalance();
    console.log(`Initial wallet balance: ${balance} ETH`);
    
    // Request funds from the faucet
    console.log('Requesting funds from the Base Sepolia faucet...');
    const address = new ExternalAddress('base-sepolia', wallet.getAddress());
    const faucetTx = await address.faucet();
    
    console.log(`Faucet request submitted. Transaction hash: ${faucetTx.hash}`);
    console.log('Waiting for transaction to be confirmed...');
    
    const result = await faucetTx.wait({ timeoutSeconds: 60 });
    console.log(`Transaction confirmed: ${result.getTransactionLink()}`);
    
    // Get the updated wallet balance
    const updatedBalance = await wallet.getBalance();
    console.log(`Updated wallet balance: ${updatedBalance} ETH`);
    
    // Export the wallet data for future use
    const walletData = wallet.export();
    console.log('\nWallet data for future use:');
    console.log(JSON.stringify(walletData, null, 2));
    
    console.log('\nUpdate your .env.local file with:');
    console.log(`WALLET_ADDRESS=${wallet.getAddress()}`);
    
    return wallet.getAddress();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Execute the script
main()
  .then((address) => {
    console.log(`\nSuccessfully created wallet and requested funds for address: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 