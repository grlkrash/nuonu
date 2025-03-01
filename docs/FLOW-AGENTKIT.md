# Flow x AgentKit Integration Guide

This document provides a comprehensive guide for integrating Flow blockchain with AgentKit, enabling AI agents to interact with Flow smart contracts.

## Overview

AgentKit is a framework that allows AI agents to interact with blockchain networks. By integrating Flow with AgentKit, we enable AI agents to:

1. Register artists on the Flow blockchain
2. Disburse grants to artists
3. Retrieve artist details
4. Initiate cross-chain transactions to Optimism

## Prerequisites

- Flow account with testnet FLOW tokens
- Deployed `FlowArtistManager` contract
- Environment variables configured in `.env.local`
- AgentKit SDK installed

## Implementation Components

### 1. Flow Wallet Provider

The `FlowWalletProvider` class implements the necessary methods for AgentKit to interact with Flow:

```javascript
class FlowWalletProvider {
  constructor() {
    this.address = process.env.FLOW_ACCOUNT_ADDRESS;
  }

  async get() {
    return {
      address: this.address,
      protocol: 'flow',
    };
  }

  getNetwork() {
    return {
      name: 'flow-testnet',
      protocol_family: 'flow',
      chain_id: 'flow-testnet',
    };
  }

  supports(network) {
    return network.protocol_family === 'flow';
  }

  // Additional methods for signing and sending transactions
  async sign() {
    // Flow-specific signing logic
    return 'mock-signature';
  }

  async sendTransaction() {
    // Flow-specific transaction sending logic
    return 'mock-tx-hash';
  }
}
```

### 2. Flow Action Provider

The `FlowArtistFundActionProvider` class implements the actions that AI agents can perform on the Flow blockchain:

```typescript
export class FlowArtistFundActionProvider implements ActionProvider {
  private walletProvider: any;
  private contractAddress: string;

  constructor(params: ActionProviderParams) {
    this.walletProvider = params.walletProvider;
    this.contractAddress = env.NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS || '';
    
    // Configure FCL
    fcl.config()
      .put('accessNode.api', env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
      .put('discovery.wallet', env.NEXT_PUBLIC_FLOW_WALLET_DISCOVERY || 'https://fcl-discovery.onflow.org/testnet/authn')
      .put('app.detail.title', 'Artist Grant AI')
      .put('app.detail.icon', 'https://placekitten.com/g/200/200');
  }

  getActions() {
    return [
      {
        name: 'flowDisburseGrant',
        description: 'Disburse funds to an artist from the Flow grant fund',
        inputSchema: flowDisburseGrantSchema,
        execute: this.flowDisburseGrant.bind(this),
      },
      {
        name: 'flowGetArtistDetails',
        description: 'Get details about an artist from the Flow contract',
        inputSchema: flowGetArtistDetailsSchema,
        execute: this.flowGetArtistDetails.bind(this),
      },
      {
        name: 'flowRegisterArtist',
        description: 'Register an artist with the Flow contract',
        inputSchema: flowRegisterArtistSchema,
        execute: this.flowRegisterArtist.bind(this),
      },
      {
        name: 'flowInitiateCrossChainTransaction',
        description: 'Initiate a cross-chain transaction to Optimism',
        inputSchema: flowInitiateCrossChainTransactionSchema,
        execute: this.flowInitiateCrossChainTransaction.bind(this),
      },
    ];
  }

  // Action implementation methods...
}
```

### 3. Action Provider Factory

The action provider factory creates and returns the Flow action provider:

```javascript
function createFlowActionProvider() {
  return {
    name: 'flow-artist-fund',
    getActions: () => {
      const provider = new FlowArtistFundActionProvider();
      return provider.getActions();
    }
  };
}
```

### 4. AgentKit Integration

Initialize AgentKit with the Flow wallet provider and action provider factory:

```javascript
// Initialize the Flow wallet provider
const flowWalletProvider = new FlowWalletProvider();

// Initialize AgentKit with the providers
const agentkit = AgentKit.from({
  walletProviders: [flowWalletProvider],
  actionProviderFactories: [createFlowActionProvider]
});
```

## Using AgentKit with Flow

Once AgentKit is initialized with the Flow providers, AI agents can execute actions on the Flow blockchain:

### Example: Registering an Artist

```javascript
const result = await agentkit.execute('flowRegisterArtist', {
  artistId: 'artist-123',
  address: '0x01cf0e2f2f715450',
  optimismAddress: '0x01cf0e2f2f715450'
});

console.log(result);
// {
//   success: true,
//   message: 'Successfully registered artist artist-123 on Flow. Transaction ID: tx-123',
//   data: {
//     transactionId: 'tx-123',
//     status: 4,
//     artistId: 'artist-123',
//     address: '0x01cf0e2f2f715450',
//     optimismAddress: '0x01cf0e2f2f715450'
//   }
// }
```

