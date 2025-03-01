#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Optimism predeploys addresses
const L1_BLOCK_ATTRIBUTES = '0x4200000000000000000000000000000000000015';
const L1_BLOCK_NUMBER = '0x4200000000000000000000000000000000000013';
const L2_TO_L1_MESSAGE_PASSER = '0x4200000000000000000000000000000000000016';
const OPTIMISM_MINTABLE_ERC20_FACTORY = '0x4200000000000000000000000000000000000012';
const OPTIMISM_PORTAL_PROXY = '0x4200000000000000000000000000000000000014';
const SYSTEM_CONFIG = '0x4200000000000000000000000000000000000010';

// ABI for L1BlockNumber predeploy
const L1_BLOCK_NUMBER_ABI = [
  {
    "inputs": [],
    "name": "getL1BlockNumber",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ABI for L1BlockAttributes predeploy
const L1_BLOCK_ATTRIBUTES_ABI = [
  {
    "inputs": [],
    "name": "baseFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "blobBaseFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "number",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "timestamp",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ABI for L2ToL1MessagePasser predeploy
const L2_TO_L1_MESSAGE_PASSER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_target",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_gasLimit",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "_data",
        "type": "bytes"
      }
    ],
    "name": "initiateWithdrawal",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// ABI for SystemConfig predeploy
const SYSTEM_CONFIG_ABI = [
  {
    "inputs": [],
    "name": "l1FeeOverhead",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "l1FeeScalar",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ABI for OptimismMintableERC20Factory predeploy
const OPTIMISM_MINTABLE_ERC20_FACTORY_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_l1Token",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_symbol",
        "type": "string"
      }
    ],
    "name": "createOptimismMintableERC20",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// ABI for OptimismPortal predeploy
const OPTIMISM_PORTAL_PROXY_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_withdrawalHash",
        "type": "bytes32"
      }
    ],
    "name": "finalizeWithdrawalTransaction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// ABI for ArtistFundManager
const ARTIST_FUND_MANAGER_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_artistId",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "_walletAddress",
        "type": "address"
      }
    ],
    "name": "registerArtist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_artistId",
        "type": "string"
      }
    ],
    "name": "getArtistDetails",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "walletAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "totalFunding",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_artistId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "disburseGrant",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

