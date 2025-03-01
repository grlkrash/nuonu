# Flow Blockchain Integration for Artist Fund

This repository contains the implementation of Flow blockchain integration for the Artist Fund platform, enabling artists to register, receive grants, and initiate cross-chain transactions to Optimism.

## Quick Start

### Prerequisites

- Node.js v16+
- Flow CLI (for deployment)
- Flow testnet account

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` with your Flow account details:
```
FLOW_ACCOUNT_ADDRESS=0x...
FLOW_PRIVATE_KEY=...
FLOW_CONTRACT_ADDRESS=0x... # Will be set after deployment
```

### Deployment

1. Prepare the Flow contract:
```bash
node scripts/prepare-flow-contract.js
```

2. Deploy the contract via Flow Port:
   - Go to [Flow Port](https://testnet.flowscan.org/)
   - Connect your wallet
   - Navigate to "Deploy Contract"
   - Upload the prepared contract from `src/contracts/flow/FlowArtistManager.cdc`
   - Deploy the contract

3. Update `.env.local` with the deployed contract address:
```
FLOW_CONTRACT_ADDRESS=0x...
```

### Testing

Run the test scripts to verify the functionality:

```bash
# Test the Flow Artist Fund Action Provider
node scripts/test-flow-artist-fund-action-provider.js

# Test with contract integration
node scripts/test-flow-artist-fund-action-provider-with-contract.js

# Test Flow-Optimism interoperability
node scripts/test-flow-optimism-interoperability.js
```

## Features

- **Artist Registration**: Register artists with Flow and Optimism addresses
- **Grant Management**: Create and disburse grants to artists
- **Cross-Chain Transactions**: Initiate transactions from Flow to Optimism
- **AgentKit Integration**: Enable AI agents to interact with the Flow blockchain

## Implementation Details

### Smart Contract

The `FlowArtistManager.cdc` contract is located at `src/contracts/flow/FlowArtistManager.cdc` and includes:

- Artist registration and verification
- Grant creation and disbursement
- Cross-chain transaction initiation and status tracking

### Action Provider

The `FlowArtistFundActionProvider` is implemented in `src/providers/flow/FlowArtistFundActionProvider.ts` and provides:

- Methods for interacting with the Flow contract
- Integration with AgentKit for AI agent access

## Cross-Chain Functionality

The implementation supports cross-chain transactions from Flow to Optimism:

1. Artist registers on Flow with both Flow and Optimism addresses
2. Grant is disbursed on Flow
3. Cross-chain transaction is initiated on Flow
4. Funds are received on Optimism

## Documentation

For detailed documentation, see:

- [Flow Integration Guide](docs/FLOW-INTEGRATION.md)
- [Flow Contract Documentation](docs/FLOW-CONTRACT.md)
- [Cross-Chain Implementation](docs/CROSS-CHAIN.md)

## Production Considerations

For production deployment:

1. Deploy the contract to Flow mainnet
2. Implement proper key management and security
3. Set up monitoring for cross-chain transactions
4. Consider using a bridge service for production cross-chain transfers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 