# Flow Blockchain Integration

This document outlines the integration of the Flow blockchain with the Artist Fund platform, including cross-chain functionality with Optimism.

## Overview

The Flow blockchain integration enables artists to register, receive grants, and initiate cross-chain transactions to Optimism. This implementation includes:

1. A Flow smart contract (`FlowArtistManager.cdc`)
2. An AgentKit action provider for Flow
3. Test scripts for Flow integration and Flow-Optimism interoperability
4. Deployment scripts for the Flow contract

## Smart Contract

The `FlowArtistManager.cdc` contract manages artists, grants, and cross-chain transactions on the Flow blockchain. Key features include:

- Artist registration and verification
- Grant creation and disbursement
- Cross-chain transaction initiation and status tracking
- Events for important state changes

### Contract Structure

```cadence
pub contract FlowArtistManager {
    // Artist structure with Flow and Optimism addresses
    pub struct Artist {
        pub let id: String
        pub let address: Address
        pub var verified: Bool
        pub var optimismAddress: String?
        
        init(id: String, address: Address, optimismAddress: String?) {
            self.id = id
            self.address = address
            self.verified = false
            self.optimismAddress = optimismAddress
        }
    }
    
    // Grant structure for funding artists
    pub struct Grant {
        pub let id: String
        pub let title: String
        pub let amount: UFix64
        pub let funder: Address
        pub var active: Bool
        
        init(id: String, title: String, amount: UFix64, funder: Address) {
            self.id = id
            self.title = title
            self.amount = amount
            self.funder = funder
            self.active = true
        }
    }
    
    // Cross-chain transaction structure
    pub struct CrossChainTransaction {
        pub let id: String
        pub let artistId: String
        pub let amount: UFix64
        pub let targetChain: String
        pub let targetAddress: String
        pub var status: String
        pub let timestamp: UFix64
        
        init(id: String, artistId: String, amount: UFix64, targetChain: String, targetAddress: String) {
            self.id = id
            self.artistId = artistId
            self.amount = amount
            self.targetChain = targetChain
            self.targetAddress = targetAddress
            self.status = "initiated"
            self.timestamp = getCurrentBlock().timestamp
        }
    }
    
    // Contract state variables and functions
    // ...
}
```

## Action Provider

The `FlowArtistFundActionProvider` enables AI agents to interact with the Flow blockchain through AgentKit. It provides actions for:

- Registering artists
- Retrieving artist details
- Disbursing grants
- Initiating cross-chain transactions

### Implementation

The action provider is implemented in `src/providers/flow/FlowArtistFundActionProvider.ts` and includes:

- FCL configuration for Flow testnet
- Methods for interacting with the Flow contract
- Integration with AgentKit for AI agent access

## Cross-Chain Functionality

The implementation supports cross-chain transactions from Flow to Optimism, allowing artists to receive funds on either blockchain.

### Flow to Optimism Process

1. Artist registers on Flow with both Flow and Optimism addresses
2. Grant is disbursed on Flow
3. Cross-chain transaction is initiated on Flow
4. Transaction status is updated as it progresses
5. Funds are received on Optimism

### Interoperability Functions

The Flow contract includes several functions specifically for cross-chain interoperability:

#### 1. Register Artist with Optimism Address

```cadence
pub fun registerArtist(artistId: String, address: Address, optimismAddress: String?) {
    pre {
        !artists.containsKey(artistId): "Artist already exists"
    }
    
    let artist = Artist(id: artistId, address: address, optimismAddress: optimismAddress)
    artists[artistId] = artist
    
    if optimismAddress != nil {
        optimismAddressToArtistId[optimismAddress!] = artistId
    }
    
    emit ArtistRegistered(artistId: artistId, address: address, optimismAddress: optimismAddress)
}
```

#### 2. Initiate Cross-Chain Transaction

```cadence
pub fun initiateCrossChainTransaction(
    artistId: String, 
    amount: UFix64, 
    targetChain: String, 
    targetAddress: String
): String {
    pre {
        artists.containsKey(artistId): "Artist does not exist"
        amount > 0.0: "Amount must be greater than zero"
    }
    
    let txId = "ctx-" + artistId + "-" + getCurrentBlock().timestamp.toString()
    
    let transaction = CrossChainTransaction(
        id: txId,
        artistId: artistId,
        amount: amount,
        targetChain: targetChain,
        targetAddress: targetAddress
    )
    
    crossChainTransactions[txId] = transaction
    artistCrossChainTransactions[artistId] = artistCrossChainTransactions[artistId] ?? []
    artistCrossChainTransactions[artistId]!.append(txId)
    
    emit CrossChainTransactionInitiated(
        txId: txId,
        artistId: artistId,
        amount: amount,
        targetChain: targetChain,
        targetAddress: targetAddress
    )
    
    return txId
}
```

#### 3. Update Cross-Chain Transaction Status

```cadence
pub fun updateCrossChainTransactionStatus(txId: String, status: String) {
    pre {
        crossChainTransactions.containsKey(txId): "Transaction does not exist"
    }
    
    let transaction = crossChainTransactions[txId]!
    transaction.status = status
    
    emit CrossChainTransactionStatusUpdated(
        txId: txId,
        artistId: transaction.artistId,
        status: status
    )
}
```

#### 4. Get Artist by Optimism Address

```cadence
pub fun getArtistByOptimismAddress(optimismAddress: String): Artist? {
    if let artistId = optimismAddressToArtistId[optimismAddress] {
        return artists[artistId]
    }
    
    return nil
}
```

#### 5. Get Cross-Chain Transactions for Artist

