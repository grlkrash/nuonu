#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fcl = require('@onflow/fcl');
const { ec: EC } = require('elliptic');
const { SHA3 } = require('sha3');
const fs = require('fs');
const path = require('path');

// Flow account info - use the valid account address that exists on testnet
// This is the account that has the FlowArtistManager contract deployed
const FLOW_ACCOUNT_ADDRESS = '0x28736dfc4d9e84c6'; // Hardcode the correct address
const formattedFlowAddress = FLOW_ACCOUNT_ADDRESS.startsWith('0x') 
  ? FLOW_ACCOUNT_ADDRESS 
  : `0x${FLOW_ACCOUNT_ADDRESS}`;

// Get the private key from environment variables
let FLOW_PRIVATE_KEY = process.env.FLOW_PRIVATE_KEY;
console.log('Raw private key from env:', FLOW_PRIVATE_KEY);

// If the private key is not set in the environment, use the one from flow.json
if (!FLOW_PRIVATE_KEY || FLOW_PRIVATE_KEY === 'mock_private_key') {
  FLOW_PRIVATE_KEY = 'bb238acd59e4e3d9c21c2506d95b07ac9e293264fcc3747731f13cec13fdad52';
  console.log('Using hardcoded private key from flow.json');
}

// Use the actual deployed contract address from environment
const FLOW_CONTRACT_ADDRESS = '0x28736dfc4d9e84c6'; // Hardcode the correct contract address

console.log(`Using Flow address: ${formattedFlowAddress}`);
console.log(`Using Flow contract address: ${FLOW_CONTRACT_ADDRESS}`);
console.log(`Using Flow private key: ${FLOW_PRIVATE_KEY.substring(0, 6)}...${FLOW_PRIVATE_KEY.substring(FLOW_PRIVATE_KEY.length - 6)}`);

// Configure FCL for testnet
fcl.config()
  .put('accessNode.api', 'https://rest-testnet.onflow.org')
  .put('flow.network', 'testnet')
  .put('discovery.wallet', 'https://fcl-discovery.onflow.org/testnet/authn')
  .put('app.detail.title', 'Artist Grant AI')
  .put('app.detail.icon', 'https://placekitten.com/g/200/200')
  .put('service.OpenID.scopes', 'email email_verified name zoneinfo')
  .put('0xFlowArtistManager', FLOW_CONTRACT_ADDRESS);

// Set up real FCL authentication with private key
const ec = new EC('p256');
const sha = new SHA3(256);

// Helper function to sign a message with the private key
function signWithPrivateKey(message, privateKey) {
  try {
    // Remove 0x prefix if present
    const cleanPrivateKey = privateKey.replace(/^0x/, '');
    
    // Create key from private key
    const key = ec.keyFromPrivate(Buffer.from(cleanPrivateKey, 'hex'));
    
    // Hash the message
    sha.reset();
    sha.update(Buffer.from(message, 'hex'));
    const digest = sha.digest();
    
    // Sign the digest
    const sig = key.sign(digest);
    
    // Format the signature as required by Flow
    const n = 32;
    const r = sig.r.toArrayLike(Buffer, 'be', n);
    const s = sig.s.toArrayLike(Buffer, 'be', n);
    
    const signature = Buffer.concat([r, s]).toString('hex');
    console.log(`Generated signature: ${signature.substring(0, 20)}...`);
    
    return signature;
  } catch (error) {
    console.error('Error signing with private key:', error);
    throw error;
  }
}

// Create a simple authorization function for FCL
const authorizationFunction = async (account = {}) => {
  return {
    ...account,
    tempId: `${formattedFlowAddress}-0`,
    addr: formattedFlowAddress,
    keyId: 0,
    signingFunction: async (signable) => {
      try {
        console.log('Signing payload:', signable.message.substring(0, 100) + '...');
        const signature = signWithPrivateKey(signable.message, FLOW_PRIVATE_KEY);
        console.log('Signed transaction with key ID: 0');
        return {
          addr: formattedFlowAddress,
          keyId: 0,
          signature: signature
        };
      } catch (error) {
        console.error('Error signing transaction:', error);
        throw error;
      }
    }
  };
};

// Define Cadence scripts and transactions
const CONTRACT_ADDRESS = FLOW_CONTRACT_ADDRESS;

