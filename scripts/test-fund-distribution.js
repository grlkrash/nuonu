// scripts/test-fund-distribution.js
const hre = require("hardhat");

async function main() {
  console.log("Testing fund distribution...");
  
  // Get the deployed ZkSyncArtistManager contract
  const zkSyncArtistManagerAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const ZkSyncArtistManager = await hre.ethers.getContractFactory("ZkSyncArtistManager");
  const zkSyncArtistManager = ZkSyncArtistManager.attach(zkSyncArtistManagerAddress);
  
  // Get the deployer and artist addresses
  const [deployer, artist] = await hre.ethers.getSigners();
  
  console.log("Deployer address:", deployer.address);
  console.log("Artist address:", artist.address);
  
  // Get the test artist ID
  const testArtistId = "test-artist-1";
  
  // Check pending funds before distribution
  const pendingFundsBefore = await zkSyncArtistManager.getPendingFunds(testArtistId);
  console.log(`Pending funds before distribution: ${hre.ethers.formatEther(pendingFundsBefore)} ETH`);
  
  // Get artist wallet balance before distribution
  const artistWallet = await zkSyncArtistManager.artistWallets(testArtistId);
  const artistBalanceBefore = await hre.ethers.provider.getBalance(artistWallet);
  console.log(`Artist wallet balance before distribution: ${hre.ethers.formatEther(artistBalanceBefore)} ETH`);
  
  // Distribute funds to the artist
  console.log("Distributing funds to the artist...");
  const distributeTx = await zkSyncArtistManager.distributeFunds(testArtistId);
  await distributeTx.wait();
  console.log("Funds distributed successfully");
  
  // Check pending funds after distribution
  const pendingFundsAfter = await zkSyncArtistManager.getPendingFunds(testArtistId);
  console.log(`Pending funds after distribution: ${hre.ethers.formatEther(pendingFundsAfter)} ETH`);
  
  // Get artist wallet balance after distribution
  const artistBalanceAfter = await hre.ethers.provider.getBalance(artistWallet);
  console.log(`Artist wallet balance after distribution: ${hre.ethers.formatEther(artistBalanceAfter)} ETH`);
  
  // Calculate the difference
  const balanceDifference = artistBalanceAfter - artistBalanceBefore;
  console.log(`Balance difference: ${hre.ethers.formatEther(balanceDifference)} ETH`);
  
  console.log("\nFund distribution test completed successfully");
}

// Execute the test
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 