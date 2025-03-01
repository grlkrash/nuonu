# Artist Fund Manager

This project implements a multi-chain artist fund management system with AI agent integration. It allows artists to receive grants and funding across multiple blockchain networks, including Base, zkSync, and Flow.

## Features

- **Multi-chain Support**: Manage artist funds across Base, zkSync, and Flow blockchains
- **AI Agent Integration**: Autonomous wallet creation and fund management via AI agent
- **Optimism Interoperability**: Leverage Optimism predeploys for cross-chain functionality
- **Aggregated Balances**: View combined artist balances across all supported chains

## Architecture

The system consists of the following components:

### Smart Contracts

- **BaseArtistFundManager.sol**: Main contract on Base for managing artist funds
- **ZkSyncArtistManager.sol**: Contract on zkSync for managing artist funds
- **FlowArtistManager.cdc**: Contract on Flow for managing artist funds

### Action Providers

- **ArtistFundActionProvider**: Handles Base blockchain interactions
- **ZkSyncArtistFundActionProvider**: Handles zkSync blockchain interactions
- **FlowArtistFundActionProvider**: Handles Flow blockchain interactions
- **OptimismInteropActionProvider**: Handles Optimism predeploy interactions

### Wallet Management

- **CdpWalletManager**: Singleton for managing CDP wallet providers

## Setup and Deployment

### Prerequisites

- Node.js v16+
- Yarn or npm
- Access to Base, zkSync, and Flow testnets
- Environment variables set up in `.env.local`

### Environment Variables

Create a `.env.local` file with the following variables:

```
# Base Configuration
NEXT_PUBLIC_BASE_RPC_URL=https://goerli.base.org
BASE_PRIVATE_KEY=your_private_key
NEXT_PUBLIC_ARTIST_FUND_MANAGER_ADDRESS=deployed_contract_address

# zkSync Configuration
NEXT_PUBLIC_ZKSYNC_RPC_URL=https://testnet.era.zksync.dev
ZKSYNC_PRIVATE_KEY=your_private_key
NEXT_PUBLIC_ZKSYNC_ARTIST_MANAGER_ADDRESS=deployed_contract_address

# Flow Configuration
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
FLOW_ACCOUNT_ADDRESS=your_flow_address
FLOW_PRIVATE_KEY=your_private_key
FLOW_PUBLIC_KEY=your_public_key
NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=deployed_contract_address

# CDP Wallet Configuration
CDP_API_KEY_NAME=your_cdp_api_key_name
CDP_API_KEY_PRIVATE_KEY=your_cdp_api_key_private_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Deployment

Deploy the contracts to their respective networks:

```bash
# Deploy to Base
npm run deploy:base

# Deploy to zkSync
npm run deploy:zksync

# Deploy to Flow
npm run deploy:flow
```

## Testing

Run the following commands to test the implementation:

```bash
# Test Base implementation
npm run test:artist-fund-action

# Test zkSync implementation
npm run test:zksync-artist-fund-action

# Test Flow implementation
npm run test:flow-artist-fund-action

# Test Optimism interoperability
npm run test:optimism-interop

# Test Optimism interop action provider
npm run test:optimism-interop-action
```

## Optimism Interoperability

This project leverages Optimism predeploys for cross-chain functionality:

- **L1BlockNumber**: Access L1 block number from L2
- **L1BlockAttributes**: Access L1 block attributes from L2
- **SystemConfig**: Access system configuration parameters
- **L2ToL1MessagePasser**: Initiate withdrawals from L2 to L1
- **OptimismMintableERC20Factory**: Create L2 representations of L1 tokens
- **OptimismPortal**: Finalize withdrawal transactions

## AI Agent Integration

The AI agent can perform the following actions:

1. Create wallets for artists automatically upon signup
2. Disburse grants to artists across multiple chains
3. Retrieve artist details and funding information
4. Initiate withdrawals from L2 to L1
5. Get aggregated balances across all supported chains

## Database Schema

The Supabase database includes the following tables:

- **artists**: Stores artist information
- **wallets**: Stores wallet information for artists
- **grants**: Stores grant information
- **withdrawals**: Stores withdrawal information

## License

This project is licensed under the MIT License - see the LICENSE file for details. 