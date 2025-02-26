// scripts/test-blockchain-integration.js
const hre = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
  console.log("Testing blockchain integration...");
  
  // Contract addresses from environment variables
  const fundDistributionAddress = process.env.NEXT_PUBLIC_ARTIST_FUND_MANAGER_BASE;
  const zkSyncArtistManagerAddress = process.env.NEXT_PUBLIC_ARTIST_FUND_MANAGER_ZKSYNC;
  
  console.log(`Using FundDistribution address: ${fundDistributionAddress}`);
  console.log(`Using ZkSyncArtistManager address: ${zkSyncArtistManagerAddress}`);
  
  if (!fundDistributionAddress || !zkSyncArtistManagerAddress) {
    console.error("❌ Contract addresses not found in environment variables. Please check your .env.local file.");
    process.exit(1);
  }
  
  // Get the deployed FundDistribution contract
  const FundDistribution = await hre.ethers.getContractFactory("FundDistribution");
  const fundDistribution = FundDistribution.attach(fundDistributionAddress);
  
  // Get the deployed ZkSyncArtistManager contract
  const ZkSyncArtistManager = await hre.ethers.getContractFactory("ZkSyncArtistManager");
  const zkSyncArtistManager = ZkSyncArtistManager.attach(zkSyncArtistManagerAddress);
  
  // Get the deployer address
  const [deployer, artist] = await hre.ethers.getSigners();
  
  console.log("Deployer address:", deployer.address);
  console.log("Artist address:", artist.address);
  
  // Test FundDistribution contract
  console.log("\n--- Testing FundDistribution Contract ---");
  
  try {
    // Check if the contract is deployed
    const adminRole = await fundDistribution.ADMIN_ROLE();
    console.log("Contract is deployed and accessible");
    
    // Check if deployer has admin role
    const hasAdminRole = await fundDistribution.hasRole(adminRole, deployer.address);
    console.log(`Deployer has ADMIN_ROLE: ${hasAdminRole}`);
    
    // Get contract balance
    const balance = await hre.ethers.provider.getBalance(fundDistributionAddress);
    console.log(`Contract balance: ${hre.ethers.formatEther(balance)} ETH`);
    
    // Try to get a grant
    try {
      const grant = await fundDistribution.getGrant(1);
      console.log("Grant #1 exists:", {
        title: grant.title,
        amount: hre.ethers.formatEther(grant.amount)
      });
    } catch (error) {
      console.log("No grants found or error retrieving grant:", error.message);
    }
  } catch (error) {
    console.error("Error testing FundDistribution contract:", error.message);
  }
  
  // Test ZkSyncArtistManager contract
  console.log("\n--- Testing ZkSyncArtistManager Contract ---");
  
  try {
    // Check if the contract is deployed
    const owner = await zkSyncArtistManager.owner();
    console.log("Contract is deployed and accessible");
    console.log("Contract owner:", owner);
    
    // Register a test artist
    const artistId = "test-artist-" + Math.floor(Math.random() * 1000);
    console.log(`Registering artist with ID: ${artistId}`);
    
    try {
      const tx = await zkSyncArtistManager.registerArtist(artistId, artist.address);
      await tx.wait();
      console.log("Artist registered successfully");
      
      // Check artist wallet
      const artistWallet = await zkSyncArtistManager.artistWallets(artistId);
      console.log(`Artist wallet: ${artistWallet}`);
    } catch (error) {
      console.error("Error registering artist:", error.message);
    }
  } catch (error) {
    console.error("Error testing ZkSyncArtistManager contract:", error.message);
  }
  
  console.log("\nBlockchain integration testing completed.");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 