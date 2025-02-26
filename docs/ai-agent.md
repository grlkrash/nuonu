# AI Agent Documentation

This document provides an overview of the AI agent functionality in the Artist Grant AI Agent application.

## Core Functionality

The AI agent is designed to help artists discover and apply for opportunities, including web3 opportunities, DAO proposals, grants, and bounties. The agent can:

1. **Discover Opportunities** - Find relevant opportunities based on the artist's profile and preferences
2. **Generate Applications** - Create compelling application content tailored to the opportunity
3. **Submit Applications** - Submit applications on behalf of the artist
4. **Manage Blockchain Wallets** - Connect and register blockchain wallets for receiving funds
5. **Monitor Fund Distribution** - Track funds received and distributed to artists

## Components

### AI Services

1. **OpenAI Service** (`src/lib/services/openai.ts`)
   - Handles interactions with the OpenAI API
   - Generates application content based on profiles and opportunities
   - Provides profile insights for opportunity matching

2. **AI Matching Service** (`src/lib/services/ai-matching.ts`)
   - Evaluates the match between artist profiles and opportunities
   - Provides match scores and recommendations

3. **Twitter Search Service** (`src/lib/services/twitter-search.ts`)
   - Searches Twitter for relevant opportunities
   - Uses AI to filter and rank results

### Application Components

1. **AI Application Form** (`src/components/applications/ai-application-form.tsx`)
   - Allows artists to apply for opportunities with AI assistance
   - Generates application content based on the artist's profile
   - Handles submission of applications

2. **Blockchain Application Form** (`src/components/blockchain/blockchain-application-form.tsx`)
   - Allows artists to apply for blockchain-related opportunities
   - Connects blockchain wallets for receiving payments
   - Registers wallets on the appropriate blockchain

### Opportunity Management

1. **Opportunity Service** (`src/lib/services/opportunities.ts`)
   - Manages opportunity data in the database
   - Provides functions for creating, updating, and retrieving opportunities

2. **Application Service** (`src/lib/services/applications.ts`)
   - Manages application data in the database
   - Provides functions for creating, updating, and retrieving applications

## Integration Flow

1. **Profile Creation**
   - Artists create a profile with their skills, experience, and portfolio
   - The AI agent uses this information to find and apply for relevant opportunities

2. **Opportunity Discovery**
   - The AI agent discovers opportunities from various sources
   - Opportunities are matched with the artist's profile using AI

3. **Application Generation**
   - When an artist wants to apply for an opportunity, the AI agent generates application content
   - The content is tailored to the specific opportunity and the artist's profile

4. **Application Submission**
   - The artist reviews and approves the application content
   - The application is submitted to the opportunity

5. **Blockchain Integration** (for web3 opportunities)
   - Artists connect their blockchain wallets
   - Wallets are registered on the appropriate blockchain
   - Funds are received and distributed through the blockchain

## Future Enhancements

1. **Autonomous Application** - Enhanced AI agent autonomy for applying to opportunities without human intervention
2. **Bountycaster Integration** - Integration with Bountycaster for bounty applications
3. **DAO Proposal Automation** - Automated DAO proposal applications
4. **Enhanced Matching Algorithm** - Improved matching between artists and opportunities
5. **Personalized Recommendations** - More personalized opportunity recommendations based on artist preferences and history

## Environment Variables

The following environment variables are required for AI functionality:

- `OPENAI_API_KEY` - API key for OpenAI
- `NEXT_PUBLIC_SUPABASE_URL` - URL for the Supabase instance
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous key for Supabase 