#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fcl = require('@onflow/fcl');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configure FCL for testnet
fcl.config()
  .put('accessNode.api', process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
  .put('flow.network', 'testnet');

// Flow account info
const FLOW_ACCOUNT_ADDRESS = process.env.FLOW_ACCOUNT_ADDRESS;
const FLOW_PRIVATE_KEY = process.env.FLOW_PRIVATE_KEY;
const FLOW_PUBLIC_KEY = process.env.FLOW_PUBLIC_KEY;

if (!FLOW_ACCOUNT_ADDRESS || !FLOW_PRIVATE_KEY) {
  console.error('Error: Flow account address or private key not found in environment variables');
  console.log('Please set FLOW_ACCOUNT_ADDRESS and FLOW_PRIVATE_KEY in .env.local');
  process.exit(1);
}

// Check if Flow CLI is installed
function checkFlowCLI() {
  try {
    const result = execSync('flow version', { encoding: 'utf8' });
    console.log(`Flow CLI detected: ${result.trim()}`);
    return true;
  } catch (error) {
    console.log('Flow CLI not detected. You can install it with:');
    console.log('  brew install flow-cli');
    console.log('or visit https://docs.onflow.org/flow-cli/install/ for other installation options.');
    return false;
  }
}

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

// Set up a mock service for FCL authentication
fcl.config()
  .put('challenge.handshake', (data) => {
    return {
      addr: FLOW_ACCOUNT_ADDRESS,
      keyId: 0,
      signature: 'mock_signature'
    };
  })
  .put('service.OpenID.scopes', 'email')
  .put('service.OpenID.id', 'mock_service');

// Mock authentication
fcl.currentUser().subscribe(() => {});
fcl.authenticate = async () => {
  return {
    addr: FLOW_ACCOUNT_ADDRESS,
    loggedIn: true,
    keyId: 0
  };
};

// Mock authorization
fcl.authz = () => {
  return {
    addr: FLOW_ACCOUNT_ADDRESS,
    keyId: 0,
    signingFunction: async () => {
      return {
        addr: FLOW_ACCOUNT_ADDRESS,
        keyId: 0,
        signature: 'mock_signature'
      };
    }
  };
};

async function deployContract(contractCode) {
  console.log('\nDeploying contract to Flow testnet...');
  
  try {
    // Authenticate with FCL
    await fcl.authenticate();
    
    // Prepare the Cadence transaction for contract deployment
    const deployTx = `
      transaction(contractCode: String, contractName: String) {
        prepare(acct: AuthAccount) {
          acct.contracts.add(name: contractName, code: contractCode.decodeHex())
        }
      }
    `;
    
    // Execute the transaction
    const txId = await fcl.mutate({
      cadence: deployTx,
      args: (arg, t) => [
        arg(Buffer.from(contractCode).toString('hex'), t.String),
        arg('FlowArtistManager', t.String)
      ],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 9999
    });
    
    console.log(`Transaction submitted: ${txId}`);
    console.log('Waiting for transaction to be sealed...');
    
    // Wait for transaction to be sealed
    const txStatus = await fcl.tx(txId).onceSealed();
    
    if (txStatus.status === 4) {
      console.log('\n✅ Contract deployed successfully!');
      console.log(`Contract address: ${FLOW_ACCOUNT_ADDRESS}`);
      
      // Update .env.local file with the contract address
      const envPath = path.resolve(__dirname, '../.env.local');
      let envContent = '';
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      
      // Check if NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS already exists
      if (envContent.includes('NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=')) {
        // Replace the existing value
        envContent = envContent.replace(
          /NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=.*/,
          `NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=${FLOW_ACCOUNT_ADDRESS}`
        );
      } else {
        // Add the new variable
        envContent += `\nNEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=${FLOW_ACCOUNT_ADDRESS}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log(`Updated .env.local with contract address: ${FLOW_ACCOUNT_ADDRESS}`);
      
      return true;
    } else {
      console.error('❌ Contract deployment failed');
      console.error('Transaction status:', txStatus);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deploying contract:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('Flow Artist Manager Contract Deployment Tool');
    console.log('===========================================');
    
    // Check if Flow CLI is installed
    const hasFlowCLI = checkFlowCLI();
    
    // Read the contract code
    const contractPath = path.resolve(__dirname, '../src/contracts/flow/FlowArtistManager.cdc');
    
    // Check if the contract file exists
    if (!fs.existsSync(contractPath)) {
      console.error(`Contract file not found at: ${contractPath}`);
      process.exit(1);
    }
    
    const contractCode = fs.readFileSync(contractPath, 'utf8');
    console.log(`Contract file found: ${contractPath}`);
    console.log(`Contract size: ${contractCode.length} bytes`);
    
    // Check if flow.json exists
    const flowJsonPath = path.resolve(__dirname, '../flow.json');
    if (fs.existsSync(flowJsonPath)) {
      console.log(`Flow configuration found: ${flowJsonPath}`);
      
      // Update flow.json with the current account address and private key
      let flowJson = JSON.parse(fs.readFileSync(flowJsonPath, 'utf8'));
      
      if (flowJson.accounts && flowJson.accounts['testnet-account']) {
        flowJson.accounts['testnet-account'].address = FLOW_ACCOUNT_ADDRESS;
        
        if (typeof flowJson.accounts['testnet-account'].key === 'object') {
          flowJson.accounts['testnet-account'].key.privateKey = FLOW_PRIVATE_KEY;
        } else {
          flowJson.accounts['testnet-account'].key = {
            type: 'hex',
            index: 0,
            signatureAlgorithm: 'ECDSA_P256',
            hashAlgorithm: 'SHA3_256',
            privateKey: FLOW_PRIVATE_KEY
          };
        }
        
        fs.writeFileSync(flowJsonPath, JSON.stringify(flowJson, null, 2));
        console.log('Flow configuration updated with current account details');
      }
    } else {
      console.log(`Flow configuration not found: ${flowJsonPath}`);
      console.log('Please create a flow.json file for deployment');
    }
    
    // Ask user for deployment method
    console.log('\nDeployment Options:');
    console.log('------------------');
    console.log('1. Deploy using FCL (recommended)');
    
    if (hasFlowCLI) {
      console.log('2. Deploy using Flow CLI');
      console.log('   Run: flow project deploy --network=testnet');
    }
    
    console.log('3. Deploy using Flow Port');
    console.log('   1. Visit https://port.onflow.org/');
    console.log('   2. Connect your wallet');
    console.log('   3. Navigate to the "Deploy Contract" section');
    console.log('   4. Upload the FlowArtistManager.cdc file');
    console.log('   5. Deploy the contract');
    
    // Deploy using FCL
    console.log('\nProceeding with FCL deployment...');
    const deployed = await deployContract(contractCode);
    
    if (deployed) {
      // Testing instructions
      console.log('\nTesting After Deployment:');
      console.log('------------------------');
      console.log('1. Run the test script:');
      console.log('   node scripts/test-flow-artist-fund-action-provider-with-contract.js');
      console.log('2. Verify that all actions work correctly');
      
      console.log('\nOptimism Interoperability Features:');
      console.log('- Artists can register with an Optimism address');
      console.log('- The contract supports cross-chain transactions to Optimism');
      console.log('- Transaction status can be updated and tracked');
      console.log('- Artists can be looked up by their Optimism address');
    } else {
      console.log('\nAlternative Deployment Options:');
      
      if (hasFlowCLI) {
        console.log('- Try using Flow CLI: flow project deploy --network=testnet');
      }
      
      console.log('- Try using Flow Port: https://port.onflow.org/');
    }
    
    console.log('\nFor more detailed deployment instructions, see:');
    console.log('docs/FLOW-DEPLOYMENT.md and docs/FLOW-DEPLOYMENT-PLAN.md');
    
  } catch (error) {
    console.error('Error during deployment process:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 