# Hackathon Bounty Requirements Checklist

This document provides detailed requirements for each bounty we're targeting, along with implementation status to track our progress.

## Tier 1 Bounties (Primary Focus)

### Base: AI-powered app on Base ($25,000)

**Bounty Description:** Build new AI agents and applications on Base that can perform useful onchain actions using Coinbase's AgentKit and other Coinbase developer platform tools.

**Requirements:**
- [x] Deploy application on Base testnet
- [x] Implement AgentKit integration
- [x] Create onchain actions (fund distribution, application automation)

**Implementation Status:**
- ✅ Base Sepolia testnet configured
- ✅ AgentKit integrated with wallet provider
- ✅ On-chain actions implemented (wallet management, token transfers, faucet requests)
- ⏳ Smart contract deployment pending
- ⏳ Full end-to-end testing pending

### Coinbase Developer Platform: Most Innovative Use of AgentKit ($8,000)

**Bounty Description:** Use AgentKit to create an agent with access to crypto to do something incredible.

**Requirements:**
- [x] Create an innovative use case for AgentKit
- [x] Implement crypto transaction capabilities
- [x] Demonstrate autonomous agent behavior

**Implementation Status:**
- ✅ Artist grant management use case implemented
- ✅ Crypto transaction capabilities integrated
- ✅ Autonomous agent behavior for opportunity discovery
- ⏳ Demo video creation pending
- ⏳ Documentation finalization pending

### zkSync Era: Build an AI Agent on zkSync Era ($7,000)

**Bounty Description:** Launch an AI agent on zkSync Era. Your agent should interact with smart contracts, execute onchain actions, or automate tasks.

**Requirements:**
- [ ] Deploy on zkSync Era Testnet
- [ ] Provide a working demo
- [ ] Submit a public GitHub repository with code

**Implementation Status:**
- ✅ Initial zkSync Era integration
- ⏳ AgentKit adaptation for zkSync pending
- ⏳ Smart contract deployment pending
- ⏳ Demo creation pending

### zkSync: Best Web3 Onboarding UX using zkSync Smart Sign-On (SSO) SDK ($9,000)

**Bounty Description:** Build with zkSync SSO SDK to bring Web2-like UX to your app.

**Requirements:**
- [ ] Integration of zkSync SSO SDK for wallet onboarding
- [ ] Implement as primary authentication method
- [ ] Deploy on zkSync Era Testnet or Mainnet
- [ ] Provide working demo with SSO login testing
- [ ] Submit public GitHub repository

**Implementation Status:**
- ⏳ zkSync SSO SDK integration pending
- ⏳ Authentication flow integration pending
- ⏳ Testing and demo creation pending

## Tier 2 Bounties (Secondary Focus)

### Coinbase Developer Platform: Best Use of CDP SDK ($3,000)

**Bounty Description:** Use the CDP SDK to create innovative experiences leveraging MPC Wallets and streamlined API calls.

**Requirements:**
- [x] Use CDP SDK for onchain app
- [x] Implement MPC Wallet functionality
- [x] Demonstrate streamlined API usage
- [x] Show practical value of being onchain

**Implementation Status:**
- ✅ CDP SDK integrated via AgentKit
- ✅ MPC Wallet functionality implemented
- ✅ Streamlined API usage for wallet operations
- ⏳ Demo video creation pending

### Flow: Best AI Agents ($15,000)

**Bounty Description:** Show how you can leverage consumer AI Agents on Flow to enact real-world impact.

**Requirements:**
- [ ] AI Component with proof of on-chain interaction
- [ ] Smart Contract Integration on Flow testnet/mainnet
- [ ] Documentation of AI-Flow interaction
- [ ] Publicly accessible demo
- [ ] Usage of Eliza on Flow

**Implementation Status:**
- ✅ Initial Flow integration
- ⏳ Smart contract deployment pending
- ⏳ Eliza OS integration pending
- ⏳ Demo creation pending

## Tier 3 Bounty (If Time Permits)

### Chainlink CCIP: Best use of Chainlink CCIP ($9,000)

**Bounty Description:** Build something awesome using Chainlink CCIP for cross-chain interoperability.

**Requirements:**
- [ ] Implement token and/or message transfer across chains
- [ ] Leverage Chainlink's oracle networks
- [ ] Demonstrate practical cross-chain use case

**Implementation Status:**
- ⏳ CCIP integration planning
- ⏳ Cross-chain functionality implementation pending
- ⏳ Testing and demo creation pending

## Next Steps Priority

Based on our current progress, here are the prioritized next steps:

1. **Deploy ArtistFundManager contract to Base Sepolia**
   - Use the real private key from .env.local
   - Update contract address in the AgentKit implementation
   - Test full flow with the deployed contract

2. **Complete zkSync Era Integration**
   - Adapt AgentKit implementation for zkSync
   - Deploy smart contracts to zkSync testnet
   - Test and document zkSync-specific functionality

3. **Complete Flow Integration**
   - Deploy smart contracts to Flow testnet
   - Integrate with Eliza OS
   - Test and document Flow-specific functionality

4. **Implement Cross-chain Functionality**
   - Integrate Chainlink CCIP for cross-chain operations
   - Test cross-chain fund transfers
   - Document cross-chain capabilities

5. **Create Demo Materials**
   - Record demo videos for each bounty
   - Create screenshots and documentation
   - Prepare final submission materials

## Submission Materials Status

### Documentation
- [x] Technical implementation details for AgentKit
- [ ] Technical implementation details for other integrations
- [x] Architecture diagram showing AgentKit integration
- [ ] Architecture diagrams for other integrations
- [ ] Usage examples and code snippets
- [ ] Setup and deployment instructions

### Demo Materials
- [ ] 90-second demo video for Base bounty
- [ ] 90-second demo video for AgentKit bounty
- [ ] 90-second demo video for zkSync bounty
- [ ] 90-second demo video for Flow bounty
- [ ] Screenshots of key features
- [ ] Link to live demo
- [ ] Test account credentials

### Code Repository
- [x] Clean, well-organized codebase
- [ ] README with setup instructions
- [ ] Licensing information
- [ ] Documentation for key components
- [ ] Tagged version for submission 