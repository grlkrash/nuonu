# Blockchain Integration Documentation

This document provides an overview of the blockchain integration components in the Artist Grant AI Agent application.

## Supported Blockchains

The application currently supports the following blockchains:

1. **Base (Coinbase L2)** - An Ethereum Layer 2 solution by Coinbase
2. **zkSync Era** - A ZK-rollup Layer 2 solution with account abstraction
3. **Flow** - A developer-friendly blockchain designed for NFTs and games
4. **Cross-chain** - Integration between multiple blockchains using Chainlink CCIP

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

4. **Chainlink CCIP Service** (`src/lib/services/chainlink-ccip.ts`)
   - Enables cross-chain messaging and operations
   - Supports artist registration across multiple blockchains
   - Uses Chainlink's Cross-Chain Interoperability Protocol

### UI Components

1. **Multi-Chain Wallet** (`src/components/blockchain/multi-chain-wallet.tsx`)
   - Main component for managing multiple blockchain wallets
   - Supports connecting to Base, zkSync, and Flow wallets
   - Enables cross-chain functionality
   - Handles wallet registration and session key creation

2. **Blockchain Application Form** (`src/components/blockchain/blockchain-application-form.tsx`)
   - Allows artists to apply for opportunities using their blockchain wallets
   - Supports Base, zkSync, and Flow blockchains
   - Registers the artist's wallet for receiving payments

3. **Wallet Connect** (`src/components/blockchain/wallet-connect.tsx`)
   - Simple component for connecting to Ethereum-compatible wallets
   - Used by other components for wallet connection

4. **Wallet Manager** (`src/components/blockchain/wallet-manager.tsx`)
   - Component for managing a single wallet
   - Displays transaction history
   - Handles wallet registration

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

## Environment Variables

The following environment variables are required for blockchain integration:

- `NEXT_PUBLIC_BASE_RPC_URL` - RPC URL for the Base network
- `NEXT_PUBLIC_ZKSYNC_RPC_URL` - RPC URL for the zkSync Era network
- `NEXT_PUBLIC_ARTIST_FUND_MANAGER_ADDRESS` - Address of the ArtistFundManager contract on Base
- `NEXT_PUBLIC_ZKSYNC_ARTIST_MANAGER_ADDRESS` - Address of the ZkSyncArtistManager contract on zkSync
- `NEXT_PUBLIC_FLOW_ACCESS_NODE` - Access node URL for the Flow network
- `NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS` - Address of the FlowArtistManager contract on Flow
- `PRIVATE_KEY` - Private key for signing transactions (server-side only)

## Future Enhancements

1. **Bountycaster Integration** - Integration with Bountycaster for bounty applications
2. **DAO Proposal Automation** - Automated DAO proposal applications
3. **Enhanced AI Autonomy** - Improved AI agent autonomy for applying to opportunities
4. **Fund Distribution Dashboard** - Dashboard for monitoring fund distribution 