### Example: Disbursing a Grant

```javascript
const result = await agentkit.execute('flowDisburseGrant', {
  artistId: 'artist-123',
  amount: '5.0'
});

console.log(result);
// {
//   success: true,
//   message: 'Successfully disbursed funds to artist artist-123 on Flow. Transaction ID: tx-456',
//   data: {
//     transactionId: 'tx-456',
//     status: 4,
//     amount: '5.0'
//   }
// }
```

### Example: Initiating a Cross-Chain Transaction

```javascript
const result = await agentkit.execute('flowInitiateCrossChainTransaction', {
  artistId: 'artist-123',
  amount: '2.5',
  targetChain: 'optimism',
  targetAddress: '0x01cf0e2f2f715450'
});

console.log(result);
// {
//   success: true,
//   message: 'Successfully initiated cross-chain transaction for artist artist-123 on Flow. Transaction ID: tx-789',
//   data: {
//     transactionId: 'tx-789',
//     status: 4,
//     artistId: 'artist-123',
//     amount: '2.5',
//     targetChain: 'optimism',
//     targetAddress: '0x01cf0e2f2f715450'
//   }
// }
```

## Implementing Real Transactions

To move from simulated transactions to real Flow blockchain transactions:

1. **Configure FCL Authentication**:
   ```javascript
   fcl.config()
     .put('fcl.accountProof.resolver', async (data) => {
       // Implement proper signature verification
       return {
         address: FLOW_ACCOUNT_ADDRESS,
         keyId: 0,
         signature: signMessage(data.message)
       };
     });
   ```

2. **Implement Real Authorization**:
   ```javascript
   fcl.authz = () => {
     return {
       addr: FLOW_ACCOUNT_ADDRESS,
       keyId: 0,
       signingFunction: async (signable) => {
         // Implement proper signing with private key
         const signature = signWithPrivateKey(signable.message, FLOW_PRIVATE_KEY);
         return {
           addr: FLOW_ACCOUNT_ADDRESS,
           keyId: 0,
           signature: signature
         };
       }
     };
   };
   ```

3. **Update Action Provider Methods**:
   - Replace simulated transactions with real FCL transactions
   - Implement proper error handling for blockchain interactions
   - Update Cadence scripts to match your deployed contract

## Testing

Test the AgentKit integration with the Flow blockchain:

```javascript
// Test script
async function testAgentKitFlowIntegration() {
  try {
    console.log('Testing AgentKit integration with Flow...');
    
    // Initialize AgentKit with Flow providers
    const flowWalletProvider = new FlowWalletProvider();
    const agentkit = AgentKit.from({
      walletProviders: [flowWalletProvider],
      actionProviderFactories: [createFlowActionProvider]
    });
    
    // Test registering an artist
    const registerResult = await agentkit.execute('flowRegisterArtist', {
      artistId: `artist-${Date.now()}`,
      address: FLOW_ACCOUNT_ADDRESS,
      optimismAddress: `0x${FLOW_ACCOUNT_ADDRESS.substring(2)}`
    });
    
    console.log('Register result:', registerResult);
    
    // Test disbursing a grant
    const disburseResult = await agentkit.execute('flowDisburseGrant', {
      artistId: registerResult.data.artistId,
      amount: '5.0'
    });
    
    console.log('Disburse result:', disburseResult);
    
    console.log('AgentKit integration test completed successfully!');
  } catch (error) {
    console.error('Error testing AgentKit integration with Flow:', error);
  }
}
```

## Troubleshooting

Common issues and solutions:

1. **Authentication Errors**:
   - Ensure FCL is properly configured with your Flow account details
   - Verify that your private key is correctly formatted
   - Check that your account has sufficient FLOW tokens

2. **Transaction Errors**:
   - Verify that your contract is deployed correctly
   - Check that your Cadence scripts match the deployed contract
   - Ensure your account has the necessary permissions

3. **AgentKit Integration Errors**:
   - Verify that the wallet provider and action provider are correctly implemented
   - Check that the action provider factory returns the correct actions
   - Ensure that the action schemas match the expected input parameters

## Best Practices

1. **Security**:
   - Never hardcode private keys in your code
   - Use environment variables for sensitive information
   - Implement proper key management and security

2. **Error Handling**:
   - Implement comprehensive error handling for all blockchain interactions
   - Provide clear error messages to users
   - Log errors for debugging purposes

3. **Testing**:
   - Test all actions with both simulated and real transactions
   - Verify that all actions work correctly with the deployed contract
   - Test edge cases and error conditions

## Conclusion

By integrating Flow with AgentKit, we enable AI agents to interact with the Flow blockchain, allowing them to register artists, disburse grants, and initiate cross-chain transactions. This integration provides a powerful tool for building AI-powered applications on the Flow blockchain. 