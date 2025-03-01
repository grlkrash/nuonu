#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Flow account info
const FLOW_ACCOUNT_ADDRESS = '0x4f6D0cA7E66D5e447862793F23904ba15F51f4De';

// if (!FLOW_ACCOUNT_ADDRESS) {
//   console.error('Error: Flow account address not found in environment variables');
//   console.log('Please set FLOW_ACCOUNT_ADDRESS in .env.local');
//   process.exit(1);
// }

async function main() {
  try {
    console.log('Preparing Flow Artist Manager Contract for Deployment');
    console.log('=================================================');
    
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
    
    // Create a deployment-ready version of the contract
    const deploymentPath = path.resolve(__dirname, '../FlowArtistManager.cdc');
    fs.writeFileSync(deploymentPath, contractCode);
    console.log(`Contract prepared for deployment: ${deploymentPath}`);
    
    // Update .env.local file with the Flow contract address
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
    
    console.log('\nDeployment Instructions:');
    console.log('----------------------');
    console.log('1. Visit https://port.onflow.org/');
    console.log('2. Connect your wallet');
    console.log('3. Navigate to the "Deploy Contract" section');
    console.log('4. Upload the FlowArtistManager.cdc file from the project root');
    console.log('5. Deploy the contract');
    console.log('\nAfter deployment:');
    console.log('1. Run the test script:');
    console.log('   node scripts/test-flow-artist-fund-action-provider-with-contract.js');
    console.log('2. Verify that all actions work correctly');
    
  } catch (error) {
    console.error('Error preparing contract for deployment:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 