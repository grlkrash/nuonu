# Blockchain Integration Documentation

This document provides an overview of the blockchain integration components in the Artist Grant AI Agent application.

## Supported Blockchains

The application currently supports the following blockchains:

1. **Base (Coinbase L2)** - An Ethereum Layer 2 solution by Coinbase
2. **zkSync Era** - A ZK-rollup Layer 2 solution with account abstraction
3. **Flow** - A developer-friendly blockchain designed for NFTs and games
4. **Optimism** - An Ethereum Layer 2 solution with Superchain interoperability
5. **Cross-chain** - Integration between multiple blockchains using Chainlink CCIP

## AgentKit Integration

The application integrates with Coinbase's AgentKit to enable AI agents to perform on-chain actions. The integration is implemented through custom action providers for each supported blockchain.

### Action Providers

1. **Base Action Provider** (`src/lib/blockchain/action-providers/ArtistFundActionProvider.ts`)
   - Implements standard AgentKit action provider interface
   - Provides actions for artist registration, grant disbursement, and artist details retrieval
   - Integrated with the Base blockchain

2. **zkSync Action Provider** (`src/lib/blockchain/action-providers/ZkSyncArtistFundActionProvider.ts`)
   - Custom implementation for zkSync Era blockchain
   - Provides actions for grant disbursement and artist details retrieval
   - Successfully deployed and tested on zkSync Era Sepolia testnet
   - Integrated with zkSync Smart Sign-On (SSO) SDK for improved user experience

3. **Flow Action Provider** (`src/lib/blockchain/action-providers/FlowArtistFundActionProvider.ts`)
   - Custom implementation for Flow blockchain
   - Provides actions for artist registration, grant disbursement, and artist details retrieval
   - Uses Flow Client Library (FCL) for blockchain interaction
   - Implements Cadence transactions for contract interaction

4. **Optimism Interop Action Provider** (`src/lib/blockchain/action-providers/OptimismInteropActionProvider.ts`)
   - Enables cross-chain functionality between Base and Optimism
   - Provides actions for L1 block information, system configuration, and token bridging
   - Integrates with Optimism Superchain predeploys for interoperability
   - Supports aggregated balance viewing and cross-chain token transfers

### Integration Status

| Blockchain | Contract Deployment | Action Provider | AgentKit Integration | Testing Status |
|------------|---------------------|-----------------|----------------------|---------------|
| Base       | ✅ Completed        | ✅ Completed    | ✅ Completed         | ✅ Verified   |
| zkSync Era | ✅ Completed        | ✅ Completed    | ✅ Completed         | ✅ Verified   |
| Flow       | ✅ Completed        | ✅ Completed    | ⚠️ Partial          | 🔄 In Progress|
| Optimism   | ✅ Completed        | ✅ Completed    | ✅ Completed         | ✅ Verified   |
| Cross-chain| 🔄 In Progress     | ✅ Completed    | ✅ Completed         | 🔄 In Progress|

### Implementation Notes

#### zkSync Era Integration

The zkSync Era integration has been successfully implemented and tested with the following components:

- **Smart Contract**: `ZkSyncArtistManager.sol` deployed to zkSync Era Sepolia testnet at address `0x0bd1ec565684D5043D0c9aC2835a84A52Ef1Ee41`
- **Action Provider**: `ZkSyncArtistFundActionProvider.ts` implements the AgentKit action provider interface
- **Wallet Provider**: Custom wallet provider implementation for zkSync Era
- **SSO Integration**: zkSync Smart Sign-On SDK integrated for improved user experience

The zkSync integration supports:
- Grant disbursement to artists
- Artist details retrieval
- Session key management for improved UX

#### Flow Integration

The Flow blockchain integration is implemented with the following components:

- **Smart Contract**: `FlowArtistManager.cdc` deployed to Flow testnet at address `0x28736dfc4d9e84c6`
- **Action Provider**: `FlowArtistFundActionProvider.ts` implements a custom action provider for Flow
- **FCL Integration**: Uses Flow Client Library for blockchain interaction

The Flow integration supports:
- Artist registration
- Grant disbursement
- Artist details retrieval
- Cross-chain transaction initiation

**Note**: The Flow integration with AgentKit is partial because AgentKit primarily supports EVM-compatible chains. Our implementation uses a custom approach to integrate Flow with the agent system.

#### Optimism Interop Integration

The Optimism Superchain interoperability integration is implemented with the following components:

- **Predeploys**: Integration with Optimism's standard predeploys for interoperability
  - `L1BlockNumber` (0x4200000000000000000000000000000000000013)
  - `L1BlockAttributes` (0x4200000000000000000000000000000000000015)
  - `SystemConfig` (0x4200000000000000000000000000000000000010)
  - `L2ToL1MessagePasser` (0x4200000000000000000000000000000000000016)
  - `SuperchainTokenBridge` (0x4200000000000000000000000000000000000028)
- **Action Provider**: `OptimismInteropActionProvider.ts` implements the AgentKit action provider interface
- **Cross-Chain Operations**: Supports bridging tokens between Base and Optimism

The Optimism interop integration supports:
- Retrieving L1 block information
- Viewing system configuration
- Initiating withdrawals from L2 to L1
- Bridging tokens between chains
- Viewing aggregated balances across chains

## Core Components

### Blockchain Services

1. **Base Blockchain Service** (`src/lib/services/blockchain.ts`)
   - Handles interactions with the Base blockchain
   - Manages artist registration, grant reception, and fund distribution
   - Uses the `ArtistFundManager` smart contract

