# Artist Grant AI Agent

A comprehensive platform that helps artists discover grant opportunities, jobs, gigs, and other creative opportunities. It automates the application process for web3 grants, DAO proposals, and bounties via Bountycaster, and manages fund distribution using blockchain technology.

## Project Overview

The Artist Grant AI Agent is designed to simplify the process of finding and applying for funding opportunities for artists. It leverages AI to match artists with relevant opportunities based on their profile, portfolio, and career stage, and facilitates fund distribution through blockchain technology.

## Features

- **AI-Powered Opportunity Discovery**: Find grants, jobs, and gigs tailored to your artistic profile
- **AI Application Generation**: Automatically generate grant applications based on artist profiles and opportunity details
- **Portfolio Management**: Upload and showcase your artistic work
- **Multi-Chain Wallet Integration**: Connect wallets across Base, zkSync, and Flow blockchains
- **Fund Distribution**: Receive grant funds directly through secure blockchain transactions
- **Application Automation**: Streamline the application process with AI assistance

## Technology Stack

- **Frontend**: NextJS, Tailwind CSS, React
- **Backend**: Node.js, Express
- **Database**: Supabase
- **AI**: OpenAI API (GPT-3.5 Turbo)
- **Blockchain**: 
  - Base (Coinbase L2)
  - zkSync Era (transaction layer and SSO SDK)
  - Flow blockchain with Eliza OS
  - Chainlink CCIP (if time permits)

## Smart Contracts

The platform includes several smart contracts for blockchain functionality:

- **FundDistribution.sol**: Manages grant distribution on Base blockchain
- **ZkSyncArtistManager.sol**: Handles artist management and fund distribution on zkSync Era
- **FlowArtistManager.cdc**: Manages artist profiles and fund distribution on Flow blockchain

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Supabase account
- OpenAI API key
- Hardhat for local blockchain development

### Environment Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd artist-grant-ai-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   # API Keys
   OPENAI_API_KEY=your_openai_api_key
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   
   # Blockchain Configuration
   PRIVATE_KEY=your_private_key
   
   # Feature Flags
   NEXT_PUBLIC_ENABLE_FUND_DISTRIBUTION=true
   NEXT_PUBLIC_ENABLE_AUTO_APPLICATIONS=false
   ```

### Database Setup

1. Set up the Supabase database by executing the SQL migration files in the Supabase SQL Editor in this order:
   - `supabase/migrations/20230701000002_add_exec_sql_function.sql`
   - `supabase/migrations/20230701000000_initial_schema.sql`
   - `supabase/migrations/20230701000001_add_tags_to_opportunities.sql`

### Smart Contract Deployment

#### Local Development

1. Start a local Hardhat node:
   ```bash
   npx hardhat node
   ```

2. Deploy the FundDistribution contract:
   ```bash
   npx hardhat run scripts/deploy-local.js --network localhost
   ```

3. Deploy the ZkSyncArtistManager contract:
   ```bash
   npx hardhat run scripts/deploy-zksync-local.js --network localhost
   ```

4. Update the `.env.local` file with the deployed contract addresses:
   ```
   NEXT_PUBLIC_ARTIST_FUND_MANAGER_BASE=<fund_distribution_address>
   NEXT_PUBLIC_ARTIST_FUND_MANAGER_ZKSYNC=<zksync_artist_manager_address>
   ```

#### Testnet Deployment

1. Deploy to Base Sepolia:
   ```bash
   npx hardhat run scripts/deploy-base.js --network baseSepolia
   ```

2. Deploy to zkSync Era Testnet:
   ```bash
   npx hardhat run scripts/deploy-zksync.js --network zkSyncTestnet
   ```

3. Update the `.env.local` file with the deployed contract addresses.

### Testing

1. Test the blockchain integration:
   ```bash
   npx hardhat run scripts/test-blockchain-integration.js --network localhost
   ```

2. Test the fund distribution:
   ```bash
   npx hardhat run scripts/test-fund-distribution.js --network localhost
   ```

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

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

## Project Structure

- `src/app`: Next.js app router pages
  - `dashboard/`: User dashboard
  - `opportunities/`: Opportunity discovery
  - `profile/`: User profile management
  - `onboarding/`: Artist onboarding wizard
  - `wallet/`: Wallet management
- `src/components`: React components
  - `blockchain/`: Blockchain-related components
  - `opportunities/`: Opportunity-related components
  - `profile/`: User profile components
  - `ui/`: UI components
- `src/lib`: Utility functions and services
  - `blockchain/`: Blockchain utilities
  - `services/`: Service functions
  - `supabase/`: Supabase client and utilities
- `src/contracts`: Smart contracts
  - `base/`: Base blockchain contracts
  - `FundDistribution.sol`: Main fund distribution contract
  - `ZkSyncArtistManager.sol`: zkSync Era contract
- `scripts`: Deployment and testing scripts
- `supabase`: Database migrations and schema

## Bounty Submissions

This project is targeting several hackathon bounties:

1. **Base: AI-powered app on Base** - Leveraging Base blockchain for fund distribution
2. **Coinbase Developer Platform: Most Innovative Use of AgentKit** - Using AgentKit for AI-powered opportunity matching
3. **zkSync Era: Build an AI Agent on zkSync Era** - Implementing artist management on zkSync
4. **zkSync: Best Web3 Onboarding UX using zkSync Smart Sign-On (SSO) SDK** - Enhancing onboarding with zkSync SSO
5. **Flow: Best AI Agents** - Integrating with Flow blockchain for artist management
6. **Chainlink CCIP: Best use of Chainlink CCIP** - Enabling cross-chain fund distribution

## License

[MIT](LICENSE)

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenZeppelin](https://openzeppelin.com/)
- [Base](https://base.org/)
- [zkSync Era](https://zksync.io/)
- [Flow](https://flow.com/)
- [Chainlink](https://chain.link/)