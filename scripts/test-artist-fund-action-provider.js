require('dotenv').config();
const { AgentKit, CdpWalletProvider } = require('@coinbase/agentkit');
const fs = require('fs');
const path = require('path');

// Import our custom action providers
// Note: Since this is a JS file and our action providers are in TS,
// we'll need to use require with the compiled JS files in production
// For this example, we'll assume the action providers have been compiled

async function main() {
  try {
    console.log('Testing Artist Fund Action Provider...');
    
    // Validate environment variables
    const requiredVars = ['CDP_API_KEY_NAME', 'CDP_API_KEY_PRIVATE_KEY'];
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
      networkId: process.env.NETWORK_ID || 'base-sepolia',
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
    
    // Initialize AgentKit with our custom action providers
    console.log('Initializing AgentKit...');
    
    // Note: In production, you would import the compiled JS files
    // For this example, we'll use placeholder imports
    const artistFundActionProvider = () => ({
      name: 'artistFundActionProvider',
      getActions: () => [
        {
          name: 'disburseGrant',
          description: 'Disburse funds to an artist from the grant fund',
          execute: async (params) => {
            console.log('Executing disburseGrant with params:', params);
            return {
              success: true,
              message: `Mock disbursement to artist ${params.artistId}`,
            };
          },
        },
      ],
    });
    
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        artistFundActionProvider(),
      ],
    });
    
    // Test the action provider
    console.log('Testing disburseGrant action...');
    const result = await agentkit.execute('disburseGrant', {
      artistId: 'test-artist-123',
      amount: '0.01',
    });
    
    console.log('Action result:', result);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing Artist Fund Action Provider:', error);
    process.exit(1);
  }
}

main(); 