#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { AgentKit } = require('@coinbase/agentkit');
const { ec: EC } = require('elliptic');
const { SHA3 } = require('sha3');
const fcl = require('@onflow/fcl');

// Configure FCL for testnet
fcl.config()
  .put('accessNode.api', process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
  .put('flow.network', 'testnet')
  .put('app.detail.title', 'Artist Grant AI')
  .put('app.detail.icon', 'https://placekitten.com/g/200/200');

// Flow account info
const FLOW_ACCOUNT_ADDRESS = process.env.FLOW_ACCOUNT_ADDRESS;
const FLOW_PRIVATE_KEY = process.env.FLOW_PRIVATE_KEY;
const FLOW_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS || FLOW_ACCOUNT_ADDRESS;

if (!FLOW_ACCOUNT_ADDRESS || !FLOW_PRIVATE_KEY) {
  console.error('Error: Flow account address or private key not found in environment variables');
  console.log('Please set FLOW_ACCOUNT_ADDRESS and FLOW_PRIVATE_KEY in .env.local');
  process.exit(1);
}

console.log(`Flow Contract Address: ${FLOW_CONTRACT_ADDRESS}`);

// Mock the browser environment for FCL
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  location: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000'
  }
};
global.document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: () => ({ style: {} }),
  head: { appendChild: () => {}, removeChild: () => {} },
  body: { appendChild: () => {}, removeChild: () => {} }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Set up real FCL authentication with private key
const ec = new EC('p256');
const sha = new SHA3(256);

// Helper function to sign a message with the private key
function signWithPrivateKey(message, privateKey) {
  const key = ec.keyFromPrivate(Buffer.from(privateKey.replace(/^0x/, ''), 'hex'));
  sha.reset();
  sha.update(Buffer.from(message, 'hex'));
  const digest = sha.digest();
  const sig = key.sign(digest);
  const n = 32;
  const r = sig.r.toArrayLike(Buffer, 'be', n);
  const s = sig.s.toArrayLike(Buffer, 'be', n);
  return Buffer.concat([r, s]).toString('hex');
}

// Configure FCL with real authentication
fcl.config()
  .put('fcl.accountProof.resolver', async (data) => {
    const signature = signWithPrivateKey(data.message, FLOW_PRIVATE_KEY);
    return {
      address: FLOW_ACCOUNT_ADDRESS,
      keyId: 0,
      signature: signature
    };
  });

// Set up custom authorization function
const authorization = (account = {}) => {
  // Get the current user
  const addr = FLOW_ACCOUNT_ADDRESS;
  const keyId = 0;

  return {
    ...account,
    tempId: `${addr}-${keyId}`,
    addr: addr,
    keyId: keyId,
    signingFunction: async (signable) => {
      const signature = signWithPrivateKey(signable.message, FLOW_PRIVATE_KEY);
      return {
        addr,
        keyId,
        signature
      };
    }
  };
};

// Override FCL's authorization functions
fcl.currentUser = () => {
  return {
    authorization,
    snapshot: async () => {
      return {
        addr: FLOW_ACCOUNT_ADDRESS,
        loggedIn: true,
        keyId: 0
      };
    }
  };
};

fcl.authz = authorization;

// Create a Flow wallet provider for AgentKit
class FlowWalletProvider {
  constructor() {
    this.address = FLOW_ACCOUNT_ADDRESS;
  }

  async get() {
    return {
      address: this.address,
      network: 'flow-testnet',
    };
  }

  async sign(message) {
    return signWithPrivateKey(message, FLOW_PRIVATE_KEY);
  }

  async exportWallet() {
    return {
      address: this.address,
      network: 'flow-testnet',
    };
  }
}

// Create a factory function for the Flow action provider
function createFlowActionProvider() {
  return (params) => {
    // Import the FlowArtistFundActionProvider dynamically
    const { FlowArtistFundActionProvider } = require('../src/lib/blockchain/action-providers');
    return new FlowArtistFundActionProvider(params);
  };
}

