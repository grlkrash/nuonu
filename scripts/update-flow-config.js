#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Read the flow.json file
const flowConfigPath = path.join(__dirname, '..', 'flow.json');
const flowConfig = JSON.parse(fs.readFileSync(flowConfigPath, 'utf8'));

// Get environment variables
const flowAccountAddress = process.env.FLOW_ACCOUNT_ADDRESS;
let flowPrivateKey = process.env.FLOW_PRIVATE_KEY;

if (!flowAccountAddress || !flowPrivateKey) {
  console.error('Error: FLOW_ACCOUNT_ADDRESS or FLOW_PRIVATE_KEY not found in environment variables');
  console.log('Please set these variables in your .env.local file');
  process.exit(1);
}

// Clean up the private key (remove any whitespace, newlines, or 'hex:' prefix)
flowPrivateKey = flowPrivateKey.trim().replace(/^hex:/, '').replace(/\s+/g, '');

// Update the flow.json file
flowConfig.accounts['testnet-account'].address = flowAccountAddress;
flowConfig.accounts['testnet-account'].key.privateKey = flowPrivateKey;

// Write the updated flow.json file
fs.writeFileSync(flowConfigPath, JSON.stringify(flowConfig, null, 2));

console.log('Flow configuration updated successfully with your account information');
console.log(`Account address: ${flowAccountAddress}`);
console.log('Private key: [HIDDEN]'); 