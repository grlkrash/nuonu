#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { ethers } = require('ethers');
const { Provider, Wallet, Contract } = require('zksync-web3');

// ABI for the zkSync ArtistFundManager contract
const ZkSyncArtistFundManagerABI = [
  "function submitApplication(string applicationId, string contentHash, string grantId) external",
  "function awardGrant(string grantId, string artistId) external",
  "function distributeFunds(string artistId) external",
  "function getApplication(string applicationId) external view returns (tuple(string id, string contentHash, address artistAddress, string grantId, uint8 status, uint256 timestamp))",
  "event ApplicationSubmitted(string indexed applicationId, string indexed grantId, address indexed artist)",
  "event GrantAwarded(string indexed grantId, string indexed artistId, uint256 amount)"
];

async function main() {
  try {
    console.log('Testing zkSync Integration with Direct Contract Interaction');
    console.log('------------------------------------------------------');

    // Check environment variables
    const privateKey = process.env.ZKSYNC_PRIVATE_KEY;
    const rpcUrl = process.env.NEXT_PUBLIC_ZKSYNC_RPC_URL || 'https://testnet.era.zksync.dev';
    const contractAddress = process.env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS;

    if (!privateKey) {
      console.error('Error: ZKSYNC_PRIVATE_KEY not found in environment variables');
      process.exit(1);
    }

    if (!contractAddress) {
      console.error('Error: NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS not found in environment variables');
      process.exit(1);
    }

    console.log(`Using zkSync RPC URL: ${rpcUrl}`);
    console.log(`Using contract address: ${contractAddress}`);

    // Initialize provider and wallet
    const provider = new Provider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    const address = await wallet.getAddress();
    console.log(`Using wallet address: ${address}`);

    // Initialize contract
    const contract = new Contract(
      contractAddress,
      ZkSyncArtistFundManagerABI,
      wallet
    );

    // Create a test artist ID
    const testArtistId = `artist_${Date.now()}`;
    console.log(`Test artist ID: ${testArtistId}`);

    // Test 1: Get artist details (this should fail initially since the artist doesn't exist yet)
    console.log('\n--- Test 1: Get application details (should fail initially) ---');
    try {
      const applicationId = `app-${testArtistId}`;
      const application = await contract.getApplication(applicationId);
      console.log('Application details:', {
        id: application.id,
        contentHash: application.contentHash,
        artistAddress: application.artistAddress,
        grantId: application.grantId,
        status: application.status,
        timestamp: application.timestamp.toString(),
      });
    } catch (error) {
      console.log('Expected error getting non-existent application details:', error.message);
    }

    // Test 2: Disburse grant
    console.log('\n--- Test 2: Disburse grant with real transaction ---');
    try {
      const tx = await contract.distributeFunds(testArtistId);
      console.log('Transaction submitted:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed!');
      console.log('Transaction hash:', receipt.transactionHash);
      console.log('Block number:', receipt.blockNumber);
    } catch (error) {
      console.error('Error disbursing grant:', error.message);
    }

    console.log('\nAll tests completed!');
    
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 