async function main() {
  try {
    console.log('Testing AgentKit integration with Flow...');
    
    // Authenticate with FCL
    console.log('\nAuthenticating with Flow...');
    await fcl.authenticate();
    const user = await fcl.currentUser().snapshot();
    console.log(`Authenticated as: ${user.addr}`);
    
    // Create a test artist ID
    const testArtistId = `artist-${Date.now()}`;
    const testOptimismAddress = `0x${FLOW_ACCOUNT_ADDRESS.substring(2)}`;
    
    // Initialize AgentKit with Flow wallet and action providers
    console.log('\nInitializing AgentKit with Flow wallet and action providers...');
    const walletProvider = new FlowWalletProvider();
    const agentKit = await AgentKit.from({
      walletProvider,
      actionProviders: [createFlowActionProvider()],
    });
    
    console.log('AgentKit initialized successfully!');
    
    // Test 1: Register an artist using AgentKit
    console.log('\n--- Test 1: Register an artist using AgentKit ---');
    console.log(`Registering artist ${testArtistId} with Flow address ${FLOW_ACCOUNT_ADDRESS} and Optimism address ${testOptimismAddress}`);
    
    try {
      const registerResult = await agentKit.execute('flowRegisterArtist', {
        artistId: testArtistId,
        address: FLOW_ACCOUNT_ADDRESS,
        optimismAddress: testOptimismAddress,
      });
      
      console.log('Register artist result:');
      console.log(JSON.stringify(registerResult, null, 2));
    } catch (error) {
      console.error('Error registering artist through AgentKit:', error);
    }
    
    // Test 2: Get artist details using AgentKit
    console.log('\n--- Test 2: Get artist details using AgentKit ---');
    console.log(`Getting details for artist ${testArtistId}`);
    
    try {
      const detailsResult = await agentKit.execute('flowGetArtistDetails', {
        artistId: testArtistId,
      });
      
      console.log('Get artist details result:');
      console.log(JSON.stringify(detailsResult, null, 2));
    } catch (error) {
      console.error('Error getting artist details through AgentKit:', error);
    }
    
    // Test 3: Disburse grant using AgentKit
    console.log('\n--- Test 3: Disburse grant using AgentKit ---');
    const grantAmount = '5.0';
    console.log(`Disbursing grant of ${grantAmount} FLOW to artist ${testArtistId}`);
    
    try {
      const disburseResult = await agentKit.execute('flowDisburseGrant', {
        artistId: testArtistId,
        amount: grantAmount,
      });
      
      console.log('Disburse grant result:');
      console.log(JSON.stringify(disburseResult, null, 2));
    } catch (error) {
      console.error('Error disbursing grant through AgentKit:', error);
    }
    
    // Test 4: Initiate cross-chain transaction using AgentKit
    console.log('\n--- Test 4: Initiate cross-chain transaction using AgentKit ---');
    const txAmount = '2.5';
    const targetChain = 'optimism';
    console.log(`Initiating cross-chain transaction for artist ${testArtistId} with amount ${txAmount} FLOW to ${targetChain} address ${testOptimismAddress}`);
    
    try {
      const crossChainResult = await agentKit.execute('flowInitiateCrossChainTransaction', {
        artistId: testArtistId,
        amount: txAmount,
        targetChain: targetChain,
        targetAddress: testOptimismAddress,
      });
      
      console.log('Initiate cross-chain transaction result:');
      console.log(JSON.stringify(crossChainResult, null, 2));
    } catch (error) {
      console.error('Error initiating cross-chain transaction through AgentKit:', error);
    }
    
    console.log('\nAll AgentKit integration tests completed!');
    console.log('\nNote: This implementation uses real FCL transactions with the Flow contract through AgentKit.');
    console.log('For production use:');
    console.log('1. Deploy the FlowArtistManager contract to Flow mainnet');
    console.log('2. Update the .env.local file with the mainnet contract address');
    console.log('3. Implement proper key management and security');
    
  } catch (error) {
    console.error('Error testing AgentKit integration with Flow:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 