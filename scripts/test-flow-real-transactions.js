#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fcl = require('@onflow/fcl');
const { ec: EC } = require('elliptic');
const { SHA3 } = require('sha3');
const fs = require('fs');
const path = require('path');

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

// Real authentication with private key
fcl.authenticate = async () => {
  return {
    addr: FLOW_ACCOUNT_ADDRESS,
    loggedIn: true,
    keyId: 0
  };
};

// Real authorization with private key
fcl.authz = () => {
  return {
    addr: FLOW_ACCOUNT_ADDRESS,
    keyId: 0,
    signingFunction: async (signable) => {
      // Sign the message with the private key
      const signature = signWithPrivateKey(signable.message, FLOW_PRIVATE_KEY);
      return {
        addr: FLOW_ACCOUNT_ADDRESS,
        keyId: 0,
        signature: signature
      };
    }
  };
};

async function main() {
  try {
    console.log('Testing Real Flow Transactions...');
    console.log(`Flow Contract Address: ${FLOW_CONTRACT_ADDRESS}`);
    
    // Authenticate with FCL
    console.log('\nAuthenticating with Flow...');
    await fcl.authenticate();
    const user = await fcl.currentUser().snapshot();
    console.log(`Authenticated as: ${user.addr}`);
    
    // Create a test artist ID
    const testArtistId = `artist-${Date.now()}`;
    const testOptimismAddress = `0x${FLOW_ACCOUNT_ADDRESS.substring(2)}`;
    
    // Test 1: Register an artist
    console.log('\n--- Test 1: Register an artist with real transaction ---');
    console.log(`Registering artist ${testArtistId} with Flow address ${FLOW_ACCOUNT_ADDRESS} and Optimism address ${testOptimismAddress}`);
    
    const registerCadence = `
      import FlowArtistManager from ${FLOW_CONTRACT_ADDRESS}
      
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
    
    try {
      const registerTxId = await fcl.mutate({
        cadence: registerCadence,
        args: (arg, t) => [
          arg(testArtistId, t.String),
          arg(FLOW_ACCOUNT_ADDRESS, t.Address),
          arg(testOptimismAddress, t.String)
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000
      });
      
      console.log(`Transaction submitted: ${registerTxId}`);
      console.log('Waiting for transaction to be sealed...');
      
      const registerTxStatus = await fcl.tx(registerTxId).onceSealed();
      console.log(`Transaction status: ${registerTxStatus.status === 4 ? 'SEALED' : 'FAILED'}`);
      
      if (registerTxStatus.status === 4) {
        console.log('Artist registered successfully!');
      } else {
        console.error('Artist registration failed:', registerTxStatus);
      }
    } catch (error) {
      console.error('Error registering artist:', error);
    }
    
    // Test 2: Get artist details
    console.log('\n--- Test 2: Get artist details with real script ---');
    console.log(`Getting details for artist ${testArtistId}`);
    
    const getArtistCadence = `
      import FlowArtistManager from ${FLOW_CONTRACT_ADDRESS}
      
      pub fun main(artistId: String): {String: String} {
        let artist = FlowArtistManager.getArtist(id: artistId)
        
        let result: {String: String} = {}
        result["id"] = artist.id
        result["address"] = artist.address.toString()
        result["verified"] = artist.verified.toString()
        
        if artist.optimismAddress != nil {
          result["optimismAddress"] = artist.optimismAddress!
        }
        
        return result
      }
    `;
    
    try {
      const artistDetails = await fcl.query({
        cadence: getArtistCadence,
        args: (arg, t) => [arg(testArtistId, t.String)]
      });
      
      console.log('Artist details:');
      console.log(JSON.stringify(artistDetails, null, 2));
    } catch (error) {
      console.error('Error getting artist details:', error);
    }
    
    // Test 3: Disburse grant
    console.log('\n--- Test 3: Disburse grant with real transaction ---');
    const grantAmount = '5.0';
    console.log(`Disbursing grant of ${grantAmount} FLOW to artist ${testArtistId}`);
    
    const disburseCadence = `
      import FlowArtistManager from ${FLOW_CONTRACT_ADDRESS}
      
      transaction(artistId: String, amount: UFix64) {
        prepare(signer: AuthAccount) {
          FlowArtistManager.disburseGrant(
            artistId: artistId,
            amount: amount
          )
        }
      }
    `;
    
    try {
      const disburseTxId = await fcl.mutate({
        cadence: disburseCadence,
        args: (arg, t) => [
          arg(testArtistId, t.String),
          arg(grantAmount, t.UFix64)
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000
      });
      
      console.log(`Transaction submitted: ${disburseTxId}`);
      console.log('Waiting for transaction to be sealed...');
      
      const disburseTxStatus = await fcl.tx(disburseTxId).onceSealed();
      console.log(`Transaction status: ${disburseTxStatus.status === 4 ? 'SEALED' : 'FAILED'}`);
      
      if (disburseTxStatus.status === 4) {
        console.log(`Grant of ${grantAmount} FLOW disbursed successfully!`);
      } else {
        console.error('Grant disbursement failed:', disburseTxStatus);
      }
    } catch (error) {
      console.error('Error disbursing grant:', error);
    }
    
    // Test 4: Initiate cross-chain transaction
    console.log('\n--- Test 4: Initiate cross-chain transaction with real transaction ---');
    const txAmount = '2.5';
    const targetChain = 'optimism';
    console.log(`Initiating cross-chain transaction for artist ${testArtistId} with amount ${txAmount} FLOW to ${targetChain} address ${testOptimismAddress}`);
    
    const crossChainCadence = `
      import FlowArtistManager from ${FLOW_CONTRACT_ADDRESS}
      
      transaction(artistId: String, amount: UFix64, targetChain: String, targetAddress: String) {
        prepare(signer: AuthAccount) {
          let txId = FlowArtistManager.initiateCrossChainTransaction(
            artistId: artistId,
            amount: amount,
            targetChain: targetChain,
            targetAddress: targetAddress
          )
        }
      }
    `;
    
    try {
      const crossChainTxId = await fcl.mutate({
        cadence: crossChainCadence,
        args: (arg, t) => [
          arg(testArtistId, t.String),
          arg(txAmount, t.UFix64),
          arg(targetChain, t.String),
          arg(testOptimismAddress, t.String)
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000
      });
      
      console.log(`Transaction submitted: ${crossChainTxId}`);
      console.log('Waiting for transaction to be sealed...');
      
      const crossChainTxStatus = await fcl.tx(crossChainTxId).onceSealed();
      console.log(`Transaction status: ${crossChainTxStatus.status === 4 ? 'SEALED' : 'FAILED'}`);
      
      if (crossChainTxStatus.status === 4) {
        console.log(`Cross-chain transaction initiated successfully!`);
      } else {
        console.error('Cross-chain transaction initiation failed:', crossChainTxStatus);
      }
    } catch (error) {
      console.error('Error initiating cross-chain transaction:', error);
    }
    
    // Test 5: Get cross-chain transactions for artist
    console.log('\n--- Test 5: Get cross-chain transactions for artist with real script ---');
    console.log(`Getting cross-chain transactions for artist ${testArtistId}`);
    
    const getCrossChainTxsCadence = `
      import FlowArtistManager from ${FLOW_CONTRACT_ADDRESS}
      
      pub fun main(artistId: String): [AnyStruct] {
        let transactions = FlowArtistManager.getArtistCrossChainTransactions(artistId: artistId)
        return transactions
      }
    `;
    
    try {
      const crossChainTxs = await fcl.query({
        cadence: getCrossChainTxsCadence,
        args: (arg, t) => [arg(testArtistId, t.String)]
      });
      
      console.log('Cross-chain transactions:');
      console.log(JSON.stringify(crossChainTxs, null, 2));
    } catch (error) {
      console.error('Error getting cross-chain transactions:', error);
    }
    
    console.log('\nAll tests completed!');
    console.log('\nNote: This implementation uses real FCL transactions with the Flow contract.');
    console.log('For production use:');
    console.log('1. Deploy the FlowArtistManager contract to Flow mainnet');
    console.log('2. Update the .env.local file with the mainnet contract address');
    console.log('3. Implement proper key management and security');
    
  } catch (error) {
    console.error('Error testing real Flow transactions:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 