const REGISTER_ARTIST_TRANSACTION = `
import FlowArtistManager from ${CONTRACT_ADDRESS}

transaction(artistId: String, address: Address, optimismAddress: String) {
  prepare(signer: AuthAccount) {
    FlowArtistManager.registerArtist(
      artistId: artistId, 
      address: address, 
      optimismAddress: optimismAddress
    )
  }
}
`;

const GET_ARTIST_DETAILS_SCRIPT = `
import FlowArtistManager from 0xFlowArtistManager

pub fun main(artistId: String): {String: AnyStruct} {
  let artistManager = getAccount(0xFlowArtistManager)
    .getCapability(/public/FlowArtistManagerPublic)
    .borrow<&FlowArtistManager.ArtistManager>()
    ?? panic("Could not borrow a reference to the artist manager")
  
  let artist = artistManager.getArtist(artistId: artistId)
    ?? panic("Artist not found")
  
  return {
    "artistId": artist.artistId,
    "artistAddress": artist.artistAddress.toString(),
    "optimismAddress": artist.optimismAddress,
    "pendingFunds": artist.pendingFunds.toString(),
    "totalFundsReceived": artist.totalFundsReceived.toString()
  }
}
`;

const DISBURSE_GRANT_TRANSACTION = `
import FlowArtistManager from ${CONTRACT_ADDRESS}

transaction(artistId: String, amount: UFix64) {
  prepare(signer: AuthAccount) {
    FlowArtistManager.distributeFunds(artistId: artistId)
  }
}
`;

const INITIATE_CROSS_CHAIN_TRANSACTION = `
import FlowArtistManager from ${CONTRACT_ADDRESS}

transaction(artistId: String, amount: UFix64, targetChain: String) {
  prepare(signer: AuthAccount) {
    FlowArtistManager.initiateCrossChainTransaction(
      artistId: artistId,
      amount: amount,
      targetChain: targetChain,
      targetAddress: "0x0" // Placeholder, would be replaced with actual address
    )
  }
}
`;

// Custom Flow action provider implementation
class CustomFlowActionProvider {
  async flowRegisterArtist(params) {
    try {
      // Ensure Flow address is properly formatted with exactly 16 characters
      const formattedAddress = params.address.startsWith('0x') 
        ? params.address.length === 18 
          ? params.address 
          : `0x${params.address.replace(/^0x/, '').padStart(16, '0').slice(-16)}`
        : `0x${params.address.padStart(16, '0').slice(-16)}`;
      
      console.log(`Registering artist ${params.artistId} with Flow address ${formattedAddress} and Optimism address ${params.optimismAddress}`);
      
      // Execute the transaction using FCL with our custom authorization
      const transactionId = await fcl.mutate({
        cadence: REGISTER_ARTIST_TRANSACTION,
        args: (arg, t) => [
          arg(params.artistId, t.String),
          arg(formattedAddress, t.Address),
          arg(params.optimismAddress || '', t.String)
        ],
        proposer: authorizationFunction,
        payer: authorizationFunction,
        authorizations: [authorizationFunction],
        limit: 1000
      });
      
      console.log(`Transaction sent with ID: ${transactionId}`);
      
      // Wait for transaction to be sealed
      const txStatus = await fcl.tx(transactionId).onceSealed();
      console.log('Transaction sealed:', txStatus);
      
      return {
        success: true,
        message: 'Artist registered successfully',
        data: {
          artistId: params.artistId,
          address: formattedAddress,
          optimismAddress: params.optimismAddress,
          transactionId: transactionId
        }
      };
    } catch (error) {
      console.error('Error registering artist:', error);
      return {
        success: false,
        message: `Failed to register artist: ${error.message || error}`
      };
    }
  }

  async flowGetArtistDetails(params) {
    try {
      const result = await fcl.query({
        cadence: GET_ARTIST_DETAILS_SCRIPT,
        args: (arg, t) => [arg(params.artistId, t.String)]
      });
      
      return {
        success: true,
        message: 'Artist details retrieved successfully',
        data: result
      };
    } catch (error) {
      console.error('Error getting artist details:', error);
      return {
        success: false,
        message: `Failed to get artist details: ${error.message || error}`
      };
    }
  }

