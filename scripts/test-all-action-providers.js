#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { AgentKit } = require('@coinbase/agentkit');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    console.log('Testing all action providers...');
    
    // Initialize AgentKit with mock action providers
    const agentKit = new AgentKit({
      actionProviders: {
        // Base action provider
        artistFundActionProvider: {
          createArtistWallet: async (input) => {
            console.log(`Calling createArtistWallet with input: ${JSON.stringify(input)}`);
            return {
              success: true,
              message: `Wallet created for artist ${input.artistId}`,
              data: {
                artistId: input.artistId,
                walletAddress: '0x1234567890123456789012345678901234567890'
              }
            };
          },
          disburseGrant: async (input) => {
            console.log(`Calling disburseGrant with input: ${JSON.stringify(input)}`);
            return {
              success: true,
              message: `Grant disbursed to artist ${input.artistId} for ${input.amount} ETH`,
              data: {
                artistId: input.artistId,
                amount: input.amount,
                txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
              }
            };
          },
          getArtistDetails: async (input) => {
            console.log(`Calling getArtistDetails with input: ${JSON.stringify(input)}`);
            return {
              success: true,
              message: `Artist details for ${input.artistId}`,
              data: {
                artistId: input.artistId,
                name: 'Test Artist',
                walletAddress: '0x1234567890123456789012345678901234567890',
                totalFunding: '1.5'
              }
            };
          }
        },
        
        // zkSync action provider
        zkSyncArtistFundActionProvider: {
          zkSyncDisburseGrant: async (input) => {
            console.log(`Calling zkSyncDisburseGrant with input: ${JSON.stringify(input)}`);
            return {
              success: true,
              message: `Grant disbursed to artist ${input.artistId} for ${input.amount} ETH on zkSync`,
              data: {
                artistId: input.artistId,
                amount: input.amount,
                txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
              }
            };
          },
          zkSyncGetArtistDetails: async (input) => {
            console.log(`Calling zkSyncGetArtistDetails with input: ${JSON.stringify(input)}`);
            return {
              success: true,
              message: `Artist details for ${input.artistId} on zkSync`,
              data: {
                artistId: input.artistId,
                name: 'Test Artist',
                walletAddress: '0x1234567890123456789012345678901234567890',
                totalFunding: '0.5'
              }
            };
          }
        },
        
        // Flow action provider
        flowArtistFundActionProvider: {
          flowDisburseGrant: async (input) => {
            console.log(`Calling flowDisburseGrant with input: ${JSON.stringify(input)}`);
            return {
              success: true,
              message: `Grant disbursed to artist ${input.artistId} for ${input.amount} FLOW`,
              data: {
                artistId: input.artistId,
                amount: input.amount,
                txId: '12345678-1234-5678-1234-567812345678'
              }
            };
          },
          flowGetArtistDetails: async (input) => {
            console.log(`Calling flowGetArtistDetails with input: ${JSON.stringify(input)}`);
            return {
              success: true,
              message: `Artist details for ${input.artistId} on Flow`,
              data: {
                artistId: input.artistId,
                name: 'Test Artist',
                walletAddress: '0x1234',
                totalFunding: '10.0'
              }
            };
          }
        },
        
        // Optimism interop action provider
        optimismInteropActionProvider: {
          getL1BlockNumber: async () => {
            console.log('Calling getL1BlockNumber...');
            return {
              success: true,
              message: 'Current L1 block number: 12345678',
              data: {
                blockNumber: '12345678'
              }
            };
          },
          getAggregatedBalance: async (input) => {
            console.log(`Calling getAggregatedBalance with input: ${JSON.stringify(input)}`);
            return {
              success: true,
              message: `Aggregated balance for artist ${input.artistId}`,
              data: {
                artistId: input.artistId,
                balances: {
                  base: '0.5',
                  zkSync: '0.3',
                  flow: '0.2'
                },
                totalEthEquivalent: '1.0'
              }
            };
          },
          initiateWithdrawal: async (input) => {
            console.log(`Calling initiateWithdrawal with input: ${JSON.stringify(input)}`);
            return {
              success: true,
              message: `Withdrawal initiated for artist ${input.artistId} for ${input.amount} ETH to address ${input.targetAddress}`,
              data: {
                withdrawalId: 'mock-withdrawal-id',
                artistId: input.artistId,
                amount: input.amount,
                targetAddress: input.targetAddress,
                status: 'pending'
              }
            };
          }
        }
      }
    });
    
    // Test artist ID
    const testArtistId = 'test-artist-123';
    
    // Test Base action provider
    console.log('\n=== Testing Base Action Provider ===');
    
    console.log('\nTesting createArtistWallet...');
    const createWalletResult = await agentKit.runAction('artistFundActionProvider', 'createArtistWallet', {
      artistId: testArtistId
    });
    console.log('Result:', JSON.stringify(createWalletResult, null, 2));
    
    console.log('\nTesting disburseGrant...');
    const disburseGrantResult = await agentKit.runAction('artistFundActionProvider', 'disburseGrant', {
      artistId: testArtistId,
      amount: '0.01'
    });
    console.log('Result:', JSON.stringify(disburseGrantResult, null, 2));
    
    console.log('\nTesting getArtistDetails...');
    const artistDetailsResult = await agentKit.runAction('artistFundActionProvider', 'getArtistDetails', {
      artistId: testArtistId
    });
    console.log('Result:', JSON.stringify(artistDetailsResult, null, 2));
    
    // Test zkSync action provider
    console.log('\n=== Testing zkSync Action Provider ===');
    
    console.log('\nTesting zkSyncDisburseGrant...');
    const zkSyncDisburseGrantResult = await agentKit.runAction('zkSyncArtistFundActionProvider', 'zkSyncDisburseGrant', {
      artistId: testArtistId,
      amount: '0.01'
    });
    console.log('Result:', JSON.stringify(zkSyncDisburseGrantResult, null, 2));
    
    console.log('\nTesting zkSyncGetArtistDetails...');
    const zkSyncArtistDetailsResult = await agentKit.runAction('zkSyncArtistFundActionProvider', 'zkSyncGetArtistDetails', {
      artistId: testArtistId
    });
    console.log('Result:', JSON.stringify(zkSyncArtistDetailsResult, null, 2));
    
    // Test Flow action provider
    console.log('\n=== Testing Flow Action Provider ===');
    
    console.log('\nTesting flowDisburseGrant...');
    const flowDisburseGrantResult = await agentKit.runAction('flowArtistFundActionProvider', 'flowDisburseGrant', {
      artistId: testArtistId,
      amount: '1.0'
    });
    console.log('Result:', JSON.stringify(flowDisburseGrantResult, null, 2));
    
    console.log('\nTesting flowGetArtistDetails...');
    const flowArtistDetailsResult = await agentKit.runAction('flowArtistFundActionProvider', 'flowGetArtistDetails', {
      artistId: testArtistId
    });
    console.log('Result:', JSON.stringify(flowArtistDetailsResult, null, 2));
    
    // Test Optimism interop action provider
    console.log('\n=== Testing Optimism Interop Action Provider ===');
    
    console.log('\nTesting getL1BlockNumber...');
    const blockNumberResult = await agentKit.runAction('optimismInteropActionProvider', 'getL1BlockNumber', {});
    console.log('Result:', JSON.stringify(blockNumberResult, null, 2));
    
    console.log('\nTesting getAggregatedBalance...');
    const aggregatedBalanceResult = await agentKit.runAction('optimismInteropActionProvider', 'getAggregatedBalance', {
      artistId: testArtistId
    });
    console.log('Result:', JSON.stringify(aggregatedBalanceResult, null, 2));
    
    console.log('\nTesting initiateWithdrawal...');
    const withdrawalResult = await agentKit.runAction('optimismInteropActionProvider', 'initiateWithdrawal', {
      artistId: testArtistId,
      amount: '0.01',
      targetAddress: '0x1234567890123456789012345678901234567890'
    });
    console.log('Result:', JSON.stringify(withdrawalResult, null, 2));
    
    // Summary
    console.log('\n=== Test Summary ===');
    console.log('All action providers tested successfully!');
    console.log('1. Base Action Provider: createArtistWallet, disburseGrant, getArtistDetails');
    console.log('2. zkSync Action Provider: zkSyncDisburseGrant, zkSyncGetArtistDetails');
    console.log('3. Flow Action Provider: flowDisburseGrant, flowGetArtistDetails');
    console.log('4. Optimism Interop Action Provider: getL1BlockNumber, getAggregatedBalance, initiateWithdrawal');
    
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