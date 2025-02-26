# Artist Grant AI Agent

A comprehensive platform that helps artists discover, apply for, and manage grants, jobs, and gigs using AI assistance.

## Overview

The Artist Grant AI Agent is designed to simplify the process of finding and applying for funding opportunities for artists. It leverages AI to match artists with relevant opportunities based on their profile, portfolio, and career stage, and facilitates fund distribution through blockchain technology.

## Features

- **AI-Powered Opportunity Discovery**: Find grants, jobs, and gigs tailored to your artistic profile
- **Portfolio Management**: Upload and showcase your artistic work
- **Multi-Chain Wallet Integration**: Connect wallets across Base, zkSync, and Flow blockchains
- **Fund Distribution**: Receive grant funds directly through secure blockchain transactions
- **Application Automation**: Streamline the application process with AI assistance

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase
- **Blockchain**: Base, zkSync Era, Flow
- **AI Integration**: OpenAI, AgentKit

## Smart Contracts

The platform includes several smart contracts for blockchain functionality:

- **FundDistribution.sol**: Manages grant distribution on Base blockchain
- **ZkSyncArtistManager.sol**: Handles artist management and fund distribution on zkSync Era
- **FlowArtistManager.cdc**: Manages artist profiles and fund distribution on Flow blockchain

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
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

4. Set up the database:
   ```bash
   npm run setup-db
   ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Smart Contract Deployment

To deploy the smart contracts to testnets:

1. Set up your wallet and funding:
   ```bash
   # Ensure your .env.local has the necessary private keys and RPC URLs
   ```

2. Compile the contracts:
   ```bash
   npm run compile
   ```

3. Deploy to Base Goerli testnet:
   ```bash
   npm run deploy:base
   ```

4. Deploy to zkSync Era testnet:
   ```bash
   npm run deploy:zksync
   ```

## Project Structure

```
├── src/
│   ├── app/                  # Next.js app router pages
│   │   ├── dashboard/        # User dashboard
│   │   ├── opportunities/    # Opportunity discovery
│   │   ├── profile/          # User profile management
│   │   ├── onboarding/       # Artist onboarding wizard
│   │   └── wallet/           # Wallet management
│   ├── components/           # React components
│   │   ├── blockchain/       # Blockchain-related components
│   │   ├── opportunities/    # Opportunity-related components
│   │   ├── profile/          # User profile components
│   │   └── ui/               # UI components
│   ├── contracts/            # Smart contracts
│   │   ├── base/             # Base blockchain contracts
│   │   ├── FundDistribution.sol  # Main fund distribution contract
│   │   ├── ZkSyncArtistManager.sol # zkSync Era contract
│   │   └── FlowArtistManager.cdc # Flow blockchain contract
│   ├── lib/                  # Utility functions and libraries
│   │   ├── blockchain/       # Blockchain utilities
│   │   ├── services/         # Service functions
│   │   └── supabase/         # Supabase client and utilities
│   └── types/                # TypeScript type definitions
├── scripts/                  # Deployment and utility scripts
├── supabase/                 # Supabase migrations
└── test/                     # Tests for smart contracts
```

## Key Components

### AI Opportunity Finder

The AI Opportunity Finder component helps artists discover relevant opportunities based on their profile, interests, and career stage. It uses OpenAI to analyze opportunities and match them with artist profiles.

### Artist Onboarding Wizard

The Artist Onboarding Wizard guides users through the process of creating a comprehensive profile, including personal information, artistic discipline, portfolio, and wallet connection.

### Multi-Chain Wallet Integration

The wallet integration components provide a seamless experience for connecting to multiple blockchains:
- Base (Coinbase L2)
- zkSync Era (with session key support)
- Flow blockchain

### Fund Distribution System

The Fund Distribution System enables secure and transparent grant allocation and distribution across multiple blockchains, with transaction tracking and verification.

## Bounty Submissions

This project is targeting several hackathon bounties:

1. **Base: AI-powered app on Base** - Leveraging Base blockchain for fund distribution
2. **Coinbase Developer Platform: Most Innovative Use of AgentKit** - Using AgentKit for AI-powered opportunity matching
3. **zkSync Era: Build an AI Agent on zkSync Era** - Implementing artist management on zkSync
4. **zkSync: Best Web3 Onboarding UX using zkSync Smart Sign-On (SSO) SDK** - Enhancing onboarding with zkSync SSO
5. **Flow: Best AI Agents** - Integrating with Flow blockchain for artist management
6. **Chainlink CCIP: Best use of Chainlink CCIP** - Enabling cross-chain fund distribution

To prepare bounty submissions:
```bash
npm run prepare-bounty
# or for a specific bounty
npm run prepare-bounty base
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenZeppelin](https://openzeppelin.com/)
- [Base](https://base.org/)
- [zkSync Era](https://zksync.io/)
- [Flow](https://flow.com/)
- [Chainlink](https://chain.link/)