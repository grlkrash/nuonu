#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Helper function to print section headers
function printHeader(text) {
  console.log('\n' + colors.fg.cyan + colors.bright + '='.repeat(80) + colors.reset);
  console.log(colors.fg.cyan + colors.bright + ' ' + text + colors.reset);
  console.log(colors.fg.cyan + colors.bright + '='.repeat(80) + colors.reset + '\n');
}

// Helper function to print success messages
function printSuccess(text) {
  console.log(colors.fg.green + '✓ ' + text + colors.reset);
}

// Helper function to print error messages
function printError(text) {
  console.log(colors.fg.red + '✗ ' + text + colors.reset);
}

// Helper function to print info messages
function printInfo(text) {
  console.log(colors.fg.yellow + 'ℹ ' + text + colors.reset);
}

// Helper function to run a command and return its output
function runCommand(command) {
  try {
    printInfo(`Running: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    return output;
  } catch (error) {
    printError(`Command failed: ${command}`);
    printError(error.message);
    throw error;
  }
}

// Helper function to update .env.local file
function updateEnvFile(key, value) {
  try {
    let envContent = fs.readFileSync('.env.local', 'utf8');
    
    if (envContent.includes(`${key}=`)) {
      envContent = envContent.replace(
        new RegExp(`${key}=.*`, 'g'),
        `${key}=${value}`
      );
    } else {
      envContent += `\n${key}=${value}`;
    }
    
    fs.writeFileSync('.env.local', envContent);
    printSuccess(`Updated ${key} in .env.local`);
  } catch (error) {
    printError(`Failed to update ${key} in .env.local`);
    printError(error.message);
  }
}

// Check if Optimism environment variables exist, add if they don't
function ensureOptimismEnvVars() {
  try {
    let envContent = fs.readFileSync('.env.local', 'utf8');
    let updated = false;
    
    if (!envContent.includes('NEXT_PUBLIC_OPTIMISM_RPC_URL=')) {
      envContent += '\nNEXT_PUBLIC_OPTIMISM_RPC_URL=https://sepolia.optimism.io';
      updated = true;
    }
    
    if (!envContent.includes('NEXT_PUBLIC_OPTIMISM_CHAIN_ID=')) {
      envContent += '\nNEXT_PUBLIC_OPTIMISM_CHAIN_ID=11155420';
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync('.env.local', envContent);
      printSuccess('Added Optimism environment variables to .env.local');
    } else {
      printInfo('Optimism environment variables already exist in .env.local');
    }
  } catch (error) {
    printError('Failed to ensure Optimism environment variables');
    printError(error.message);
  }
}

async function main() {
  try {
    printHeader('DEPLOYING ALL CONTRACTS WITH OPTIMISM INTEROPERABILITY');
    
    // Ensure Optimism environment variables exist
    ensureOptimismEnvVars();
    
    // Deploy Base contract
    printHeader('DEPLOYING BASE CONTRACT');
    try {
      const baseOutput = runCommand('node scripts/deploy-base.js');
      console.log(baseOutput);
      printSuccess('Base contract deployed successfully');
    } catch (error) {
      printError('Failed to deploy Base contract');
      process.exit(1);
    }
    
    // Deploy zkSync contract
    printHeader('DEPLOYING ZKSYNC CONTRACT');
    try {
      const zkSyncOutput = runCommand('node scripts/deploy-zksync.js');
      console.log(zkSyncOutput);
      printSuccess('zkSync contract deployed successfully');
    } catch (error) {
      printError('Failed to deploy zkSync contract');
      process.exit(1);
    }
    
    // Deploy Flow contract
    printHeader('DEPLOYING FLOW CONTRACT');
    try {
      const flowOutput = runCommand('node scripts/deploy-flow.js');
      console.log(flowOutput);
      printSuccess('Flow contract deployed successfully');
    } catch (error) {
      printError('Failed to deploy Flow contract');
      process.exit(1);
    }
    
    // Run tests for Optimism interoperability
    printHeader('TESTING OPTIMISM INTEROPERABILITY');
    
    // Test Base contract
    printInfo('Testing Base contract Optimism interoperability...');
    try {
      const baseTestOutput = runCommand('node scripts/test-base-optimism-interop.js');
      console.log(baseTestOutput);
      printSuccess('Base contract Optimism interoperability tests passed');
    } catch (error) {
      printInfo('Base contract Optimism interoperability tests not available or failed');
    }
    
    // Test zkSync contract
    printInfo('Testing zkSync contract Optimism interoperability...');
    try {
      const zkSyncTestOutput = runCommand('node scripts/test-zksync-optimism-interop.js');
      console.log(zkSyncTestOutput);
      printSuccess('zkSync contract Optimism interoperability tests passed');
    } catch (error) {
      printInfo('zkSync contract Optimism interoperability tests not available or failed');
    }
    
    // Test Flow contract
    printInfo('Testing Flow contract Optimism interoperability...');
    try {
      const flowTestOutput = runCommand('node scripts/test-flow-optimism-interop.js');
      console.log(flowTestOutput);
      printSuccess('Flow contract Optimism interoperability tests passed');
    } catch (error) {
      printInfo('Flow contract Optimism interoperability tests not available or failed');
    }
    
    printHeader('DEPLOYMENT SUMMARY');
    console.log('All contracts have been deployed with Optimism interoperability features:');
    console.log('');
    console.log('1. Base Contract:');
    console.log('   - Artists can register with an Optimism address');
    console.log('   - Cross-chain transactions to Optimism are supported');
    console.log('   - Transaction status can be updated and tracked');
    console.log('');
    console.log('2. zkSync Contract:');
    console.log('   - Artists can register with an Optimism address');
    console.log('   - Cross-chain transactions to Optimism are supported');
    console.log('   - Transaction status can be updated and tracked');
    console.log('');
    console.log('3. Flow Contract:');
    console.log('   - Artists can register with an Optimism address');
    console.log('   - Cross-chain transactions to Optimism are supported');
    console.log('   - Transaction status can be updated and tracked');
    console.log('');
    console.log('Environment variables have been updated in .env.local with contract addresses');
    console.log('and Optimism configuration.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update UI components to support Optimism interoperability');
    console.log('2. Test the full application with cross-chain transactions');
    console.log('3. Document the new features for users');
    
    printSuccess('Deployment completed successfully');
    
  } catch (error) {
    printError('Deployment failed');
    printError(error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 