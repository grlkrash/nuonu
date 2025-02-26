// scripts/verify-contracts.js
const hre = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
  console.log("Verifying deployed contracts...");
  
  // Contract addresses from environment variables
  const fundDistributionAddress = process.env.NEXT_PUBLIC_ARTIST_FUND_MANAGER_BASE;
  const zkSyncArtistManagerAddress = process.env.NEXT_PUBLIC_ARTIST_FUND_MANAGER_ZKSYNC;
  
  console.log(`Using FundDistribution address: ${fundDistributionAddress}`);
  console.log(`Using ZkSyncArtistManager address: ${zkSyncArtistManagerAddress}`);
  
  if (!fundDistributionAddress || !zkSyncArtistManagerAddress) {
    console.error("❌ Contract addresses not found in environment variables. Please check your .env.local file.");
    process.exit(1);
  }
  
  // Get contract instances
  const FundDistribution = await hre.ethers.getContractFactory("FundDistribution");
  const fundDistribution = FundDistribution.attach(fundDistributionAddress);
  
  const ZkSyncArtistManager = await hre.ethers.getContractFactory("ZkSyncArtistManager");
  const zkSyncArtistManager = ZkSyncArtistManager.attach(zkSyncArtistManagerAddress);
  
  // Verify FundDistribution contract
  try {
    const fundDistributionAddress = await fundDistribution.getAddress();
    console.log(`✅ FundDistribution contract verified at address: ${fundDistributionAddress}`);
    
    // Check if we can interact with the contract
    const adminRole = await fundDistribution.ADMIN_ROLE();
    console.log(`  - ADMIN_ROLE: ${adminRole}`);
    
    // Get the deployer address
    const [deployer] = await hre.ethers.getSigners();
    const hasAdminRole = await fundDistribution.hasRole(adminRole, deployer.address);
    console.log(`  - Deployer ${deployer.address} has ADMIN_ROLE: ${hasAdminRole}`);
    
    // Check contract balance
    const balance = await hre.ethers.provider.getBalance(fundDistributionAddress);
    console.log(`  - Contract balance: ${hre.ethers.formatEther(balance)} ETH`);
    
    // Try to get grant details
    try {
      const grant = await fundDistribution.getGrant(1);
      console.log(`  - Grant #1 exists: ${grant.title}`);
    } catch (error) {
      console.log(`  - No grants found or error retrieving grant: ${error.message}`);
    }
  } catch (error) {
    console.error(`❌ Failed to verify FundDistribution contract: ${error.message}`);
  }
  
  // Verify ZkSyncArtistManager contract
  try {
    const zkSyncArtistManagerAddress = await zkSyncArtistManager.getAddress();
    console.log(`\n✅ ZkSyncArtistManager contract verified at address: ${zkSyncArtistManagerAddress}`);
    
    // Check if we can interact with the contract
    const testArtistId = "test-artist-1";
    const artistWallet = await zkSyncArtistManager.artistWallets(testArtistId);
    console.log(`  - Artist ${testArtistId} wallet: ${artistWallet}`);
    
    // Check session keys
    const sessionKeys = await zkSyncArtistManager.getSessionKeys(testArtistId);
    console.log(`  - Session keys for artist ${testArtistId}: ${sessionKeys}`);
    
    // Check pending funds
    const pendingFunds = await zkSyncArtistManager.getPendingFunds(testArtistId);
    console.log(`  - Pending funds for artist ${testArtistId}: ${hre.ethers.formatEther(pendingFunds)} ETH`);
  } catch (error) {
    console.error(`❌ Failed to verify ZkSyncArtistManager contract: ${error.message}`);
  }
  
  console.log("\nContract verification completed.");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 