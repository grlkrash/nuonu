# AI Agent Documentation

## Overview

The Artist Grant AI Agent is an autonomous system designed to help artists discover, apply for, and manage grant opportunities. The agent leverages AI to match artists with relevant opportunities based on their profile, portfolio, and career stage, and can automate various aspects of the application process.

## Key Components

### 1. Opportunity Discovery

The agent uses multiple sources to discover grant opportunities for artists:

- **Eliza Twitter Integration**: Searches Twitter for posts about artist grants, residencies, and other opportunities using the Eliza OS.
- **Grants Database**: Queries a curated database of artist grants and funding opportunities.
- **Web Search**: Performs targeted web searches for new and upcoming opportunities.

### 2. Opportunity Matching

The agent matches opportunities with artist profiles using:

- **AI Matching Algorithm**: Analyzes opportunity requirements and artist profiles to calculate match scores.
- **Career Stage Matching**: Considers the artist's career stage (emerging, mid-career, established) when recommending opportunities.
- **Discipline Matching**: Ensures opportunities are relevant to the artist's specific discipline and medium.
- **Location Matching**: Considers geographical constraints and remote opportunities.

### 3. Application Generation

For high-match opportunities, the agent can:

- **Generate Application Drafts**: Creates tailored application content based on the artist's portfolio and the opportunity requirements.
- **Customize Artist Statements**: Adapts the artist's statement to highlight aspects relevant to the specific opportunity.
- **Format Portfolio Materials**: Prepares portfolio materials according to the opportunity's submission guidelines.

### 4. Application Submission

The agent can assist with or automate the submission process:

- **Form Filling**: Automatically fills out application forms with artist information.
- **Document Preparation**: Prepares necessary documents in the required formats.
- **Submission Tracking**: Records submission details and confirmation information.

### 5. Application Monitoring

After submission, the agent:

- **Tracks Application Status**: Monitors the status of submitted applications.
- **Provides Updates**: Notifies the artist of status changes or required actions.
- **Follows Up**: Can generate follow-up communications when appropriate.

## Blockchain Integration

The agent integrates with multiple blockchain networks to facilitate secure fund distribution:

- **Base (Coinbase L2)**: Primary blockchain for fund distribution using the FundDistribution smart contract.
- **zkSync Era**: Provides efficient transactions and enhanced onboarding through Smart Sign-On (SSO).
- **Flow Blockchain**: Offers additional options for artist fund management with the FlowArtistManager contract.

## Agent Activities

The agent logs all activities in the `agent_activities` table, including:

- `discover_opportunities`: Finding new opportunities
- `match_opportunities`: Matching opportunities with artist profiles
- `generate_application`: Creating application content
- `submit_application`: Submitting applications
- `monitor_application`: Tracking application status

Each activity has a status (`in_progress`, `completed`, or `failed`) and detailed information about the results.

## Running the Agent

The agent can be run manually or scheduled to run automatically:

```bash
npm run run-agent -- <artist_id>
```

Where `<artist_id>` is the UUID of the artist in the profiles table.

## Agent Dashboard

Artists can view and manage agent activities through the Agent Dashboard at `/dashboard/agent`. The dashboard provides:

- Overview of recent agent activities
- Discovered opportunities with match scores
- Generated applications ready for review
- Submission status for all applications
- Options to enable/disable autonomous actions

## Configuration

The agent's behavior can be configured through environment variables:

- `NEXT_PUBLIC_ENABLE_AUTO_APPLICATIONS`: Enable/disable automatic application generation
- `NEXT_PUBLIC_ENABLE_AUTO_SUBMISSIONS`: Enable/disable automatic application submission
- `NEXT_PUBLIC_AGENT_DISCOVERY_INTERVAL`: Set the interval for opportunity discovery (in hours)

## Integration with Eliza OS

The agent uses Eliza OS for Twitter search functionality:

1. The `searchTwitterWithEliza` function queries Twitter for artist opportunities
2. Results are processed through `extractOpportunityFromTweet` to identify relevant details
3. Opportunities are converted to the application's format using `convertElizaTwitterToOpportunities`
4. New opportunities are stored in the database via `storeElizaTwitterOpportunities`

## Security and Privacy

The agent implements several security measures:

- All database interactions use Row Level Security (RLS) to ensure artists can only access their own data
- API endpoints require authentication and validate artist ownership
- Sensitive information is never exposed in logs or activity records
- All blockchain transactions require explicit artist approval

## Future Enhancements

Planned enhancements for the agent include:

1. **Enhanced AI Matching**: Improved algorithms for more accurate opportunity matching
2. **Multi-language Support**: Ability to discover and apply for opportunities in multiple languages
3. **Reputation System**: Building artist reputation scores based on successful applications
4. **Collaborative Applications**: Supporting collaborative grant applications for artist groups
5. **Predictive Analytics**: Predicting application success rates based on historical data

## Troubleshooting

Common issues and their solutions:

- **Agent Not Discovering Opportunities**: Check Eliza API key and Twitter search configuration
- **Low Match Scores**: Ensure artist profile is complete with detailed information
- **Application Generation Failures**: Verify that portfolio materials are properly uploaded
- **Submission Errors**: Check that all required fields are completed in the artist profile
- **Blockchain Transaction Failures**: Ensure wallet is properly connected and has sufficient funds