2. **zkSync Blockchain Service** (`src/lib/services/zksync-blockchain.ts`)
   - Handles interactions with the zkSync Era blockchain
   - Manages artist registration, session keys, and fund distribution
   - Uses the `ZkSyncArtistManager` smart contract

3. **Flow Blockchain Service** (`src/lib/services/flow-blockchain.ts`)
   - Handles interactions with the Flow blockchain
   - Manages artist registration and fund distribution
   - Uses the `FlowArtistManager` smart contract

4. **Optimism Blockchain Service** (`src/lib/services/optimism-blockchain.ts`)
   - Handles interactions with the Optimism blockchain
   - Manages interoperability with Base and other chains
   - Uses Optimism's predeploys for cross-chain functionality

5. **Chainlink CCIP Service** (`src/lib/services/chainlink-ccip.ts`)
   - Enables cross-chain messaging and operations
   - Supports artist registration across multiple blockchains
   - Uses Chainlink's Cross-Chain Interoperability Protocol

### UI Components

1. **Multi-Chain Wallet** (`src/components/blockchain/multi-chain-wallet.tsx`)
   - Main component for managing multiple blockchain wallets
   - Supports connecting to Base, zkSync, Flow, and Optimism wallets
   - Enables cross-chain functionality
   - Handles wallet registration and session key creation

2. **Blockchain Application Form** (`src/components/blockchain/blockchain-application-form.tsx`)
   - Allows artists to apply for opportunities using their blockchain wallets
   - Supports Base, zkSync, Flow, and Optimism blockchains
   - Registers the artist's wallet for receiving payments

3. **Wallet Connect** (`src/components/blockchain/wallet-connect.tsx`)
   - Simple component for connecting to Ethereum-compatible wallets
   - Used by other components for wallet connection

4. **Wallet Manager** (`src/components/blockchain/wallet-manager.tsx`)
   - Component for managing a single wallet
   - Displays transaction history
   - Handles wallet registration

5. **Balance Aggregator** (`src/components/blockchain/balance-aggregator.tsx`)
   - Displays aggregated balances across multiple chains
   - Shows ETH and ERC20 token balances
   - Provides options for cross-chain transfers

## Smart Contracts

1. **ArtistFundManager** (Base)
   - Manages artist registration and fund distribution on Base
   - Supports receiving grants and distributing funds to artists

2. **ZkSyncArtistManager** (zkSync Era)
   - Manages artist registration and fund distribution on zkSync
   - Supports session keys for improved UX
   - Handles account abstraction features

3. **FlowArtistManager** (Flow)
   - Manages artist registration and fund distribution on Flow
   - Implemented in Cadence, Flow's smart contract language

## Integration Flow

1. **Artist Registration**
   - Artists connect their wallet(s) using the Multi-Chain Wallet component
   - They register their wallet address on one or more blockchains
   - For cross-chain registration, the Chainlink CCIP service is used

2. **Opportunity Application**
   - Artists apply for blockchain-related opportunities using the Blockchain Application Form
   - The form registers their wallet for receiving payments if accepted

3. **Fund Distribution**
   - When an application is accepted, funds are distributed to the artist's registered wallet
   - The distribution is handled by the appropriate blockchain service
   - For cross-chain distributions, the Chainlink CCIP service is used

4. **Cross-Chain Operations**
   - Artists can view their aggregated balance across multiple chains
   - They can bridge tokens between chains using the Optimism interop functionality
   - The system supports withdrawals from L2 to L1 chains

## Environment Variables

The following environment variables are required for blockchain integration:

- `NEXT_PUBLIC_BASE_RPC_URL` - RPC URL for the Base network
- `NEXT_PUBLIC_ZKSYNC_RPC_URL` - RPC URL for the zkSync Era network
- `NEXT_PUBLIC_OPTIMISM_RPC_URL` - RPC URL for the Optimism network
- `NEXT_PUBLIC_ARTIST_FUND_MANAGER_ADDRESS` - Address of the ArtistFundManager contract on Base
- `NEXT_PUBLIC_ZKSYNC_ARTIST_MANAGER_ADDRESS` - Address of the ZkSyncArtistManager contract on zkSync
- `NEXT_PUBLIC_FLOW_ACCESS_NODE` - Access node URL for the Flow network
- `NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS` - Address of the FlowArtistManager contract on Flow
- `PRIVATE_KEY` - Private key for signing transactions (server-side only)
- `ZKSYNC_PRIVATE_KEY` - Private key for signing zkSync transactions
- `FLOW_PRIVATE_KEY` - Private key for signing Flow transactions
- `FLOW_ACCOUNT_ADDRESS` - Flow account address

## Testing

To test the blockchain integration, use the following scripts:

1. **zkSync Integration Test**:
   ```bash
   node scripts/test-zksync-simple.js
   ```

2. **Flow Integration Test**:
   ```bash
   node scripts/test-flow-simple.js
   ```

3. **Optimism Interop Test**:
   ```bash
   node scripts/test-optimism-real.js
   ```

4. **AgentKit Integration Test**:
   ```bash
   node scripts/test-zksync-agentkit.js
   ```

## Future Enhancements

1. **Bountycaster Integration** - Integration with Bountycaster for bounty applications
2. **DAO Proposal Automation** - Automated DAO proposal applications
3. **Enhanced AI Autonomy** - Improved AI agent autonomy for applying to opportunities
4. **Fund Distribution Dashboard** - Dashboard for monitoring fund distribution
5. **Complete Flow Integration** - Enhance Flow integration with AgentKit
6. **Cross-Chain Transaction Monitoring** - Implement monitoring for cross-chain transactions 