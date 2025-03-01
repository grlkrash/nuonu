# Flow Deployment Plan

This document outlines the steps required to deploy the FlowArtistManager contract to the Flow testnet and make the integration fully functional.

## Current State

- We have a complete Flow contract (`FlowArtistManager.cdc`) with all necessary functionality
- We have a deployment script (`deploy-flow.js`) that simulates deployment
- We have environment variables set up for Flow, but with mock credentials
- We have test scripts that simulate contract interactions

## Deployment Steps

### 1. Set Up a Real Flow Account

1. Create a Flow testnet account:
   - Visit the [Flow Testnet Faucet](https://testnet-faucet.onflow.org/)
   - Create a new account and save the address, private key, and public key

2. Update the `.env.local` file with real credentials:
   ```
   FLOW_ACCOUNT_ADDRESS=0x...  # Your actual Flow address
   FLOW_PRIVATE_KEY=...        # Your actual private key
   FLOW_PUBLIC_KEY=...         # Your actual public key
   ```

### 2. Deploy the FlowArtistManager Contract

#### Option A: Using the Flow CLI

1. Install the Flow CLI:
   ```bash
   brew install flow-cli
   ```

2. Create a `flow.json` configuration file:
   ```json
   {
     "emulators": {
       "default": {
         "port": 3569,
         "serviceAccount": "emulator-account"
       }
     },
     "contracts": {
       "FlowArtistManager": "./src/contracts/flow/FlowArtistManager.cdc"
     },
     "networks": {
       "emulator": "127.0.0.1:3569",
       "testnet": "access.devnet.nodes.onflow.org:9000"
     },
     "accounts": {
       "emulator-account": {
         "address": "f8d6e0586b0a20c7",
         "key": "some-private-key"
       },
       "testnet-account": {
         "address": "YOUR_FLOW_ACCOUNT_ADDRESS",
         "key": "YOUR_FLOW_PRIVATE_KEY"
       }
     },
     "deployments": {
       "testnet": {
         "testnet-account": ["FlowArtistManager"]
       }
     }
   }
   ```

3. Deploy the contract:
   ```bash
   flow project deploy --network=testnet
   ```

#### Option B: Using the Flow Web Interface

1. Visit [Flow Port](https://port.onflow.org/)
2. Connect your wallet
3. Navigate to the "Deploy Contract" section
4. Upload the `FlowArtistManager.cdc` file
5. Deploy the contract

### 3. Update Environment Variables

After deployment, update the `.env.local` file with the contract address:

```
NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=0x...  # The address where the contract is deployed
```

### 4. Update the Action Provider

Modify the `FlowArtistFundActionProvider.ts` file to use real FCL transactions instead of simulations:

1. Replace the simulated transactions with actual FCL transactions
2. Update the error handling to handle real transaction errors
3. Add proper authentication and authorization

### 5. Test the Integration

1. Run the test script with real contract interactions:
   ```bash
   node scripts/test-flow-artist-fund-action-provider-with-contract.js
   ```

2. Verify that all actions work correctly:
   - Artist registration
   - Grant disbursement
   - Cross-chain transactions
   - Artist details retrieval

### 6. Integrate with AgentKit

1. Update the AgentKit integration to use the real Flow action provider
2. Test the integration with the AI agent

## Verification

After completing the deployment, verify the following:

1. The contract is deployed to the Flow testnet
2. The action provider can interact with the contract
3. The AgentKit integration works correctly
4. Cross-chain functionality between Flow and Optimism works as expected

## Troubleshooting

If you encounter issues during deployment or testing:

1. Check the Flow testnet status
2. Verify your account has sufficient FLOW tokens
3. Check the contract code for errors
4. Verify the FCL configuration
5. Check the transaction logs for error messages

## Resources

- [Flow Documentation](https://docs.onflow.org/)
- [FCL Documentation](https://docs.onflow.org/fcl/)
- [Flow Testnet Faucet](https://testnet-faucet.onflow.org/)
- [Flow Port](https://port.onflow.org/) 