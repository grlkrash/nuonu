# Deployment Guide

This guide outlines the steps to deploy the Artist Grant AI Agent application to production.

## Prerequisites

- Node.js 18.x or later
- Vercel CLI installed (`npm i -g vercel`)
- Supabase account
- OpenAI API key
- Coinbase Developer Platform account
- Base testnet setup
- zkSync Era testnet setup
- Flow testnet setup

## Environment Variables

Create a `.env.local` file with the following variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Blockchain - Base
NEXT_PUBLIC_BASE_RPC_URL=your_base_rpc_url
NEXT_PUBLIC_BASE_CHAIN_ID=84531

# Blockchain - zkSync Era
NEXT_PUBLIC_ZKSYNC_RPC_URL=your_zksync_rpc_url
NEXT_PUBLIC_ZKSYNC_CHAIN_ID=280

# Blockchain - Flow
NEXT_PUBLIC_FLOW_ACCESS_NODE=your_flow_access_node
NEXT_PUBLIC_FLOW_NETWORK=testnet

# Coinbase Developer Platform
COINBASE_API_KEY=your_coinbase_api_key

# Application
NEXT_PUBLIC_APP_URL=your_app_url
```

## Database Setup

1. Create a new Supabase project
2. Run the database setup script:

```bash
npm run setup:db
```

This will create the necessary tables and seed initial data.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Production Deployment with Vercel

1. Push your code to a GitHub repository

2. Connect your repository to Vercel:

```bash
vercel link
```

3. Add environment variables to Vercel:

```bash
vercel env add
```

4. Deploy to production:

```bash
vercel --prod
```

## Smart Contract Deployment

### Base Testnet

1. Deploy the smart contracts to Base testnet:

```bash
npm run deploy:base
```

2. Verify the contracts on Base testnet:

```bash
npm run verify:base
```

### zkSync Era Testnet

1. Deploy the smart contracts to zkSync Era testnet:

```bash
npm run deploy:zksync
```

2. Verify the contracts on zkSync Era testnet:

```bash
npm run verify:zksync
```

### Flow Testnet

1. Deploy the smart contracts to Flow testnet:

```bash
npm run deploy:flow
```

## Post-Deployment Verification

After deployment, verify the following:

1. Authentication flow works correctly
2. Onboarding process completes successfully
3. Dashboard displays user information correctly
4. Wallet connections work for all supported blockchains
5. AI agent functionality works as expected
6. Opportunity matching and application submission work correctly

## Troubleshooting

### Common Issues

1. **Authentication Issues**
   - Check Supabase configuration
   - Verify environment variables

2. **Blockchain Connection Issues**
   - Check RPC URLs
   - Verify wallet configuration

3. **AI Agent Issues**
   - Check OpenAI API key
   - Verify agent configuration

### Logs and Monitoring

- Check Vercel logs for application errors
- Check Supabase logs for database errors
- Monitor blockchain transactions for contract interactions 