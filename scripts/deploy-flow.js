#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fcl = require('@onflow/fcl');
const fs = require('fs');
const path = require('path');

// Configure FCL
fcl.config({
  'accessNode.api': process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org',
  'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
  'app.detail.title': 'Nuonu Artist Platform',
  'app.detail.icon': 'https://nuonu.app/logo.png',
});

async function main() {
  try {
    console.log('Deploying FlowArtistManager contract to Flow testnet...');
    
    // Read the contract code
    const contractPath = path.resolve(__dirname, '../src/contracts/FlowArtistManager.cdc');
    const contractCode = fs.readFileSync(contractPath, 'utf8');
    
    console.log('Contract code loaded successfully');
    
    // Authenticate with Flow
    console.log('Authenticating with Flow...');
    const user = await fcl.authenticate();
    console.log(`Authenticated as: ${user.addr}`);
    
    // Deploy the contract
    console.log('Deploying contract...');
    const transactionId = await fcl.mutate({
      cadence: `
        transaction(contractCode: String) {
          prepare(signer: AuthAccount) {
            // Remove existing contract if it exists
            if signer.contracts.get(name: "FlowArtistManager") != nil {
              signer.contracts.remove(name: "FlowArtistManager")
            }
            
            // Add the contract
            signer.contracts.add(
              name: "FlowArtistManager",
              code: contractCode.decodeHex()
            )
            
            log("FlowArtistManager contract deployed successfully")
          }
        }
      `,
      args: (arg, t) => [arg(Buffer.from(contractCode).toString('hex'), t.String)],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 1000,
    });
    
    console.log(`Transaction submitted: ${transactionId}`);
    console.log('Waiting for transaction to be sealed...');
    
    // Wait for the transaction to be sealed
    const txResult = await fcl.tx(transactionId).onceSealed();
    console.log('Transaction sealed!');
    console.log('Transaction result:', txResult);
    
    if (txResult.status === 4) { // 4 = SEALED
      console.log('✅ FlowArtistManager contract deployed successfully!');
      console.log(`Contract address: ${user.addr}`);
      
      // Update the .env.local file with the contract address
      console.log('Updating .env.local with contract address...');
      
      // Read the current .env.local file
      const envPath = path.resolve(__dirname, '../.env.local');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update or add the contract address
      const envVar = 'NEXT_PUBLIC_ARTIST_FUND_MANAGER_FLOW';
      if (envContent.includes(`${envVar}=`)) {
        // Replace existing value
        envContent = envContent.replace(
          new RegExp(`${envVar}=.*`),
          `${envVar}=${user.addr}`
        );
      } else {
        // Add new value
        envContent += `\n${envVar}=${user.addr}`;
      }
      
      // Write the updated content back to .env.local
      fs.writeFileSync(envPath, envContent);
      
      console.log(`Updated ${envVar} in .env.local`);
      console.log('Deployment completed successfully!');
    } else {
      console.error('❌ Contract deployment failed!');
      console.error('Transaction status:', txResult.status);
      console.error('Transaction error:', txResult.errorMessage);
    }
  } catch (error) {
    console.error('Error deploying contract:', error);
    process.exit(1);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 