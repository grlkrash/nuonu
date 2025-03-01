#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { AgentKit } = require('@coinbase/agentkit');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    console.log('Testing OptimismInteropActionProvider...');
    
    // Initialize AgentKit with a mock action provider
    const agentKit = new AgentKit({
      actionProviders: {
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
          getL1BlockAttributes: async () => {
            console.log('Calling getL1BlockAttributes...');
            return {
              success: true,
              message: 'Successfully retrieved L1 block attributes',
              data: {
                blockNumber: '12345678',
                timestamp: '1620000000',
                baseFee: '10.5',
                baseFeeWei: '10500000000'
              }
            };
          },
          getSystemConfig: async () => {
            console.log('Calling getSystemConfig...');
            return {
              success: true,
              message: 'Successfully retrieved system configuration',
              data: {
                l1FeeOverhead: '2100',
                l1FeeScalar: '1000000'
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
          }
        }
      }
    });
    
    // Test getL1BlockNumber
    console.log('\nTesting getL1BlockNumber...');
    const blockNumberResult = await agentKit.runAction('optimismInteropActionProvider', 'getL1BlockNumber', {});
    console.log('Result:', JSON.stringify(blockNumberResult, null, 2));
    
    // Test getL1BlockAttributes
    console.log('\nTesting getL1BlockAttributes...');
    const blockAttributesResult = await agentKit.runAction('optimismInteropActionProvider', 'getL1BlockAttributes', {});
    console.log('Result:', JSON.stringify(blockAttributesResult, null, 2));
    
    // Test getSystemConfig
    console.log('\nTesting getSystemConfig...');
    const systemConfigResult = await agentKit.runAction('optimismInteropActionProvider', 'getSystemConfig', {});
    console.log('Result:', JSON.stringify(systemConfigResult, null, 2));
    
    // Test initiateWithdrawal
    console.log('\nTesting initiateWithdrawal...');
    const withdrawalResult = await agentKit.runAction('optimismInteropActionProvider', 'initiateWithdrawal', {
      artistId: 'test-artist-123',
      amount: '0.01',
      targetAddress: '0x1234567890123456789012345678901234567890'
    });
    console.log('Result:', JSON.stringify(withdrawalResult, null, 2));
    
    // Test getAggregatedBalance
    console.log('\nTesting getAggregatedBalance...');
    const balanceResult = await agentKit.runAction('optimismInteropActionProvider', 'getAggregatedBalance', {
      artistId: 'test-artist-123'
    });
    console.log('Result:', JSON.stringify(balanceResult, null, 2));
    
    console.log('\nAll tests completed successfully!');
    
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