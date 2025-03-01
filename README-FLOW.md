# Flow Blockchain Integration

This document provides an overview of the Flow blockchain integration for the Artist Fund platform. The integration enables artists to register, receive grants, and initiate cross-chain transactions between Flow and Optimism.

## Components

The Flow integration consists of the following components:

1. **Flow Contract**: `FlowArtistManager.cdc` - A Cadence smart contract that manages artists, grants, and cross-chain transactions.
2. **Flow Action Provider**: `FlowArtistFundActionProvider.ts` - An AgentKit action provider that enables AI agents to interact with the Flow blockchain.
3. **Test Scripts**: Various scripts to test the Flow integration, including real transactions and AgentKit integration.
4. **Documentation**: Comprehensive documentation for the Flow integration, including deployment instructions and usage guidelines.

## Setup

### Prerequisites

- Flow CLI installed
- Flow account with testnet FLOW tokens
- Node.js and npm installed

### Environment Variables

Add the following environment variables to your `.env.local` file:

```
# Flow Configuration
FLOW_ACCOUNT_ADDRESS=0x...
FLOW_PRIVATE_KEY=...
NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
NEXT_PUBLIC_FLOW_WALLET_DISCOVERY=https://fcl-discovery.onflow.org/testnet/authn
```

## Deployment

### 1. Deploy the Flow Contract

The `FlowArtistManager.cdc` contract can be deployed using the Flow CLI or Flow Port:

```bash
# Prepare the contract for deployment
node scripts/prepare-flow-contract.js

# Deploy using Flow CLI
flow project deploy --network=testnet
```

Alternatively, you can deploy the contract using Flow Port:
1. Go to [Flow Port](https://testnet.flowscan.org/)
2. Connect your wallet
3. Navigate to the "Deploy Contract" section
4. Upload the `FlowArtistManager.cdc` file
5. Deploy the contract

### 2. Update Environment Variables

After deploying the contract, update your `.env.local` file with the contract address:

```
NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=0x...
```

## Testing

### Test Real Transactions

To test real transactions with the Flow contract:

```bash
node scripts/test-flow-real-transactions.js
```

This script will:
1. Register an artist
2. Get artist details
3. Disburse a grant
4. Initiate a cross-chain transaction
5. Get cross-chain transactions for the artist

### Test AgentKit Integration

To test the AgentKit integration with the Flow action provider:

```bash
node scripts/test-flow-agentkit-integration.js
```

This script will:
1. Initialize AgentKit with the Flow wallet and action provider
2. Register an artist using AgentKit
3. Get artist details using AgentKit
4. Disburse a grant using AgentKit
5. Initiate a cross-chain transaction using AgentKit

## Flow Action Provider

The `FlowArtistFundActionProvider` provides the following actions:

1. `flowRegisterArtist`: Register an artist with the Flow contract
2. `flowGetArtistDetails`: Get details about an artist from the Flow contract
3. `flowDisburseGrant`: Disburse funds to an artist from the Flow grant fund
4. `flowInitiateCrossChainTransaction`: Initiate a cross-chain transaction to Optimism

## Cross-Chain Functionality

The Flow integration supports cross-chain transactions to Optimism. The process works as follows:

1. An artist is registered on Flow with an Optimism address
2. A cross-chain transaction is initiated on Flow
3. The transaction is recorded on the Flow blockchain
4. A relayer (simulated in the current implementation) monitors for cross-chain transactions
5. The relayer executes the corresponding transaction on Optimism

## Production Considerations

For production use:

1. Deploy the `FlowArtistManager` contract to Flow mainnet
2. Update the `.env.local` file with the mainnet contract address
3. Implement proper key management and security
4. Set up a secure relayer for cross-chain transactions
5. Implement proper error handling and monitoring

## Additional Resources

- [Flow Documentation](https://docs.onflow.org/)
- [Cadence Documentation](https://docs.onflow.org/cadence/)
- [Flow FCL Documentation](https://docs.onflow.org/fcl/)
- [AgentKit Documentation](https://docs.agentkit.ai/)

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure your Flow account address and private key are correctly set in the `.env.local` file.
2. **Contract Not Found**: Verify that the contract address is correctly set in the `NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS` environment variable.
3. **Transaction Errors**: Check the transaction logs for specific error messages. Common issues include insufficient funds or incorrect parameters.

### Getting Help

If you encounter issues with the Flow integration, please:

1. Check the Flow documentation
2. Review the error messages in the console
3. Verify your environment variables
4. Contact the development team for assistance 