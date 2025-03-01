# Flow Blockchain Deployment and Integration Guide

This guide provides instructions for deploying the FlowArtistManager contract to the Flow blockchain and integrating it with the AgentKit framework.

## Prerequisites

- Flow CLI installed (https://docs.onflow.org/flow-cli/install/)
- Flow account with sufficient FLOW tokens for deployment
- Flow account private key
- Node.js and npm installed

## Environment Setup

1. Create or update your `.env.local` file with the following Flow-specific variables:

```
# Flow Configuration
FLOW_ACCOUNT_ADDRESS=0x...
FLOW_PRIVATE_KEY=...
FLOW_PUBLIC_KEY=...
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
NEXT_PUBLIC_FLOW_WALLET_DISCOVERY=https://fcl-discovery.onflow.org/testnet/authn
NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=0x...
```

## Contract Deployment

### Option 1: Using the Flow CLI

1. Log in to your Flow account:

```bash
flow accounts login
```

2. Deploy the contract:

```bash
flow project deploy --network=testnet
```

### Option 2: Using the Deployment Script

1. Run the deployment script:

```bash
node scripts/deploy-flow.js
```

This script will:
- Configure FCL for the Flow testnet
- Simulate the deployment of the FlowArtistManager contract
- Update the `.env.local` file with the contract address
- Test the contract functionality

**Note:** The deployment script currently simulates deployment. For actual deployment, you need to use the Flow CLI or web interface.

## Contract Features

The FlowArtistManager contract provides the following features:

1. **Artist Management**
   - Register artists with Flow and Optimism addresses
   - Verify artist identities
   - Retrieve artist details

2. **Grant Management**
   - Create grants with titles and amounts
   - Award grants to artists
   - Distribute funds to artists

3. **Cross-Chain Functionality**
   - Register artists with Optimism addresses
   - Initiate cross-chain transactions to Optimism
   - Track cross-chain transaction status
   - Look up artists by their Optimism address

## Testing the Integration

### Basic Testing

Run the Flow integration test script:

```bash
node scripts/test-flow-integration.js
```

This script simulates interactions with the FlowArtistManager contract, including:
- Artist registration
- Checking if an artist is registered
- Receiving funds
- Checking pending funds
- Distributing funds
- Getting total funds received

### Testing Optimism Interoperability

Run the Flow-Optimism interoperability test script:

```bash
node scripts/test-flow-optimism-interop.js
```

This script tests the cross-chain functionality, including:
- Registering an artist with an Optimism address
- Initiating a cross-chain transaction
- Updating transaction status
- Getting artist by Optimism address
- Getting cross-chain transaction details

### Testing the Action Provider

Run the Flow Artist Fund Action Provider test script:

```bash
node scripts/test-flow-artist-fund-action-provider.js
```

This script tests the AgentKit integration with the Flow blockchain, including:
- Initializing the CDP Wallet Provider
- Configuring FCL for Flow testnet
- Testing the flowDisburseGrant action
- Testing the flowGetArtistDetails action

For more comprehensive testing with contract integration:

```bash
node scripts/test-flow-artist-fund-action-provider-with-contract.js
```

This script tests:
- Artist registration
- Getting artist details
- Disbursing grants
- Initiating cross-chain transactions
- AgentKit integration

## AgentKit Integration

The Flow Artist Fund Action Provider (`FlowArtistFundActionProvider.ts`) integrates the FlowArtistManager contract with the AgentKit framework, providing the following actions:

1. `flowDisburseGrant`: Disburse funds to an artist from the Flow grant fund
2. `flowGetArtistDetails`: Get details about an artist from the Flow contract
3. `flowRegisterArtist`: Register an artist with the Flow contract
4. `flowInitiateCrossChainTransaction`: Initiate a cross-chain transaction to Optimism

To use these actions in your application:

```javascript
import { AgentKit } from '@coinbase/agentkit';
import { FlowArtistFundActionProvider } from '../lib/blockchain/action-providers';

// Initialize AgentKit with the Flow action provider
const agentkit = new AgentKit();
agentkit.registerActionProvider('flowArtistFundActionProvider', new FlowArtistFundActionProvider());

// Execute actions
const result = await agentkit.execute('flowDisburseGrant', {
  artistId: 'artist-123',
  amount: '5.0'
});
```

## Troubleshooting

### Common Issues

1. **FCL Authentication Errors**
   - Ensure your Flow account address and private key are correctly set in the environment variables
   - Check that you're using the correct network (testnet or mainnet)

2. **Contract Deployment Failures**
   - Verify you have sufficient FLOW tokens for deployment
   - Check that your account has the correct keys configured

3. **Transaction Errors**
   - Ensure the contract is correctly deployed and the address is set in the environment variables
   - Check that you're using the correct contract methods and parameters

### Debugging

For detailed debugging, add the following to your scripts:

```javascript
fcl.config().put('debug.accounts', true);
```

This will enable detailed logging of FCL operations.

## Resources

- [Flow Documentation](https://docs.onflow.org/)
- [FCL Documentation](https://docs.onflow.org/fcl/)
- [Cadence Language Reference](https://docs.onflow.org/cadence/language/)
- [Flow Testnet Faucet](https://testnet-faucet.onflow.org/) 