```cadence
pub fun getArtistCrossChainTransactions(artistId: String): [CrossChainTransaction] {
    pre {
        artists.containsKey(artistId): "Artist does not exist"
    }
    
    let txIds = artistCrossChainTransactions[artistId] ?? []
    let transactions: [CrossChainTransaction] = []
    
    for txId in txIds {
        if let tx = crossChainTransactions[txId] {
            transactions.append(tx)
        }
    }
    
    return transactions
}
```

## Testing

Several test scripts are provided to verify the functionality:

- `test-flow-artist-fund-action-provider.js`: Tests the basic functionality of the action provider
- `test-flow-artist-fund-action-provider-with-contract.js`: Tests the action provider with the Flow contract
- `test-flow-optimism-interoperability.js`: Tests the cross-chain functionality between Flow and Optimism

### Interoperability Testing

The `test-flow-optimism-interoperability.js` script demonstrates the cross-chain functionality:

```javascript
// Step 1: Register an artist with Optimism address
console.log(`Registering artist ${testArtistId} with Flow address ${FLOW_ACCOUNT_ADDRESS} and Optimism address ${testOptimismAddress}`);

// Step 2: Verify the artist was registered
console.log(`Getting details for artist ${testArtistId}`);

// Step 3: Create and award a grant
console.log(`Creating grant ${grantId} with amount ${grantAmount} FLOW`);
console.log(`Awarding grant ${grantId} to artist ${testArtistId}`);

// Step 4: Initiate a cross-chain transaction
console.log(`Initiating cross-chain transaction for artist ${testArtistId} with amount ${txAmount} FLOW to ${targetChain} address ${testOptimismAddress}`);

// Step 5: Update the transaction status
console.log(`Updating status of transaction ${txId} to "completed"`);

// Step 6: Verify the transaction on Optimism
if (OPTIMISM_CONTRACT_ADDRESS && OPTIMISM_PRIVATE_KEY) {
  console.log('Connecting to Optimism network...');
  // Verify the transaction on Optimism
}
```

## Deployment

To deploy the Flow integration:

1. Configure Flow CLI and create a Flow testnet account
2. Update `flow.json` with account details
3. Run `prepare-flow-contract.js` to prepare the contract
4. Deploy the contract via Flow Port or Flow CLI
5. Update `.env.local` with the deployed contract address

### Environment Variables

Required environment variables:

```
FLOW_ACCOUNT_ADDRESS=0x...
FLOW_PRIVATE_KEY=...
FLOW_CONTRACT_ADDRESS=0x...
OPTIMISM_PRIVATE_KEY=... (for cross-chain functionality)
OPTIMISM_CONTRACT_ADDRESS=0x... (for cross-chain functionality)
```

## AgentKit Integration

The Flow action provider can be integrated with AgentKit to enable AI agents to interact with the Flow blockchain. This integration involves:

1. Creating a custom Flow wallet provider
2. Implementing the Flow action provider
3. Registering both with AgentKit

### Flow Wallet Provider

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
}
```

### Flow Action Provider Factory

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

### Initializing AgentKit with Flow Providers

```javascript
// Initialize the Flow wallet provider
const flowWalletProvider = new FlowWalletProvider();

// Create the action provider factory
const createFlowActionProvider = () => {
  return {
    name: 'flow-artist-fund',
    getActions: () => {
      const provider = new FlowArtistFundActionProvider();
      return provider.getActions();
    }
  };
};

// Initialize AgentKit with the providers
const agentkit = AgentKit.from({
  walletProviders: [flowWalletProvider],
  actionProviderFactories: [createFlowActionProvider]
});

// Execute an action
const result = await agentkit.execute('flowDisburseGrant', {
  artistId: 'artist-123',
  amount: '5.0'
});
```

## Real Implementation Steps

To move from the current simulated implementation to a real Flow blockchain implementation:

1. **Deploy the Contract**:
   - Ensure you have a Flow testnet account with FLOW tokens
   - Run `node scripts/prepare-flow-contract.js` to prepare the contract
   - Deploy via Flow Port: https://testnet.flowscan.org/
   - Update `.env.local` with the deployed contract address

2. **Update FCL Configuration**:
   - Configure FCL with your Flow account details
   - Set up proper authentication with your Flow private key
   - Configure the wallet discovery service

3. **Replace Simulated Transactions**:
   - In `FlowArtistFundActionProvider.ts`, ensure all methods use real FCL transactions
   - Update the Cadence scripts to match your deployed contract
   - Implement proper error handling for blockchain interactions

4. **Test with Real Transactions**:
   - Run the test scripts with real FCL transactions
   - Verify that all actions work correctly with the deployed contract
   - Monitor transaction status on Flow testnet

5. **Implement Cross-Chain Bridge**:
   - For production, implement a secure bridge between Flow and Optimism
   - Consider using a trusted oracle service for cross-chain verification
   - Implement proper security measures for cross-chain transactions

## Production Considerations

For production deployment:

1. Deploy the contract to Flow mainnet
2. Implement proper key management and security
3. Set up monitoring for cross-chain transactions
4. Implement error handling and recovery mechanisms
5. Consider using a bridge service for production cross-chain transfers
6. Implement comprehensive testing for all edge cases
7. Set up proper logging and monitoring for all blockchain interactions

## Future Enhancements

Potential enhancements for the Flow integration:

1. Support for NFT minting on Flow for artist achievements
2. Integration with Flow's fungible token standard
3. Enhanced cross-chain transaction monitoring
4. Support for additional blockchains beyond Optimism
5. Governance mechanisms for grant distribution 