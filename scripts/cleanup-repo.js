#!/usr/bin/env node

/**
 * Repository Cleanup Script
 * 
 * This script prepares the repository for public submission by:
 * 1. Removing sensitive information (API keys, private keys)
 * 2. Creating template .env files with placeholders
 * 3. Updating documentation
 * 4. Removing unnecessary files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to clean up or remove
const SENSITIVE_FILES = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  'node_modules',
  '.next',
  '.git/logs',
  'dist',
  'build',
  'coverage'
];

// Template for .env.example
const ENV_TEMPLATE = `# Nuonu Platform Environment Variables

# API Keys (Replace with your own keys)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
REPLICATE_API_KEY=your_replicate_api_key_here

# Blockchain Configuration
NEXT_PUBLIC_ARTIST_FUND_MANAGER_BASE=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_ARTIST_FUND_MANAGER_ZKSYNC=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_ARTIST_FUND_MANAGER_FLOW=0x0000000000000000000000000000000000000000

# Private Keys (NEVER commit real private keys to GitHub)
BASE_PRIVATE_KEY=your_base_private_key_here
ZKSYNC_PRIVATE_KEY=your_zksync_private_key_here
FLOW_PRIVATE_KEY=your_flow_private_key_here

# RPC URLs
NEXT_PUBLIC_BASE_RPC_URL=https://goerli.base.org
NEXT_PUBLIC_ZKSYNC_RPC_URL=https://testnet.era.zksync.dev
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org

# Database Configuration
DATABASE_URL=your_database_url_here

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
`;

// Main function
async function main() {
  console.log('Starting repository cleanup...');
  
  // Create .env.example
  console.log('Creating .env.example template...');
  fs.writeFileSync('.env.example', ENV_TEMPLATE);
  
  // Remove sensitive files
  console.log('Removing sensitive files...');
  SENSITIVE_FILES.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        if (fs.lstatSync(file).isDirectory()) {
          // Skip directories, just log them
          console.log(`Skipping directory: ${file} (remove manually if needed)`);
        } else {
          fs.unlinkSync(file);
          console.log(`Removed: ${file}`);
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  });
  
  // Update README with submission instructions
  console.log('Updating README with submission instructions...');
  try {
    let readme = fs.readFileSync('README.md', 'utf8');
    
    // Add setup instructions if they don't exist
    if (!readme.includes('## Setup Instructions')) {
      const setupInstructions = `
## Setup Instructions

1. Clone this repository
2. Copy \`.env.example\` to \`.env.local\` and fill in your API keys and private keys
3. Install dependencies: \`npm install\`
4. Run the development server: \`npm run dev\`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Bounty Submission

This repository is a submission for the following bounties:
- Base: Best Use of Base ($10,000)
- zkSync: Best Web3 Onboarding UX using zkSync Smart Sign-On (SSO) SDK ($9,000)
- Chainlink CCIP: Best Implementation ($5,000)
- Flow: Best Use of Flow ($5,000)

See \`docs/bounty-status.md\` for detailed status of each bounty implementation.
`;
      
      readme += setupInstructions;
      fs.writeFileSync('README.md', readme);
      console.log('Updated README.md with setup instructions');
    }
  } catch (error) {
    console.error('Error updating README:', error.message);
  }
  
  console.log('Repository cleanup completed!');
  console.log('\nNext steps:');
  console.log('1. Review the repository manually for any remaining sensitive information');
  console.log('2. Test the setup process using the .env.example file');
  console.log('3. Submit the repository to the bounty program');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 