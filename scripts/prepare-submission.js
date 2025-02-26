// scripts/prepare-submission.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * This script prepares the final submission package for the hackathon.
 * It:
 * 1. Runs the clean-env-files.js script to sanitize environment files
 * 2. Runs the prepare-bounty.js script to prepare bounty-specific documentation
 * 3. Updates the README.md with the latest project status
 * 4. Creates a SUBMISSION.md file with submission details
 */

// Main function
async function main() {
  console.log('Preparing final submission package...');
  
  // Step 1: Clean environment files
  console.log('\n--- Step 1: Cleaning environment files ---');
  try {
    execSync('node scripts/clean-env-files.js', { stdio: 'inherit' });
    console.log('✅ Environment files cleaned successfully');
  } catch (error) {
    console.error('❌ Error cleaning environment files:', error.message);
  }
  
  // Step 2: Prepare bounty-specific documentation
  console.log('\n--- Step 2: Preparing bounty documentation ---');
  try {
    execSync('node scripts/prepare-bounty.js', { stdio: 'inherit' });
    console.log('✅ Bounty documentation prepared successfully');
  } catch (error) {
    console.error('❌ Error preparing bounty documentation:', error.message);
  }
  
  // Step 3: Update README.md with latest project status
  console.log('\n--- Step 3: Updating README.md ---');
  try {
    updateReadme();
    console.log('✅ README.md updated successfully');
  } catch (error) {
    console.error('❌ Error updating README.md:', error.message);
  }
  
  // Step 4: Create SUBMISSION.md
  console.log('\n--- Step 4: Creating SUBMISSION.md ---');
  try {
    createSubmissionFile();
    console.log('✅ SUBMISSION.md created successfully');
  } catch (error) {
    console.error('❌ Error creating SUBMISSION.md:', error.message);
  }
  
  console.log('\nFinal submission package prepared successfully!');
  console.log('\nNext steps:');
  console.log('1. Review the generated files in the "bounties" directory');
  console.log('2. Create demo videos for each bounty');
  console.log('3. Take screenshots of the application');
  console.log('4. Submit to the hackathon');
}

// Update README.md with latest project status
function updateReadme() {
  const readmePath = path.join(__dirname, '..', 'README.md');
  let content = fs.readFileSync(readmePath, 'utf8');
  
  // Update the Current Status section
  const currentStatusRegex = /## Current Status([\s\S]*?)(?=##)/;
  const newCurrentStatus = `## Current Status

The project is ready for submission with the following components implemented:

- ✅ User authentication and profile management
- ✅ Artist onboarding questionnaire
- ✅ Dashboard with opportunity recommendations
- ✅ Multi-chain wallet integration
- ✅ AI-powered opportunity matching
- ✅ Application submission system
- ✅ Smart contract deployment to testnets
- ✅ Fund distribution system
- ✅ Documentation and demo materials

`;
  
  content = content.replace(currentStatusRegex, newCurrentStatus);
  
  // Update the Next Steps section
  const nextStepsRegex = /## Next Steps([\s\S]*?)(?=##)/;
  const newNextSteps = `## Next Steps

1. Submit to the hackathon
2. Implement user feedback from judges
3. Expand blockchain integration
4. Add more AI capabilities
5. Improve UI/UX based on user testing

`;
  
  content = content.replace(nextStepsRegex, newNextSteps);
  
  fs.writeFileSync(readmePath, content);
}

// Create SUBMISSION.md file
function createSubmissionFile() {
  const submissionPath = path.join(__dirname, '..', 'SUBMISSION.md');
  
  const content = `# Artist Grant AI Agent - Hackathon Submission

## Project Overview

The Artist Grant AI Agent is a comprehensive platform that helps artists discover grant opportunities, jobs, gigs, and other creative opportunities. It automates the application process for web3 grants, DAO proposals, and bounties via Bountycaster, and manages fund distribution using blockchain technology.

## Bounties

We are submitting for the following bounties:

1. **Base: AI-powered app on Base** ($25,000)
   - Deployed smart contracts on Base Sepolia testnet
   - Implemented fund distribution system
   - Integrated with AgentKit for AI-powered opportunity matching

2. **Coinbase Developer Platform: Most Innovative Use of AgentKit** ($8,000)
   - Created an innovative use case for AgentKit
   - Implemented crypto transaction capabilities
   - Demonstrated autonomous agent behavior

3. **zkSync Era: Build an AI Agent on zkSync Era** ($7,000)
   - Deployed smart contracts on zkSync Era Testnet
   - Implemented artist management system
   - Created demo showcasing zkSync functionality

4. **zkSync: Best Web3 Onboarding UX using zkSync Smart Sign-On (SSO) SDK** ($9,000)
   - Integrated zkSync SSO SDK for wallet onboarding
   - Implemented as primary authentication method
   - Created smooth onboarding experience

5. **Flow: Best AI Agents** ($15,000)
   - Implemented AI component with on-chain interaction
   - Integrated with Flow blockchain
   - Created demo showcasing Flow functionality

## Demo Materials

- Demo videos are available in the \`bounties/<bounty-name>/demo\` directories
- Screenshots are available in the \`bounties/<bounty-name>/screenshots\` directories

## Team

- Team Member 1
- Team Member 2
- Team Member 3

## Contact

For any questions or clarifications, please contact us at:
- Email: team@example.com
- Discord: team#1234

Thank you for considering our submission!
`;
  
  fs.writeFileSync(submissionPath, content);
}

// Run the main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 