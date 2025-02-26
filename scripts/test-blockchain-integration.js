#!/usr/bin/env node

// scripts/test-blockchain-integration.js
const hre = require("hardhat");
require("dotenv").config({ path: ".env.local" });

// Define minimal ABIs for testing
const FUND_DISTRIBUTION_ABI = [
  "function ADMIN_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function getGrant(uint256 grantId) view returns (tuple(uint256 id, string title, string description, uint256 amount, address token, uint256 deadline, address creator, bool active, uint256 remainingAmount))",
  "function getGrantsCount() view returns (uint256)"
];

const ZKSYNC_ARTIST_MANAGER_ABI = [
  "function owner() view returns (address)",
  "function artistWallets(string) view returns (address)",
  "function pendingFunds(string) view returns (uint256)",
  "function artistSessionKeys(string, uint256) view returns (address)"
];

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
  
  // Get the deployer address
  const [deployer, artist] = await hre.ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Artist address: ${artist.address}`);
  console.log("");
  
  // Test FundDistribution contract
  console.log("--- Testing FundDistribution Contract ---");
  try {
    // Create contract instance with the minimal ABI
    const fundDistribution = new hre.ethers.Contract(
      fundDistributionAddress,
      FUND_DISTRIBUTION_ABI,
      deployer
    );
    
    // Test if contract is deployed by calling a view function
    try {
      const adminRole = await fundDistribution.ADMIN_ROLE();
      console.log(`Admin role: ${adminRole}`);
      
      // Check if deployer has admin role
      const hasAdminRole = await fundDistribution.hasRole(adminRole, deployer.address);
      console.log(`Deployer has admin role: ${hasAdminRole}`);
      
      // Get grants count
      try {
        const grantsCount = await fundDistribution.getGrantsCount();
        console.log(`Grants count: ${grantsCount}`);
        
        // Try to get a grant if any exist
        if (grantsCount > 0) {
          const grant = await fundDistribution.getGrant(0);
          console.log(`First grant title: ${grant.title}`);
        }
      } catch (error) {
        console.log(`No grants found or error accessing grants: ${error.message}`);
      }
      
    } catch (error) {
      console.error(`Error accessing admin role: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error testing FundDistribution contract: ${error.message}`);
  }
  
  console.log("");
  
  // Test ZkSyncArtistManager contract
  console.log("--- Testing ZkSyncArtistManager Contract ---");
  try {
    // Create contract instance with the minimal ABI
    const zkSyncArtistManager = new hre.ethers.Contract(
      zkSyncArtistManagerAddress,
      ZKSYNC_ARTIST_MANAGER_ABI,
      deployer
    );
    
    // Test if contract is deployed by calling a view function
    try {
      const ownerAddress = await zkSyncArtistManager.owner();
      console.log(`Contract owner: ${ownerAddress}`);
      
      // Test artist wallet lookup
      const testArtistId = "test_artist_" + Date.now();
      try {
        const artistWallet = await zkSyncArtistManager.artistWallets(testArtistId);
        console.log(`Artist wallet for ${testArtistId}: ${artistWallet}`);
      } catch (error) {
        console.log(`No artist found or error accessing artist wallet: ${error.message}`);
      }
      
      // Test pending funds lookup
      try {
        const pendingFunds = await zkSyncArtistManager.pendingFunds(testArtistId);
        console.log(`Pending funds for ${testArtistId}: ${pendingFunds}`);
      } catch (error) {
        console.log(`Error accessing pending funds: ${error.message}`);
      }
      
    } catch (error) {
      console.error(`Error accessing owner: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error testing ZkSyncArtistManager contract: ${error.message}`);
  }
  
  console.log("");
  console.log("Blockchain integration testing completed.");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 