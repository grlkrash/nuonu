const hre = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
  console.log("Testing end-to-end user flow...");
  
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
  
  // Get signers (accounts)
  const [admin, artist] = await hre.ethers.getSigners();
  
  console.log("Admin address:", admin.address);
  console.log("Artist address:", artist.address);
  
  // Test FundDistribution contract
  console.log("\n--- Testing FundDistribution Contract ---");
  
  // Check if admin has the ADMIN_ROLE
  const adminRole = await fundDistribution.ADMIN_ROLE();
  const hasAdminRole = await fundDistribution.hasRole(adminRole, admin.address);
  console.log(`Admin has ADMIN_ROLE: ${hasAdminRole}`);
  
  if (!hasAdminRole) {
    console.log("Granting ADMIN_ROLE to admin...");
    const tx = await fundDistribution.grantRole(adminRole, admin.address);
    await tx.wait();
    console.log("ADMIN_ROLE granted successfully");
  }
  
  // Create a new grant
  console.log("\nCreating a new grant...");
  try {
    const createGrantTx = await fundDistribution.createGrant(
      "Artist Innovation Grant",
      "Supporting innovative artistic projects",
      hre.ethers.parseEther("1.0"),
      "0x0000000000000000000000000000000000000000", // Native token (ETH)
      Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
      true
    );
    await createGrantTx.wait();
    console.log("Grant created successfully");
    
    // Get grant details
    const grant = await fundDistribution.getGrant(1);
    console.log("Grant details:", {
      id: grant.id,
      title: grant.title,
      description: grant.description,
      amount: hre.ethers.formatEther(grant.amount),
      active: grant.active
    });
  } catch (error) {
    console.error(`Failed to create grant: ${error.message}`);
  }
  
  // Test ZkSyncArtistManager contract
  console.log("\n--- Testing ZkSyncArtistManager Contract ---");
  
  // Register an artist
  const artistId = "test-artist-" + Math.floor(Math.random() * 1000);
  console.log(`Registering artist with ID: ${artistId}`);
  
  try {
    const registerArtistTx = await zkSyncArtistManager.registerArtist(artistId, artist.address);
    await registerArtistTx.wait();
    console.log("Artist registered successfully");
    
    // Check artist wallet
    const artistWallet = await zkSyncArtistManager.artistWallets(artistId);
    console.log(`Artist wallet: ${artistWallet}`);
    
    // Add funds for the artist
    console.log("\nAdding funds for the artist...");
    const addFundsTx = await zkSyncArtistManager.addFunds(
      "opportunity-123",
      artistId,
      hre.ethers.parseEther("0.5"),
      { value: hre.ethers.parseEther("0.5") }
    );
    await addFundsTx.wait();
    console.log("Funds added successfully");
    
    // Check pending funds
    const pendingFunds = await zkSyncArtistManager.getPendingFunds(artistId);
    console.log(`Pending funds: ${hre.ethers.formatEther(pendingFunds)} ETH`);
    
    // Distribute funds
    console.log("\nDistributing funds to artist...");
    const distributeFundsTx = await zkSyncArtistManager.distributeFunds(artistId);
    await distributeFundsTx.wait();
    console.log("Funds distributed successfully");
    
    // Check pending funds after distribution
    const pendingFundsAfter = await zkSyncArtistManager.getPendingFunds(artistId);
    console.log(`Pending funds after distribution: ${hre.ethers.formatEther(pendingFundsAfter)} ETH`);
  } catch (error) {
    console.error(`Failed to test ZkSyncArtistManager: ${error.message}`);
  }
  
  console.log("\nUser flow testing completed.");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 