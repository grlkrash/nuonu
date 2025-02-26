# Artist Grant AI Agent

An AI-powered platform that helps artists discover and apply for opportunities, including web3 opportunities, DAO proposals, grants, and bounties.

## Features

- **AI-Powered Application Generation**: Generate compelling application content tailored to specific opportunities
- **Multi-Chain Blockchain Integration**: Support for Base (Coinbase L2), zkSync Era, and Flow blockchains
- **Cross-Chain Functionality**: Register artists and distribute funds across multiple blockchains using Chainlink CCIP
- **Opportunity Discovery**: Find relevant opportunities based on artist profiles and preferences
- **Blockchain Wallet Management**: Connect and register blockchain wallets for receiving funds
- **Fund Distribution**: Receive and distribute funds to artists through smart contracts

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **AI**: OpenAI API
- **Blockchain**: Ethers.js, zkSync Web3, Flow Client Library (FCL), Chainlink CCIP
- **Smart Contracts**: Solidity (Base, zkSync), Cadence (Flow)

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn or npm
- Supabase account
- OpenAI API key
- Blockchain wallet (MetaMask for Base/zkSync, Flow wallet for Flow)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/artist-grant-ai-agent.git
   cd artist-grant-ai-agent
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your API keys and configuration.

4. Run the development server:
   ```bash
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file with the following variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Base Blockchain
NEXT_PUBLIC_BASE_RPC_URL=your-base-rpc-url
NEXT_PUBLIC_ARTIST_FUND_MANAGER_ADDRESS=your-base-contract-address

# zkSync Era
NEXT_PUBLIC_ZKSYNC_RPC_URL=your-zksync-rpc-url
NEXT_PUBLIC_ZKSYNC_ARTIST_MANAGER_ADDRESS=your-zksync-contract-address

# Flow Blockchain
NEXT_PUBLIC_FLOW_ACCESS_NODE=your-flow-access-node
NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=your-flow-contract-address

# Private Key (server-side only)
PRIVATE_KEY=your-private-key
```

## Project Structure

```
├── docs/                  # Documentation
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js App Router
│   ├── components/        # React components
│   │   ├── applications/  # Application-related components
│   │   ├── auth/          # Authentication components
│   │   ├── blockchain/    # Blockchain-related components
│   │   ├── layout/        # Layout components
│   │   ├── opportunities/ # Opportunity-related components
│   │   ├── profile/       # Profile-related components
│   │   └── ui/            # UI components
│   ├── lib/               # Utility functions and services
│   │   ├── services/      # Service functions
│   │   └── supabase/      # Supabase client and types
│   └── types/             # TypeScript type definitions
├── .env.example           # Example environment variables
├── .gitignore             # Git ignore file
├── next.config.js         # Next.js configuration
├── package.json           # Package configuration
├── README.md              # Project documentation
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Documentation

For more detailed documentation, see:

- [AI Agent Documentation](docs/ai-agent.md)
- [Blockchain Integration Documentation](docs/blockchain-integration.md)

## Future Enhancements

1. **Bountycaster Integration**: Integration with Bountycaster for bounty applications
2. **DAO Proposal Automation**: Automated DAO proposal applications
3. **Enhanced AI Autonomy**: Improved AI agent autonomy for applying to opportunities
4. **Fund Distribution Dashboard**: Dashboard for monitoring fund distribution

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [OpenAI](https://openai.com/) for the AI capabilities
- [Supabase](https://supabase.io/) for the backend infrastructure
- [Next.js](https://nextjs.org/) for the frontend framework
- [Base](https://base.org/) for the L2 blockchain infrastructure
- [zkSync](https://zksync.io/) for the zkSync Era blockchain
- [Flow](https://flow.com/) for the Flow blockchain
- [Chainlink](https://chain.link/) for the CCIP cross-chain functionality