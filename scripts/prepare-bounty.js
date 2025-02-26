#!/usr/bin/env node

/**
 * Bounty Preparation Script
 * 
 * This script:
 * 1. Creates bounty-specific documentation
 * 2. Organizes code for each bounty submission
 * 3. Prepares demo materials
 * 
 * Usage:
 * node scripts/prepare-bounty.js [bounty-name]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define bounties and their requirements
const bounties = {
  'base': {
    name: 'Base: AI-powered app on Base',
    amount: '$25,000',
    requirements: [
      'Deploy application on Base testnet',
      'Implement AgentKit integration',
      'Create onchain actions (fund distribution, application automation)',
      'Use other CDP tools (recommended)',
      'Create a social media account for the agent (encouraged)'
    ],
    files: [
      'src/contracts/FundDistribution.sol',
      'src/lib/blockchain/wallet-abstraction.ts',
      'src/components/blockchain/simple-wallet-connect.tsx'
    ]
  },
  'agentkit': {
    name: 'Coinbase Developer Platform: Most Innovative Use of AgentKit',
    amount: '$8,000',
    requirements: [
      'Create an innovative use case for AgentKit',
      'Implement crypto transaction capabilities',
      'Demonstrate autonomous agent behavior'
    ],
    files: [
      'src/lib/services/ai-matching.ts',
      'src/lib/services/openai.ts',
      'src/components/opportunities/opportunity-card.tsx'
    ]
  },
  'zksync-agent': {
    name: 'zkSync Era: Build an AI Agent on zkSync Era',
    amount: '$7,000',
    requirements: [
      'Deploy on zkSync Era Testnet',
      'Provide a working demo',
      'Submit a public GitHub repository with code'
    ],
    files: [
      'src/contracts/ZkSyncArtistManager.sol',
      'src/lib/services/zksync-blockchain.ts'
    ]
  },
  'zksync-sso': {
    name: 'zkSync: Best Web3 Onboarding UX using zkSync Smart Sign-On (SSO) SDK',
    amount: '$9,000',
    requirements: [
      'Integration of zkSync SSO SDK for wallet onboarding',
      'Implement as primary authentication method',
      'Deploy on zkSync Era Testnet or Mainnet',
      'Provide working demo with SSO login testing',
      'Submit public GitHub repository'
    ],
    files: [
      'src/components/blockchain/wallet-manager.tsx',
      'src/lib/blockchain/wallet-abstraction.ts'
    ]
  },
  'flow': {
    name: 'Flow: Best AI Agents',
    amount: '$15,000',
    requirements: [
      'AI Component with proof of on-chain interaction',
      'Smart Contract Integration on Flow testnet/mainnet',
      'Documentation of AI-Flow interaction',
      'Publicly accessible demo',
      'Usage of Eliza on Flow'
    ],
    files: [
      'src/contracts/FlowArtistManager.cdc',
      'src/lib/services/flow-blockchain.ts'
    ]
  },
  'chainlink': {
    name: 'Chainlink CCIP: Best use of Chainlink CCIP',
    amount: '$9,000',
    requirements: [
      'Implement token and/or message transfer across chains',
      'Leverage Chainlink\'s oracle networks',
      'Demonstrate practical cross-chain use case'
    ],
    files: [
      'src/lib/services/chainlink-ccip.ts'
    ]
  }
};

// Main function
async function main() {
  // Get bounty name from command line arguments
  const args = process.argv.slice(2);
  const bountyName = args[0];
  
  if (!bountyName) {
    // If no bounty specified, prepare all bounties
    console.log('Preparing all bounties...');
    
    // Create bounties directory if it doesn't exist
    if (!fs.existsSync('bounties')) {
      fs.mkdirSync('bounties');
    }
    
    // Prepare each bounty
    for (const [key, bounty] of Object.entries(bounties)) {
      await prepareBounty(key, bounty);
    }
    
    // Create main README
    createMainReadme();
  } else {
    // Prepare specific bounty
    const bounty = bounties[bountyName];
    
    if (!bounty) {
      console.error(`Error: Bounty "${bountyName}" not found.`);
      console.log('Available bounties:');
      Object.keys(bounties).forEach(key => {
        console.log(`- ${key}`);
      });
      process.exit(1);
    }
    
    // Create bounties directory if it doesn't exist
    if (!fs.existsSync('bounties')) {
      fs.mkdirSync('bounties');
    }
    
    await prepareBounty(bountyName, bounty);
  }
  
  console.log('Bounty preparation completed successfully!');
}

// Prepare a specific bounty
async function prepareBounty(key, bounty) {
  console.log(`Preparing bounty: ${bounty.name}...`);
  
  // Create bounty directory
  const bountyDir = path.join('bounties', key);
  if (!fs.existsSync(bountyDir)) {
    fs.mkdirSync(bountyDir);
  }
  
  // Create README for the bounty
  createBountyReadme(key, bounty, bountyDir);
  
  // Copy relevant files
  copyBountyFiles(bounty, bountyDir);
  
  // Create screenshots directory
  const screenshotsDir = path.join(bountyDir, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  console.log(`Bounty "${key}" prepared successfully!`);
}

// Create README for a bounty
function createBountyReadme(key, bounty, bountyDir) {
  const readmePath = path.join(bountyDir, 'README.md');
  
  const content = `# ${bounty.name} (${bounty.amount})

## Overview

This submission for the ${bounty.name} bounty demonstrates how the Artist Grant AI Agent platform leverages blockchain technology to help artists discover, apply for, and manage grants and creative opportunities.

## Requirements

${bounty.requirements.map(req => `- [ ] ${req}`).join('\n')}

## Implementation

### Key Features

- Feature 1
- Feature 2
- Feature 3

### Technical Details

Describe the technical implementation here.

### Demo

[Link to demo video]

## Setup Instructions

1. Clone the repository
2. Install dependencies: \`npm install\`
3. Configure environment variables
4. Run the application: \`npm run dev\`

## Testing

Describe how to test the functionality.

## Screenshots

![Screenshot 1](./screenshots/screenshot1.png)

## Team

- Team Member 1
- Team Member 2

`;
  
  fs.writeFileSync(readmePath, content);
  console.log(`Created README for ${key}`);
}

// Copy relevant files for a bounty
function copyBountyFiles(bounty, bountyDir) {
  const codeDir = path.join(bountyDir, 'code');
  if (!fs.existsSync(codeDir)) {
    fs.mkdirSync(codeDir);
  }
  
  bounty.files.forEach(filePath => {
    try {
      // Create directory structure
      const destPath = path.join(codeDir, filePath);
      const destDir = path.dirname(destPath);
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Copy file if it exists
      if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, destPath);
        console.log(`Copied ${filePath} to ${destPath}`);
      } else {
        console.warn(`Warning: File ${filePath} not found`);
      }
    } catch (error) {
      console.error(`Error copying file ${filePath}:`, error);
    }
  });
}

// Create main README
function createMainReadme() {
  const readmePath = path.join('bounties', 'README.md');
  
  const content = `# Artist Grant AI Agent - Hackathon Bounty Submissions

This directory contains submissions for various hackathon bounties.

## Bounties

${Object.entries(bounties).map(([key, bounty]) => `- [${bounty.name} (${bounty.amount})](${key}/README.md)`).join('\n')}

## Project Overview

The Artist Grant AI Agent is an autonomous agent platform designed to help artists discover, apply for, and manage grants, jobs, gigs, and creative opportunities. The agent uses AI to match artists with relevant funding sources and work opportunities, handles the application process, and manages disbursement of funds via crypto payment rails.

## Key Features

- AI-powered opportunity discovery and matching
- Automated application assistance
- Multi-chain blockchain integration (Base, zkSync, Flow)
- Secure fund distribution
- Artist onboarding wizard

## Technology Stack

- Frontend: NextJS, React, TailwindCSS
- Backend: Node.js, Supabase
- AI: OpenAI API
- Blockchain: Base, zkSync Era, Flow, Chainlink CCIP

## Setup Instructions

See the main [README.md](../README.md) for setup instructions.

`;
  
  fs.writeFileSync(readmePath, content);
  console.log('Created main README for bounties');
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 