# Nuonu

Nuonu is a platform connecting artists with opportunities, built with Next.js, Supabase, and Ethereum smart contracts.

## Features

- User authentication and profile management
- Opportunity creation and browsing
- Application submission and tracking
- Smart contract integration for secure transactions
- Responsive UI with dark mode support

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Blockchain**: Ethereum/Base, Hardhat, Solidity
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Metamask or another Ethereum wallet

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nuonu.git
   cd nuonu
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_KEY=your-supabase-service-key
   
   NEXT_PUBLIC_NETWORK_ID=31337
   NEXT_PUBLIC_RPC_URL=http://localhost:8545
   
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # For contract verification
   ETHERSCAN_API_KEY=your-etherscan-api-key
   PRIVATE_KEY=your-private-key
   ```

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL migration script in `supabase/migrations/20230701000000_initial_schema.sql` in the Supabase SQL editor
3. Configure authentication providers in the Supabase dashboard

### Smart Contract Development

1. Compile the smart contracts:
   ```bash
   npx hardhat compile
   ```

2. Run tests:
   ```bash
   npx hardhat test
   ```

3. Deploy to local network:
   ```bash
   npx hardhat node
   npx hardhat run scripts/deploy.ts --network localhost
   ```

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
nuonu/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app router pages
│   ├── components/      # React components
│   │   ├── auth/        # Authentication components
│   │   ├── layout/      # Layout components
│   │   └── ui/          # UI components
│   ├── contracts/       # Smart contract source files
│   ├── lib/             # Utility functions and shared code
│   │   ├── auth/        # Authentication utilities
│   │   └── supabase/    # Supabase client and types
│   └── middleware.ts    # Next.js middleware for auth protection
├── supabase/            # Supabase configuration and migrations
├── test/                # Smart contract tests
├── scripts/             # Deployment and utility scripts
├── hardhat.config.ts    # Hardhat configuration
└── next.config.js       # Next.js configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Hardhat](https://hardhat.org/)
- [Tailwind CSS](https://tailwindcss.com/)