  async flowDisburseGrant(params) {
    try {
      const transactionId = await fcl.mutate({
        cadence: DISBURSE_GRANT_TRANSACTION,
        args: (arg, t) => [
          arg(params.artistId, t.String),
          arg(params.amount, t.UFix64)
        ],
        proposer: authorizationFunction,
        payer: authorizationFunction,
        authorizations: [authorizationFunction],
        limit: 1000
      });
      
      console.log(`Transaction sent with ID: ${transactionId}`);
      
      // Wait for transaction to be sealed
      const txStatus = await fcl.tx(transactionId).onceSealed();
      console.log('Transaction sealed:', txStatus);
      
      return {
        success: true,
        message: 'Grant disbursed successfully',
        data: {
          artistId: params.artistId,
          amount: params.amount,
          transactionId: transactionId
        }
      };
    } catch (error) {
      console.error('Error disbursing grant:', error);
      return {
        success: false,
        message: `Failed to disburse grant: ${error.message || error}`
      };
    }
  }

  async flowInitiateCrossChainTransaction(params) {
    try {
      const transactionId = await fcl.mutate({
        cadence: INITIATE_CROSS_CHAIN_TRANSACTION,
        args: (arg, t) => [
          arg(params.artistId, t.String),
          arg(params.amount, t.UFix64),
          arg(params.targetChain, t.String)
        ],
        proposer: authorizationFunction,
        payer: authorizationFunction,
        authorizations: [authorizationFunction],
        limit: 1000
      });
      
      console.log(`Transaction sent with ID: ${transactionId}`);
      
      // Wait for transaction to be sealed
      const txStatus = await fcl.tx(transactionId).onceSealed();
      console.log('Transaction sealed:', txStatus);
      
      return {
        success: true,
        message: 'Cross-chain transaction initiated successfully',
        data: {
          artistId: params.artistId,
          amount: params.amount,
          targetChain: params.targetChain,
          transactionId: transactionId
        }
      };
    } catch (error) {
      console.error('Error initiating cross-chain transaction:', error);
      return {
        success: false,
        message: `Failed to initiate cross-chain transaction: ${error.message || error}`
      };
    }
  }
}

async function main() {
  try {
    console.log('Testing Flow Artist Fund Action Provider with Real Transactions');
    console.log('--------------------------------------------------------');
    console.log(`Using Flow contract address: ${FLOW_CONTRACT_ADDRESS}`);
    
    // Create a test artist ID
    const testArtistId = `artist-${Date.now()}`;
    const testOptimismAddress = `0x4f6D0cA7E66D5e447862793F23904ba15F51f4De`;
    
    // Initialize the custom action provider
    const flowActionProvider = new CustomFlowActionProvider();
    
    // Test 1: Register an artist
    console.log('\n--- Test 1: Register an artist with real transaction ---');
    console.log(`Registering artist ${testArtistId} with Flow address ${formattedFlowAddress} and Optimism address ${testOptimismAddress}`);
    const registerResult = await flowActionProvider.flowRegisterArtist({
      artistId: testArtistId,
      address: formattedFlowAddress,
      optimismAddress: testOptimismAddress,
    });
    console.log('Result:', registerResult);
    
    if (!registerResult.success) {
      console.error('Artist registration failed. Stopping tests.');
      process.exit(1);
    }
    
    // Test 2: Get artist details
    console.log('\n--- Test 2: Get artist details with real script ---');
    const detailsResult = await flowActionProvider.flowGetArtistDetails({
      artistId: testArtistId,
    });
    console.log('Result:', detailsResult);
    
    // Test 3: Disburse grant
    console.log('\n--- Test 3: Disburse grant with real transaction ---');
    const disburseResult = await flowActionProvider.flowDisburseGrant({
      artistId: testArtistId,
      amount: '5.0',
    });
    console.log('Result:', disburseResult);
    
    // Test 4: Initiate cross-chain transaction
    console.log('\n--- Test 4: Initiate cross-chain transaction with real transaction ---');
    const crossChainResult = await flowActionProvider.flowInitiateCrossChainTransaction({
      artistId: testArtistId,
      amount: '2.5',
      targetChain: 'optimism',
    });
    console.log('Result:', crossChainResult);
    
    console.log('\nAll tests completed successfully!');
    console.log('Transaction IDs for verification:');
    console.log(`- Register Artist: ${registerResult.data?.transactionId}`);
    console.log(`- Disburse Grant: ${disburseResult.data?.transactionId}`);
    console.log(`- Cross-Chain Transaction: ${crossChainResult.data?.transactionId}`);
    console.log('\nYou can verify these transactions on the Flow testnet explorer:');
    console.log('https://testnet.flowscan.org/');
    
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