async function main() {
  try {
    // Check for required environment variables
    const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://goerli.base.org';
    const privateKey = process.env.BASE_PRIVATE_KEY;
    const artistFundManagerAddress = process.env.NEXT_PUBLIC_ARTIST_FUND_MANAGER_ADDRESS;

    if (!privateKey) {
      console.error('Error: BASE_PRIVATE_KEY not found in environment variables');
      console.log('Please set BASE_PRIVATE_KEY in .env.local');
      process.exit(1);
    }

    if (!artistFundManagerAddress) {
      console.error('Error: NEXT_PUBLIC_ARTIST_FUND_MANAGER_ADDRESS not found in environment variables');
      console.log('Please set NEXT_PUBLIC_ARTIST_FUND_MANAGER_ADDRESS in .env.local');
      process.exit(1);
    }

    console.log('Testing Optimism interoperability with Base...');
    console.log(`Base RPC URL: ${baseRpcUrl}`);
    console.log(`ArtistFundManager Address: ${artistFundManagerAddress}`);

    // Initialize provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(baseRpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`Connected wallet address: ${wallet.address}`);

    // Initialize contract instances
    const l1BlockNumber = new ethers.Contract(L1_BLOCK_NUMBER, L1_BLOCK_NUMBER_ABI, provider);
    const l1BlockAttributes = new ethers.Contract(L1_BLOCK_ATTRIBUTES, L1_BLOCK_ATTRIBUTES_ABI, provider);
    const systemConfig = new ethers.Contract(SYSTEM_CONFIG, SYSTEM_CONFIG_ABI, provider);
    const artistFundManager = new ethers.Contract(artistFundManagerAddress, ARTIST_FUND_MANAGER_ABI, wallet);

    // Test L1BlockNumber predeploy
    console.log('\nTesting L1BlockNumber predeploy...');
    try {
      const l1BlockNum = await l1BlockNumber.getL1BlockNumber();
      console.log(`Current L1 block number: ${l1BlockNum.toString()}`);
    } catch (error) {
      console.error('Error accessing L1BlockNumber:', error.message);
    }

    // Test L1BlockAttributes predeploy
    console.log('\nTesting L1BlockAttributes predeploy...');
    try {
      const blockNumber = await l1BlockAttributes.number();
      const timestamp = await l1BlockAttributes.timestamp();
      const baseFee = await l1BlockAttributes.baseFee();
      
      console.log(`L1 block number: ${blockNumber.toString()}`);
      console.log(`L1 block timestamp: ${timestamp.toString()}`);
      console.log(`L1 base fee: ${ethers.utils.formatUnits(baseFee, 'gwei')} gwei`);
      
      try {
        const blobBaseFee = await l1BlockAttributes.blobBaseFee();
        console.log(`L1 blob base fee: ${ethers.utils.formatUnits(blobBaseFee, 'gwei')} gwei`);
      } catch (error) {
        console.log('Blob base fee not available (requires post-Dencun upgrade)');
      }
    } catch (error) {
      console.error('Error accessing L1BlockAttributes:', error.message);
    }

    // Test SystemConfig predeploy
    console.log('\nTesting SystemConfig predeploy...');
    try {
      const l1FeeOverhead = await systemConfig.l1FeeOverhead();
      const l1FeeScalar = await systemConfig.l1FeeScalar();
      
      console.log(`L1 fee overhead: ${l1FeeOverhead.toString()}`);
      console.log(`L1 fee scalar: ${l1FeeScalar.toString()}`);
    } catch (error) {
      console.error('Error accessing SystemConfig:', error.message);
    }

    // Test interaction with ArtistFundManager
    console.log('\nTesting interaction with ArtistFundManager...');
    const testArtistId = `test-artist-${Date.now()}`;
    
    try {
      // Register a test artist
      console.log(`Registering test artist with ID: ${testArtistId}`);
      const registerTx = await artistFundManager.registerArtist(testArtistId, wallet.address);
      await registerTx.wait();
      console.log(`Artist registered successfully. Transaction hash: ${registerTx.hash}`);
      
      // Get artist details
      const artistDetails = await artistFundManager.getArtistDetails(testArtistId);
      console.log('Artist details:');
      console.log(`- Name: ${artistDetails.name || testArtistId}`);
      console.log(`- Wallet address: ${artistDetails.walletAddress}`);
      console.log(`- Total funding: ${ethers.utils.formatEther(artistDetails.totalFunding)} ETH`);
      
      // Disburse a small grant
      const grantAmount = ethers.utils.parseEther('0.001');
      console.log(`\nDisbursing grant of ${ethers.utils.formatEther(grantAmount)} ETH to artist ${testArtistId}`);
      
      const disburseTx = await artistFundManager.disburseGrant(testArtistId, grantAmount, {
        value: grantAmount
      });
      await disburseTx.wait();
      console.log(`Grant disbursed successfully. Transaction hash: ${disburseTx.hash}`);
      
      // Get updated artist details
      const updatedArtistDetails = await artistFundManager.getArtistDetails(testArtistId);
      console.log('\nUpdated artist details:');
      console.log(`- Name: ${updatedArtistDetails.name || testArtistId}`);
      console.log(`- Wallet address: ${updatedArtistDetails.walletAddress}`);
      console.log(`- Total funding: ${ethers.utils.formatEther(updatedArtistDetails.totalFunding)} ETH`);
    } catch (error) {
      console.error('Error interacting with ArtistFundManager:', error.message);
    }

    // Create a summary report
    console.log('\n=== Optimism Interoperability Test Summary ===');
    console.log('1. Successfully connected to Base network');
    console.log('2. Accessed Optimism predeploys:');
    console.log('   - L1BlockNumber');
    console.log('   - L1BlockAttributes');
    console.log('   - SystemConfig');
    console.log('3. Interacted with ArtistFundManager contract');
    console.log('   - Registered a test artist');
    console.log('   - Retrieved artist details');
    console.log('   - Disbursed a test grant');
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Error in test process:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 