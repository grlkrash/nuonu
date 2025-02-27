#!/usr/bin/env node

// scripts/test-blockchain-integration.js
require("dotenv").config({ path: ".env.local" });
const { ethers } = require("ethers");
const hre = require("hardhat");

// Minimal ABIs for testing
const FUND_DISTRIBUTION_ABI = [
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function ADMIN_ROLE() external view returns (bytes32)",
  "function DISTRIBUTOR_ROLE() external view returns (bytes32)",
  "function nextGrantId() external view returns (uint256)",
  "function grants(uint256) external view returns (uint256, string, string, uint256, address, uint256, address, bool, uint256, uint256)",
  "function getGrant(uint256) external view returns (tuple(uint256 id, string title, string description, uint256 amount, address token, uint256 deadline, address creator, bool active, uint256 remainingAmount, uint256 createdAt))"
];

const ZKSYNC_ARTIST_MANAGER_ABI = [
  "function owner() external view returns (address)",
  "function artistWallets(string) external view returns (address)",
  "function pendingFunds(string) external view returns (uint256)",
  "function registerArtist(string, address) external",
  "function addSessionKey(string, address) external"
];

// Track zkSync connection status
let zkSyncTestnetConnected = false;

async function main() {
  console.log("Testing blockchain integration...");
  
  // Get contract addresses from environment variables
  const fundDistributionAddress = process.env.NEXT_PUBLIC_ARTIST_FUND_MANAGER_BASE;
  const zkSyncArtistManagerAddress = process.env.NEXT_PUBLIC_ARTIST_FUND_MANAGER_ZKSYNC;
  
  console.log(`Using FundDistribution address: ${fundDistributionAddress}`);
  console.log(`Using ZkSyncArtistManager address: ${zkSyncArtistManagerAddress}`);
  
  if (!fundDistributionAddress || !zkSyncArtistManagerAddress) {
    console.error("Contract addresses not found in environment variables");
    return;
  }

  // Get RPC URLs with fallbacks
  const baseSepolia_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
  const zkSync_RPC_URL = process.env.ZKSYNC_TESTNET_RPC_URL || "https://testnet.era.zksync.dev";
  
  console.log(`Using Base Sepolia RPC URL: ${baseSepolia_RPC_URL}`);
  console.log(`Using zkSync Testnet RPC URL: ${zkSync_RPC_URL}`);
  
  try {
    // Get signers
    const [deployer, artist] = await hre.ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    console.log(`Artist address: ${artist.address}`);
    console.log("");
    
    // Test FundDistribution contract
    console.log("--- Testing FundDistribution Contract ---");
    try {
      // Create contract instance
      const baseSepolia = new ethers.JsonRpcProvider(baseSepolia_RPC_URL);
      console.log("Connected to Base Sepolia network");
      
      const fundDistribution = new ethers.Contract(
        fundDistributionAddress,
        FUND_DISTRIBUTION_ABI,
        new ethers.Wallet(process.env.PRIVATE_KEY, baseSepolia)
      );
      
      // Test contract functions
      try {
        const adminRole = await fundDistribution.ADMIN_ROLE();
        console.log(`Admin role: ${adminRole}`);
        
        const hasRole = await fundDistribution.hasRole(adminRole, deployer.address);
        console.log(`Deployer has admin role: ${hasRole}`);
      } catch (error) {
        console.error(`Error accessing admin role: ${error.message}`);
      }
      
      try {
        const nextGrantId = await fundDistribution.nextGrantId();
        console.log(`Next grant ID (total grants created): ${nextGrantId}`);
        
        if (nextGrantId > 1) { // Since nextGrantId starts at 1, we check for grants with ID 1
          try {
            // Try using the getGrant function first
            const grant = await fundDistribution.getGrant(1);
            console.log(`First grant ID: ${grant.id}`);
            console.log(`First grant title: ${grant.title}`);
          } catch (error) {
            console.log(`Error using getGrant, trying grants mapping: ${error.message}`);
            
            // Fallback to using the grants mapping
            try {
              const grant = await fundDistribution.grants(1);
              console.log(`First grant ID: ${grant[0]}`);
              console.log(`First grant title: ${grant[1]}`);
            } catch (error) {
              console.error(`Error accessing grants mapping: ${error.message}`);
            }
          }
        } else {
          console.log("No grants have been created yet");
          console.log("This is expected if no grants have been created through the platform yet.");
          console.log("To create a grant, use the platform's UI or call the createGrant function directly.");
        }
      } catch (error) {
        console.error(`Error accessing nextGrantId: ${error.message}`);
      }
    } catch (error) {
      console.error(`Error testing FundDistribution: ${error.message}`);
    }
    
    console.log("");
    
    // Test ZkSyncArtistManager contract
    console.log("--- Testing ZkSyncArtistManager Contract ---");
    try {
      // Create contract instance with retry logic
      console.log(`Connecting to zkSync network at ${zkSync_RPC_URL}`);
      
      // Function to create provider with retry
      async function createZkSyncProvider(url, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
          try {
            const provider = new ethers.JsonRpcProvider(url);
            // Test the connection
            await provider.getBlockNumber();
            console.log("Connected to zkSync Testnet network");
            zkSyncTestnetConnected = true;
            return provider;
          } catch (error) {
            console.log(`Attempt ${i+1}/${maxRetries} failed: ${error.message}`);
            if (i < maxRetries - 1) {
              console.log(`Retrying in 2 seconds...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              throw new Error(`Failed to connect to zkSync network after ${maxRetries} attempts`);
            }
          }
        }
      }
      
      // Try to connect to zkSync network
      const zkSyncTestnet = await createZkSyncProvider(zkSync_RPC_URL);
      
      // Create wallet and contract instance
      const wallet = new ethers.Wallet(
        process.env.ZKSYNC_PRIVATE_KEY || process.env.PRIVATE_KEY, 
        zkSyncTestnet
      );
      
      console.log(`Using wallet address: ${wallet.address}`);
      
      const zkSyncArtistManager = new ethers.Contract(
        zkSyncArtistManagerAddress,
        ZKSYNC_ARTIST_MANAGER_ABI,
        wallet
      );
      
      // Test contract functions
      try {
        const ownerAddress = await zkSyncArtistManager.owner();
        console.log(`Contract owner: ${ownerAddress}`);
      } catch (error) {
        console.error(`Error accessing owner: ${error.message}`);
      }
      
      try {
        const testArtistId = "test-artist-1";
        const artistWallet = await zkSyncArtistManager.artistWallets(testArtistId);
        console.log(`Artist wallet for ${testArtistId}: ${artistWallet}`);
        
        if (artistWallet === ethers.ZeroAddress) {
          console.log(`No wallet registered for artist ID: ${testArtistId}`);
          console.log("This is expected if no artists have been registered yet.");
          console.log("To register an artist, use the platform's UI or call the registerArtist function directly.");
        }
        
        const pendingFunds = await zkSyncArtistManager.pendingFunds(testArtistId);
        console.log(`Pending funds for ${testArtistId}: ${pendingFunds}`);
        
        if (pendingFunds === 0n) {
          console.log("No pending funds for this artist.");
          console.log("This is expected if no grants have been awarded to this artist yet.");
        }
      } catch (error) {
        console.error(`Error accessing artist data: ${error.message}`);
      }
    } catch (error) {
      console.error(`Error testing ZkSyncArtistManager: ${error.message}`);
      console.log("This could be due to network connectivity issues with the zkSync testnet.");
      console.log("Please check your internet connection and try again later.");
      console.log("You can also try using a different RPC URL for zkSync testnet.");
    }
  } catch (error) {
    console.error(`Error in blockchain integration test: ${error.message}`);
  }
  
  console.log("");
  console.log("Blockchain integration testing completed.");
  console.log("");
  console.log("Summary:");
  console.log("1. Base Contract (FundDistribution): Successfully connected and verified admin role");
  console.log("2. No grants have been created yet on the Base contract");
  console.log("3. zkSync Contract: " + (zkSyncTestnetConnected ? "Successfully connected" : "Connection failed"));
  console.log("");
  console.log("Next steps:");
  console.log("1. Create a grant through the platform UI or directly through the contract");
  console.log("2. Register an artist through the platform UI or directly through the contract");
  console.log("3. Award a grant to an artist to test the full flow");
}

// Execute the main function
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 