# Artist Grant AI Agent

A comprehensive platform that helps artists discover, apply for, and manage grants, jobs, and gigs using AI assistance.

## Overview

The Artist Grant AI Agent is designed to simplify the process of finding and applying for funding opportunities for artists. It leverages AI to match artists with relevant opportunities based on their profile, portfolio, and career stage.

## Features

- **AI-Powered Opportunity Discovery**: Find grants, jobs, and gigs tailored to your artistic profile
- **Portfolio Management**: Upload and showcase your artistic work
- **Simplified Wallet Connection**: Easily connect your blockchain wallet for receiving payments
- **DAO Proposal System**: Create and vote on community proposals
- **Fund Distribution Dashboard**: Track and manage grant distributions
- **Application Automation**: Streamline the application process with AI assistance

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Supabase, GraphQL, Genql
- **Blockchain**: Ethereum, Base, zkSync, Flow
- **AI Integration**: AgentKit, OpenAI, Anthropic

## Smart Contracts

The platform includes several smart contracts for blockchain functionality:

- **FundDistribution.sol**: Manages grant distribution on the blockchain
- **ArtistNFT.sol**: Allows artists to mint and manage their NFTs
- **ArtistDAO.sol**: Enables community governance through proposals and voting
- **ArtistToken.sol**: Governance token for the DAO

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Wallet (MetaMask, Coinbase Wallet, etc.)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/artist-grant-ai-agent.git
   cd artist-grant-ai-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your API keys and configuration.

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Smart Contract Deployment

To deploy the smart contracts to a testnet or mainnet:

1. Set up your wallet and funding:
   ```bash
   cp .env.contracts.example .env.contracts
   ```
   Edit `.env.contracts` with your wallet private key and RPC URLs.

2. Compile the contracts:
   ```bash
   npx hardhat compile
   ```

3. Deploy to testnet:
   ```bash
   npx hardhat run scripts/deploy.js --network baseGoerli
   ```

## Project Structure

```
├── src/
│   ├── app/                  # Next.js app router pages
│   ├── components/           # React components
│   │   ├── blockchain/       # Blockchain-related components
│   │   ├── dao/              # DAO-related components
│   │   ├── opportunities/    # Opportunity-related components
│   │   ├── profile/          # User profile components
│   │   └── ui/               # UI components (Shadcn)
│   ├── contracts/            # Smart contracts
│   ├── lib/                  # Utility functions and libraries
│   └── styles/               # Global styles
├── public/                   # Static assets
├── scripts/                  # Deployment and utility scripts
└── test/                     # Tests for smart contracts and components
```

## Key Components

### AI Opportunity Finder

The AI Opportunity Finder component helps artists discover relevant opportunities based on their profile, interests, and career stage. It provides personalized recommendations and allows for advanced searching.

### Portfolio Upload

The Portfolio Upload component allows artists to showcase their work through a drag-and-drop interface. It supports various file types and provides visual feedback during the upload process.

### Wallet Connection

The Wallet Connection component simplifies the process of connecting blockchain wallets. It prioritizes user experience while maintaining compatibility with multiple blockchain networks.

### DAO Proposal System

The DAO Proposal System enables community governance through a proposal and voting mechanism. Artists can create proposals for funding, community initiatives, and platform changes.

### Fund Distribution Dashboard

The Fund Distribution Dashboard provides transparency in grant allocation and distribution. It tracks funds, approvals, and payments on the blockchain.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [OpenZeppelin](https://openzeppelin.com/)
- [AgentKit](https://agentkit.ai/)