## API Reference

The agent exposes several API endpoints:

- `POST /api/agent/discover`: Trigger opportunity discovery
- `POST /api/agent/match`: Match opportunities with an artist profile
- `POST /api/agent/generate`: Generate an application for an opportunity
- `POST /api/agent/submit`: Submit an application
- `GET /api/agent/activities`: Get all agent activities for an artist
- `GET /api/agent/activities/:id`: Get details for a specific activity

## AgentKit Integration

The Artist Grant AI Agent can be enhanced with Coinbase's AgentKit to provide more powerful blockchain interactions. AgentKit integration enables:

### Wallet Management

- **CDP Wallet Provider**: Create and manage wallets for artists through the Coinbase Developer Platform
- **Multi-Chain Support**: Interact with multiple blockchain networks from a single interface
- **Session Management**: Create and manage sessions for secure wallet interactions

### Blockchain Actions

- **Fund Distribution**: Distribute grant funds to artists through smart contracts
- **Token Management**: Handle ERC-20 tokens for grant payments
- **Price Feeds**: Access Pyth price feeds for accurate token valuations
- **Transaction Monitoring**: Track transaction status and confirmations

### Autonomous Mode

The agent can operate in autonomous mode using AgentKit's capabilities:

1. **Scheduled Runs**: The agent can be scheduled to run at regular intervals
2. **Creative Instructions**: The agent can be given creative freedom to discover and apply for opportunities
3. **Streaming Responses**: Real-time updates as the agent performs actions
4. **Memory System**: Maintain conversation history and context between runs

### Implementation

To implement AgentKit integration:

1. Install the required packages:
   ```bash
   npm install coinbase-agentkit coinbase-agentkit-langchain
   ```

2. Configure the wallet provider:
   ```javascript
   const walletProvider = new CdpWalletProvider(cdpConfig);
   ```

3. Set up action providers:
   ```javascript
   const agentkit = new AgentKit({
     walletProvider,
     actionProviders: [
       cdpWalletActionProvider(),
       cdpApiActionProvider(),
       erc20ActionProvider(),
       pythActionProvider(),
       walletActionProvider(),
       wethActionProvider(),
     ]
   });
   ```

4. Create a LangChain agent:
   ```javascript
   const tools = getLangChainTools(agentkit);
   const agent = createReactAgent(llm, tools, memory);
   ```

5. Run the agent in autonomous mode:
   ```javascript
   const result = await agent.invoke({
     messages: [
       new HumanMessage("Discover grant opportunities for digital artists")
     ]
   });
   ```

### UI Components

The AgentKit integration includes several UI components for the agent dashboard:

1. **AgentKitPanel**: The main panel for AgentKit interactions, displaying:
   - Current wallet status
   - Agent activity feed
   - Control options for running the agent

2. **AgentActivitiesList**: Displays a chronological list of agent activities with:
   - Activity type and status
   - Timestamp
   - Detailed information about each activity
   - Links to related blockchain transactions

3. **AgentControls**: Provides controls for managing the agent:
   - Run agent button
   - Configuration options
   - Mode selection (autonomous vs. supervised)

### Activity Logging

All AgentKit activities are logged in the `agent_activities` table with the following types:

- `wallet_creation`: Creating a new wallet for an artist
- `wallet_balance_check`: Checking the balance of an artist's wallet
- `agent_run`: Running the autonomous agent with specific instructions
- `fund_distribution`: Distributing funds to an artist's wallet

Each activity includes detailed information such as:
- Wallet addresses
- Transaction hashes
- Token amounts and symbols
- Agent responses and instructions

### Testing

The AgentKit integration can be tested using the provided test script:

```bash
npm run test:agentkit-integration
```

This script simulates the following actions:
1. Creating a wallet for an artist
2. Checking the wallet balance
3. Running the agent with specific instructions
4. Distributing funds to the artist's wallet

The test uses mock functions to simulate blockchain interactions, making it safe to run in any environment.

### Configuration

The AgentKit integration can be configured through environment variables:

- `NEXT_PUBLIC_AGENTKIT_API_KEY`: API key for AgentKit services
- `NEXT_PUBLIC_AGENTKIT_ENVIRONMENT`: Environment to use (development, staging, production)
- `NEXT_PUBLIC_AGENTKIT_WALLET_PROVIDER`: Wallet provider to use (CDP, MetaMask, WalletConnect)
- `NEXT_PUBLIC_AGENTKIT_DEFAULT_CHAIN`: Default blockchain network to use

### Error Handling

The AgentKit integration includes robust error handling for:

- Network connectivity issues
- Blockchain transaction failures
- Wallet creation and management errors
- API rate limiting and quotas

All errors are logged in the `agent_activities` table with a `failed` status and detailed error information.

### Security Considerations

When using AgentKit, consider the following security best practices:

- Store API keys securely in environment variables
- Use session-based authentication for wallet interactions
- Implement proper error handling for all blockchain transactions
- Validate all user inputs before sending to the blockchain
- Use secure connections (HTTPS) for all API requests
- Implement rate limiting to prevent abuse
- Regularly audit and update dependencies 