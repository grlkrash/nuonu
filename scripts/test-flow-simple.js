#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fcl = require('@onflow/fcl');
const { sansPrefix } = require('@onflow/util-address');
const { SHA3 } = require('sha3');
const EC = require('elliptic').ec;
const ec = new EC('p256');

// Configure FCL
fcl.config()
  .put('accessNode.api', process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
  .put('discovery.wallet', 'https://fcl-discovery.onflow.org/testnet/authn')
  .put('app.detail.title', 'Artist Grant AI')
  .put('app.detail.icon', 'https://placekitten.com/g/200/200')
  .put('flow.network', 'testnet');

// Flow account configuration
const flowAccountAddress = process.env.FLOW_ACCOUNT_ADDRESS;
const privateKey = process.env.FLOW_PRIVATE_KEY;
const contractAddress = process.env.NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS;

if (!flowAccountAddress) {
  console.error('Error: FLOW_ACCOUNT_ADDRESS not found in environment variables');
  process.exit(1);
}

if (!privateKey) {
  console.error('Error: FLOW_PRIVATE_KEY not found in environment variables');
  process.exit(1);
}

if (!contractAddress) {
  console.error('Error: NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS not found in environment variables');
  process.exit(1);
}

// Helper function to sign a transaction
const signWithKey = (privateKey, message) => {
  const key = ec.keyFromPrivate(Buffer.from(privateKey, 'hex'));
  const sig = key.sign(hash(message));
  const n = 32;
  const r = sig.r.toArrayLike(Buffer, 'be', n);
  const s = sig.s.toArrayLike(Buffer, 'be', n);
  return Buffer.concat([r, s]).toString('hex');
};

// Helper function to hash a message
const hash = (message) => {
  const sha = new SHA3(256);
  sha.update(Buffer.from(message, 'hex'));
  return sha.digest();
};

// Authorization function for Flow transactions
const authorizationFunction = async (account) => {
  return {
    ...account,
    tempId: `${flowAccountAddress}-0`,
    addr: sansPrefix(flowAccountAddress),
    keyId: 0,
    signingFunction: async (signable) => {
      return {
        addr: sansPrefix(flowAccountAddress),
        keyId: 0,
        signature: signWithKey(privateKey, signable.message)
      };
    }
  };
};

// Script to get artist details
const getArtistScript = `
import FlowArtistManager from ${contractAddress}

pub fun main(artistId: String): FlowArtistManager.ArtistDetails? {
  return FlowArtistManager.getArtistDetails(artistId: artistId)
}
`;

// Transaction to register an artist
const registerArtistTransaction = `
import FlowArtistManager from ${contractAddress}

transaction(artistId: String, address: Address) {
  prepare(signer: AuthAccount) {
    FlowArtistManager.registerArtist(artistId: artistId, address: address)
  }
}
`;

// Transaction to disburse a grant
const disburseGrantTransaction = `
import FlowArtistManager from ${contractAddress}

transaction(artistId: String, amount: UFix64) {
  prepare(signer: AuthAccount) {
    FlowArtistManager.disburseGrant(artistId: artistId, amount: amount)
  }
}
`;

async function main() {
  try {
    console.log('Testing Flow Integration with Direct Contract Interaction');
    console.log('----------------------------------------------------');
    console.log(`Using Flow contract address: ${contractAddress}`);
    console.log(`Using account address: ${flowAccountAddress}`);

    // Create a test artist ID
    const testArtistId = `artist_${Date.now()}`;
    console.log(`Test artist ID: ${testArtistId}`);

    // Test 1: Get artist details (this should fail initially since the artist doesn't exist yet)
    console.log('\n--- Test 1: Get artist details (should fail initially) ---');
    try {
      const artistDetails = await fcl.query({
        cadence: getArtistScript,
        args: (arg, t) => [arg(testArtistId, t.String)]
      });
      
      if (artistDetails) {
        console.log('Artist details:', artistDetails);
      } else {
        console.log('Artist not found (expected)');
      }
    } catch (error) {
      console.log('Error getting artist details:', error.message);
    }

    // Test 2: Register artist
    console.log('\n--- Test 2: Register artist with real transaction ---');
    try {
      const transactionId = await fcl.mutate({
        cadence: registerArtistTransaction,
        args: (arg, t) => [
          arg(testArtistId, t.String),
          arg(flowAccountAddress, t.Address)
        ],
        payer: authorizationFunction,
        proposer: authorizationFunction,
        authorizations: [authorizationFunction],
        limit: 100
      });
      
      console.log('Transaction submitted:', transactionId);
      
      // Wait for transaction to be sealed
      const txStatus = await fcl.tx(transactionId).onceSealed();
      console.log('Transaction sealed:', txStatus);
      
      if (txStatus.statusCode === 0) {
        console.log('Artist registration successful!');
      } else {
        console.error('Transaction failed:', txStatus.errorMessage);
      }
    } catch (error) {
      console.error('Error registering artist:', error.message);
    }

    // Test 3: Get artist details again (should succeed now)
    console.log('\n--- Test 3: Get artist details after registration ---');
    try {
      const artistDetails = await fcl.query({
        cadence: getArtistScript,
        args: (arg, t) => [arg(testArtistId, t.String)]
      });
      
      if (artistDetails) {
        console.log('Artist details:', artistDetails);
      } else {
        console.log('Artist not found (unexpected)');
      }
    } catch (error) {
      console.log('Error getting artist details:', error.message);
    }

    // Test 4: Disburse grant
    console.log('\n--- Test 4: Disburse grant with real transaction ---');
    try {
      const transactionId = await fcl.mutate({
        cadence: disburseGrantTransaction,
        args: (arg, t) => [
          arg(testArtistId, t.String),
          arg('10.0', t.UFix64)
        ],
        payer: authorizationFunction,
        proposer: authorizationFunction,
        authorizations: [authorizationFunction],
        limit: 100
      });
      
      console.log('Transaction submitted:', transactionId);
      
      // Wait for transaction to be sealed
      const txStatus = await fcl.tx(transactionId).onceSealed();
      console.log('Transaction sealed:', txStatus);
      
      if (txStatus.statusCode === 0) {
        console.log('Grant disbursement successful!');
      } else {
        console.error('Transaction failed:', txStatus.errorMessage);
      }
    } catch (error) {
      console.error('Error disbursing grant:', error.message);
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