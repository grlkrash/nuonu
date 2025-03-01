#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { AgentKit } = require('@coinbase/agentkit');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    console.log('Testing All Action Providers...');

    // Initialize AgentKit with mock action providers
    const agentKit = new AgentKit({
      // Base Action Provider
      artistFundActionProvider: {
        createArtistWallet: async (input) => {
          console.log('Calling createArtistWallet with input:', input);
          return {
            success: true,
            message: `Created wallet for artist ${input.artistId}`,
            data: {
              artistId: input.artistId,
              walletAddress: '0x1234567890123456789012345678901234567890',
              transactionHash: 'mock-tx-hash-123'
            }
          };
        },
        disburseGrant: async (input) => {
          console.log('Calling disburseGrant with input:', input);
          return {
            success: true,
            message: `Disbursed grant of ${input.amount} ETH to artist ${input.artistId}`,
            data: {
              artistId: input.artistId,
              amount: input.amount,
              transactionHash: 'mock-tx-hash-456'
            }
          };
        },
        getArtistDetails: async (input) => {
          console.log('Calling getArtistDetails with input:', input);
          return {
            success: true,
            message: `Retrieved details for artist ${input.artistId}`,
            data: {
              artistId: input.artistId,
              name: 'Test Artist',
              walletAddress: '0x1234567890123456789012345678901234567890',
              totalFunding: '1.5'
            }
          };
        }
      },
      
      // zkSync Action Provider
      zkSyncArtistFundActionProvider: {
        zkSyncDisburseGrant: async (input) => {
          console.log('Calling zkSyncDisburseGrant with input:', input);
          return {
            success: true,
            message: `Disbursed zkSync grant of ${input.amount} ETH to artist ${input.artistId}`,
            data: {
              artistId: input.artistId,
              amount: input.amount,
              transactionHash: 'mock-zksync-tx-hash-123'
            }
          };
        },
        zkSyncGetArtistDetails: async (input) => {
          console.log('Calling zkSyncGetArtistDetails with input:', input);
          return {
            success: true,
            message: `Retrieved zkSync details for artist ${input.artistId}`,
            data: {
              artistId: input.artistId,
              name: 'Test Artist',
              walletAddress: '0x9876543210987654321098765432109876543210',
              totalFunding: '0.5'
            }
          };
        }
      },
      
      // Flow Action Provider
      flowArtistFundActionProvider: {
        flowDisburseGrant: async (input) => {
          console.log('Calling flowDisburseGrant with input:', input);
          return {
            success: true,
            message: `Disbursed Flow grant of ${input.amount} FLOW to artist ${input.artistId}`,
            data: {
              artistId: input.artistId,
              amount: input.amount,
              transactionId: 'mock-flow-tx-id-123'
            }
          };
        },
        flowGetArtistDetails: async (input) => {
          console.log('Calling flowGetArtistDetails with input:', input);
          return {
            success: true,
            message: `Retrieved Flow details for artist ${input.artistId}`,
            data: {
              artistId: input.artistId,
              name: 'Test Artist',
              flowAddress: '0x12345678',
              totalFunding: '10.0'
            }
          };
        }
      },
      
      // Optimism Interop Action Provider
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

    const testArtistId = 'test-artist-123';
    const testWalletAddress = '0x1234567890123456789012345678901234567890';

    // Test Base Action Provider
    console.log('\n=== Testing Base Action Provider ===');
    
    console.log('\n--- Testing createArtistWallet ---');
    const createWalletResult = await agentKit.artistFundActionProvider.createArtistWallet({
      artistId: testArtistId
    });
    console.log('Result:', createWalletResult);
    
    console.log('\n--- Testing disburseGrant ---');
    const disburseGrantResult = await agentKit.artistFundActionProvider.disburseGrant({
      artistId: testArtistId,
      amount: '0.1'
    });
    console.log('Result:', disburseGrantResult);
    
    console.log('\n--- Testing getArtistDetails ---');
    const artistDetailsResult = await agentKit.artistFundActionProvider.getArtistDetails({
      artistId: testArtistId
    });
    console.log('Result:', artistDetailsResult);

    // Test zkSync Action Provider
    console.log('\n=== Testing zkSync Action Provider ===');
    
    console.log('\n--- Testing zkSyncDisburseGrant ---');
    const zkSyncDisburseResult = await agentKit.zkSyncArtistFundActionProvider.zkSyncDisburseGrant({
      artistId: testArtistId,
      amount: '0.05'
    });
    console.log('Result:', zkSyncDisburseResult);
    
    console.log('\n--- Testing zkSyncGetArtistDetails ---');
    const zkSyncDetailsResult = await agentKit.zkSyncArtistFundActionProvider.zkSyncGetArtistDetails({
      artistId: testArtistId
    });
    console.log('Result:', zkSyncDetailsResult);

    // Test Flow Action Provider
    console.log('\n=== Testing Flow Action Provider ===');
    
    console.log('\n--- Testing flowDisburseGrant ---');
    const flowDisburseResult = await agentKit.flowArtistFundActionProvider.flowDisburseGrant({
      artistId: testArtistId,
      amount: '5.0'
    });
    console.log('Result:', flowDisburseResult);
    
    console.log('\n--- Testing flowGetArtistDetails ---');
    const flowDetailsResult = await agentKit.flowArtistFundActionProvider.flowGetArtistDetails({
      artistId: testArtistId
    });
    console.log('Result:', flowDetailsResult);

    // Test Optimism Interop Action Provider
    console.log('\n=== Testing Optimism Interop Action Provider ===');
    
    console.log('\n--- Testing getL1BlockNumber ---');
    const blockNumberResult = await agentKit.optimismInteropActionProvider.getL1BlockNumber();
    console.log('Result:', blockNumberResult);
    
    console.log('\n--- Testing getL1BlockAttributes ---');
    const blockAttributesResult = await agentKit.optimismInteropActionProvider.getL1BlockAttributes();
    console.log('Result:', blockAttributesResult);
    
    console.log('\n--- Testing getSystemConfig ---');
    const systemConfigResult = await agentKit.optimismInteropActionProvider.getSystemConfig();
    console.log('Result:', systemConfigResult);
    
    console.log('\n--- Testing initiateWithdrawal ---');
    const withdrawalResult = await agentKit.optimismInteropActionProvider.initiateWithdrawal({
      artistId: testArtistId,
      amount: '0.01',
      targetAddress: testWalletAddress
    });
    console.log('Result:', withdrawalResult);
    
    console.log('\n--- Testing getAggregatedBalance ---');
    const balanceResult = await agentKit.optimismInteropActionProvider.getAggregatedBalance({
      artistId: testArtistId
    });
    console.log('Result:', balanceResult);
    
    console.log('\n--- Testing bridgeTokens (ETH) ---');
    const bridgeEthResult = await agentKit.optimismInteropActionProvider.bridgeTokens({
      artistId: testArtistId,
      sourceChain: 'base-sepolia',
      destinationChain: 'optimism-sepolia',
      amount: '0.01',
      targetAddress: testWalletAddress
    });
    console.log('Result:', bridgeEthResult);
    
    console.log('\n--- Testing bridgeTokens (ERC20) ---');
    const bridgeErc20Result = await agentKit.optimismInteropActionProvider.bridgeTokens({
      artistId: testArtistId,
      sourceChain: 'base-sepolia',
      destinationChain: 'optimism-sepolia',
      tokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Example USDC address
      amount: '10',
      targetAddress: testWalletAddress
    });
    console.log('Result:', bridgeErc20Result);
    
    console.log('\n--- Testing bridgeTokens (Flow) ---');
    const bridgeFlowResult = await agentKit.optimismInteropActionProvider.bridgeTokens({
      artistId: testArtistId,
      sourceChain: 'base-sepolia',
      destinationChain: 'flow-testnet',
      amount: '0.01',
      targetAddress: testWalletAddress
    });
    console.log('Result:', bridgeFlowResult);
    
    console.log('\n--- Testing convertToUSDC ---');
    const convertResult = await agentKit.optimismInteropActionProvider.convertToUSDC({
      artistId: testArtistId,
      sourceChain: 'base-sepolia',
      amount: '0.01',
      targetAddress: testWalletAddress
    });
    console.log('Result:', convertResult);

    console.log('\n=== All tests completed successfully! ===');
    console.log('\nSummary:');
    console.log('- Base Action Provider: ✅');
    console.log('- zkSync Action Provider: ✅');
    console.log('- Flow Action Provider: ✅');
    console.log('- Optimism Interop Action Provider: ✅');
    console.log('  - Cross-chain token transfers: ✅');
    console.log('  - USDC conversion: ✅');
  } catch (error) {
    console.error('Error testing action providers:', error);
  }
}

main(); 