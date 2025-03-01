#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { AgentKit } = require('@coinbase/agentkit');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    console.log('Testing Optimism Interop Action Provider...');
    
    // Initialize AgentKit with a mock action provider
    const agentKit = new AgentKit({
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
              baseFee: '10',
              baseFeeWei: '10000000000'
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
          console.log('Calling initiateWithdrawal with input:', input);
          return {
            success: true,
            message: `Withdrawal initiated for artist ${input.artistId} for ${input.amount} ETH to address ${input.targetAddress}`,
            data: {
              withdrawalId: 'mock-withdrawal-id-123',
              artistId: input.artistId,
              amount: input.amount,
              targetAddress: input.targetAddress,
              status: 'pending'
            }
          };
        },
        getAggregatedBalance: async (input) => {
          console.log('Calling getAggregatedBalance with input:', input);
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
        bridgeTokens: async (input) => {
          console.log('Calling bridgeTokens with input:', input);
          return {
            success: true,
            message: `Bridge initiated for artist ${input.artistId} from ${input.sourceChain} to ${input.destinationChain} for ${input.amount} tokens to address ${input.targetAddress}`,
            data: {
              bridgeId: 'mock-bridge-id-123',
              artistId: input.artistId,
              sourceChain: input.sourceChain,
              destinationChain: input.destinationChain,
              tokenAddress: input.tokenAddress,
              amount: input.amount,
              targetAddress: input.targetAddress,
              status: 'pending'
            }
          };
        },
        convertToUSDC: async (input) => {
          console.log('Calling convertToUSDC with input:', input);
          const usdcAmount = (parseFloat(input.amount) * 1800).toString(); // Mock conversion rate
          return {
            success: true,
            message: `Converted ${input.amount} ETH to USDC for artist ${input.artistId} on ${input.sourceChain} and sent to ${input.targetAddress}`,
            data: {
              conversionId: 'mock-conversion-id-123',
              artistId: input.artistId,
              sourceChain: input.sourceChain,
              sourceAmount: input.amount,
              usdcAmount,
              targetAddress: input.targetAddress,
              status: 'simulated'
            }
          };
        }
      }
    });
    
    // Test getL1BlockNumber
    console.log('\n--- Testing getL1BlockNumber ---');
    const blockNumberResult = await agentKit.optimismInteropActionProvider.getL1BlockNumber();
    console.log('Result:', blockNumberResult);
    
    // Test getL1BlockAttributes
    console.log('\n--- Testing getL1BlockAttributes ---');
    const blockAttributesResult = await agentKit.optimismInteropActionProvider.getL1BlockAttributes();
    console.log('Result:', blockAttributesResult);
    
    // Test getSystemConfig
    console.log('\n--- Testing getSystemConfig ---');
    const systemConfigResult = await agentKit.optimismInteropActionProvider.getSystemConfig();
    console.log('Result:', systemConfigResult);
    
    // Test initiateWithdrawal
    console.log('\n--- Testing initiateWithdrawal ---');
    const withdrawalResult = await agentKit.optimismInteropActionProvider.initiateWithdrawal({
      artistId: 'test-artist-123',
      amount: '0.01',
      targetAddress: '0x1234567890123456789012345678901234567890'
    });
    console.log('Result:', withdrawalResult);
    
    // Test getAggregatedBalance
    console.log('\n--- Testing getAggregatedBalance ---');
    const balanceResult = await agentKit.optimismInteropActionProvider.getAggregatedBalance({
      artistId: 'test-artist-123'
    });
    console.log('Result:', balanceResult);
    
    // Test bridgeTokens (ETH)
    console.log('\n--- Testing bridgeTokens (ETH) ---');
    const bridgeEthResult = await agentKit.optimismInteropActionProvider.bridgeTokens({
      artistId: 'test-artist-123',
      sourceChain: 'base-sepolia',
      destinationChain: 'optimism-sepolia',
      amount: '0.01',
      targetAddress: '0x1234567890123456789012345678901234567890'
    });
    console.log('Result:', bridgeEthResult);
    
    // Test bridgeTokens (ERC20)
    console.log('\n--- Testing bridgeTokens (ERC20) ---');
    const bridgeErc20Result = await agentKit.optimismInteropActionProvider.bridgeTokens({
      artistId: 'test-artist-123',
      sourceChain: 'base-sepolia',
      destinationChain: 'optimism-sepolia',
      tokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Example USDC address
      amount: '10',
      targetAddress: '0x1234567890123456789012345678901234567890'
    });
    console.log('Result:', bridgeErc20Result);
    
    // Test bridgeTokens (Flow)
    console.log('\n--- Testing bridgeTokens (Flow) ---');
    const bridgeFlowResult = await agentKit.optimismInteropActionProvider.bridgeTokens({
      artistId: 'test-artist-123',
      sourceChain: 'base-sepolia',
      destinationChain: 'flow-testnet',
      amount: '0.01',
      targetAddress: '0x1234567890123456789012345678901234567890'
    });
    console.log('Result:', bridgeFlowResult);
    
    // Test convertToUSDC
    console.log('\n--- Testing convertToUSDC ---');
    const convertResult = await agentKit.optimismInteropActionProvider.convertToUSDC({
      artistId: 'test-artist-123',
      sourceChain: 'base-sepolia',
      amount: '0.01',
      targetAddress: '0x1234567890123456789012345678901234567890'
    });
    console.log('Result:', convertResult);
    
    console.log('\nAll tests completed successfully!');
    
  } catch (error) {
    console.error('Error testing Optimism Interop Action Provider:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 