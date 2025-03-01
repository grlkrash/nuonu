#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { ethers } = require('ethers');

// Optimism predeploys addresses
const L1_BLOCK_ATTRIBUTES = '0x4200000000000000000000000000000000000015';
const L1_BLOCK_NUMBER = '0x4200000000000000000000000000000000000013';
const SYSTEM_CONFIG = '0x4200000000000000000000000000000000000010';
const L2_TO_L1_MESSAGE_PASSER = '0x4200000000000000000000000000000000000016';
const SUPERCHAIN_TOKEN_BRIDGE = '0x4200000000000000000000000000000000000028';

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

// ABI for L1BlockAttributes predeploy - Updated with correct function signatures
const L1_BLOCK_ATTRIBUTES_ABI = [
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
  },
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
    "name": "batcherHash",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
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
  },
  {
    "inputs": [],
    "name": "sequenceNumber",
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

// ABI for SystemConfig predeploy - Updated with correct function signatures
const SYSTEM_CONFIG_ABI = [
  {
    "inputs": [],
    "name": "batcherHash",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "overhead",
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
    "name": "scalar",
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
    "name": "gasLimit",
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
    "name": "unsafeBlockSigner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
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

// ABI for SuperchainTokenBridge predeploy
const SUPERCHAIN_TOKEN_BRIDGE_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_destinationChainId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "_minGasLimit",
        "type": "uint32"
      },
      {
        "internalType": "bytes",
        "name": "_extraData",
        "type": "bytes"
      }
    ],
    "name": "bridgeETH",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

async function main() {
  try {
    console.log('Testing Optimism Interop with Real Predeploys');
    console.log('===========================================');

    // Check environment variables
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://sepolia.optimism.io';
    const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL;

    if (!privateKey) {
      console.error('Error: PRIVATE_KEY not found in environment variables');
      process.exit(1);
    }

    if (!rpcUrl) {
      console.error('Error: NEXT_PUBLIC_OPTIMISM_RPC_URL not found in environment variables');
      process.exit(1);
    }

    console.log(`Using Optimism RPC URL: ${rpcUrl}`);

    // Initialize provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = await wallet.getAddress();
    console.log(`Using wallet address: ${address}`);

    // Test 1: Get L1 Block Number
    console.log('\n--- Test 1: Get L1 Block Number ---');
    try {
      const l1BlockNumberContract = new ethers.Contract(
        L1_BLOCK_NUMBER,
        L1_BLOCK_NUMBER_ABI,
        provider
      );
      
      const blockNumber = await l1BlockNumberContract.getL1BlockNumber();
      console.log('L1 Block Number:', blockNumber.toString());
    } catch (error) {
      console.error('Error getting L1 Block Number:', error.message);
    }

    // Test 2: Get L1 Block Attributes
    console.log('\n--- Test 2: Get L1 Block Attributes ---');
    try {
      const l1BlockAttributesContract = new ethers.Contract(
        L1_BLOCK_ATTRIBUTES,
        L1_BLOCK_ATTRIBUTES_ABI,
        provider
      );
      
      // Try each function individually to isolate any issues
      try {
        const number = await l1BlockAttributesContract.number();
        console.log('L1 Block Number:', number.toString());
      } catch (error) {
        console.log('Could not get number:', error.message);
      }
      
      try {
        const timestamp = await l1BlockAttributesContract.timestamp();
        console.log('L1 Block Timestamp:', timestamp.toString());
      } catch (error) {
        console.log('Could not get timestamp:', error.message);
      }
      
      try {
        const baseFee = await l1BlockAttributesContract.baseFee();
        console.log('L1 Base Fee:', ethers.utils.formatUnits(baseFee, 'gwei'), 'gwei');
      } catch (error) {
        console.log('Could not get baseFee:', error.message);
      }
      
      try {
        const sequenceNumber = await l1BlockAttributesContract.sequenceNumber();
        console.log('Sequence Number:', sequenceNumber.toString());
      } catch (error) {
        console.log('Could not get sequenceNumber:', error.message);
      }
    } catch (error) {
      console.error('Error getting L1 Block Attributes:', error.message);
    }

    // Test 3: Get System Config
    console.log('\n--- Test 3: Get System Config ---');
    try {
      const systemConfigContract = new ethers.Contract(
        SYSTEM_CONFIG,
        SYSTEM_CONFIG_ABI,
        provider
      );
      
      // Try each function individually to isolate any issues
      try {
        const overhead = await systemConfigContract.overhead();
        console.log('Overhead:', overhead.toString());
      } catch (error) {
        console.log('Could not get overhead:', error.message);
      }
      
      try {
        const scalar = await systemConfigContract.scalar();
        console.log('Scalar:', scalar.toString());
      } catch (error) {
        console.log('Could not get scalar:', error.message);
      }
      
      try {
        const gasLimit = await systemConfigContract.gasLimit();
        console.log('Gas Limit:', gasLimit.toString());
      } catch (error) {
        console.log('Could not get gasLimit:', error.message);
      }
      
      try {
        const batcherHash = await systemConfigContract.batcherHash();
        console.log('Batcher Hash:', batcherHash);
      } catch (error) {
        console.log('Could not get batcherHash:', error.message);
      }
    } catch (error) {
      console.error('Error getting System Config:', error.message);
    }

    // Test 4: Get ETH Balance
    console.log('\n--- Test 4: Get ETH Balance ---');
    try {
      const balance = await provider.getBalance(address);
      console.log('ETH Balance:', ethers.utils.formatEther(balance), 'ETH');
      
      // If Base RPC URL is available, get balance on Base too
      if (baseRpcUrl) {
        try {
          const baseProvider = new ethers.providers.JsonRpcProvider(baseRpcUrl);
          const baseBalance = await baseProvider.getBalance(address);
          console.log('Base ETH Balance:', ethers.utils.formatEther(baseBalance), 'ETH');
        } catch (error) {
          console.error('Error getting Base ETH Balance:', error.message);
        }
      }
    } catch (error) {
      console.error('Error getting ETH Balance:', error.message);
    }

    // Test 5: Simulate Withdrawal (don't actually send a transaction)
    console.log('\n--- Test 5: Simulate Withdrawal ---');
    try {
      // Get the contract interface
      const l2ToL1MessagePasserContract = new ethers.Contract(
        L2_TO_L1_MESSAGE_PASSER,
        L2_TO_L1_MESSAGE_PASSER_ABI,
        wallet
      );
      
      // Prepare withdrawal parameters
      const targetAddress = address;
      const gasLimit = 100000;
      const data = '0x'; // Empty data for ETH transfer
      const withdrawAmount = ethers.utils.parseEther('0.001'); // 0.001 ETH
      
      // Estimate gas for the transaction
      try {
        const gasEstimate = await l2ToL1MessagePasserContract.estimateGas.initiateWithdrawal(
          targetAddress,
          gasLimit,
          data,
          { value: withdrawAmount }
        );
        
        console.log('Withdrawal gas estimate:', gasEstimate.toString());
        console.log('Simulation successful!');
        console.log('Would withdraw 0.001 ETH to L1');
      } catch (error) {
        console.error('Error estimating gas for withdrawal:', error.message);
      }
    } catch (error) {
      console.error('Error simulating withdrawal:', error.message);
    }

    // Test 6: Simulate Bridge ETH
    console.log('\n--- Test 6: Simulate Bridge ETH ---');
    try {
      // Get the contract interface
      const superchainTokenBridgeContract = new ethers.Contract(
        SUPERCHAIN_TOKEN_BRIDGE,
        SUPERCHAIN_TOKEN_BRIDGE_ABI,
        wallet
      );
      
      // Prepare bridge parameters
      const destinationChainId = 11155111; // Sepolia
      const toAddress = address;
      const amount = ethers.utils.parseEther('0.001'); // 0.001 ETH
      const minGasLimit = 100000;
      const extraData = '0x';
      
      // Estimate gas for the transaction
      try {
        const gasEstimate = await superchainTokenBridgeContract.estimateGas.bridgeETH(
          destinationChainId,
          toAddress,
          amount,
          minGasLimit,
          extraData,
          { value: amount }
        );
        
        console.log('Bridge ETH gas estimate:', gasEstimate.toString());
        console.log('Simulation successful!');
        console.log('Would bridge 0.001 ETH to Sepolia');
      } catch (error) {
        console.error('Error estimating gas for ETH bridge:', error.message);
      }
    } catch (error) {
      console.error('Error simulating ETH bridge:', error.message);
    }

    // Test 7: Get Aggregated Balance
    console.log('\n--- Test 7: Get Aggregated Balance ---');
    try {
      // Get balance on Optimism
      const optimismBalance = await provider.getBalance(address);
      
      // Get balance on Base (if RPC URL is available)
      let baseBalance = ethers.BigNumber.from(0);
      if (baseRpcUrl) {
        try {
          const baseProvider = new ethers.providers.JsonRpcProvider(baseRpcUrl);
          baseBalance = await baseProvider.getBalance(address);
        } catch (error) {
          console.error('Error getting Base balance:', error.message);
        }
      }
      
      // Calculate total ETH equivalent
      const totalEthEquivalent = optimismBalance.add(baseBalance);
      
      console.log('Aggregated Balance:');
      console.log('- Optimism:', ethers.utils.formatEther(optimismBalance), 'ETH');
      console.log('- Base:', ethers.utils.formatEther(baseBalance), 'ETH');
      console.log('Total ETH Equivalent:', ethers.utils.formatEther(totalEthEquivalent), 'ETH');
    } catch (error) {
      console.error('Error getting aggregated balance:', error.message);
    }

    console.log('\nAll tests completed!');
    
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 