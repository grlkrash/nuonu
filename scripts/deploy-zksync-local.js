// scripts/deploy-zksync-local.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying ZkSyncArtistManager contract to local Hardhat network...");

  // Get the contract factory
  const ZkSyncArtistManager = await hre.ethers.getContractFactory("ZkSyncArtistManager");
  
  // Deploy the contract
  const zkSyncArtistManager = await ZkSyncArtistManager.deploy();
  
  // Wait for deployment to complete
  await zkSyncArtistManager.waitForDeployment();
  
  // Get the deployed contract address
  const contractAddress = await zkSyncArtistManager.getAddress();
  
  console.log(`ZkSyncArtistManager deployed to: ${contractAddress}`);
  console.log("");
  console.log("Update your .env.local file with:");
  console.log(`NEXT_PUBLIC_ARTIST_FUND_MANAGER_ZKSYNC=${contractAddress}`);
  
  // Set up initial configuration
  console.log("Setting up initial configuration...");
  
  // Get the deployer address
  const [deployer] = await hre.ethers.getSigners();
  
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Contract address: ${contractAddress}`);
  
  // Register a test artist
  const testArtistId = "test-artist-1";
  const tx = await zkSyncArtistManager.registerArtist(testArtistId, deployer.address);
  await tx.wait();
  console.log(`Registered test artist with ID: ${testArtistId} and wallet: ${deployer.address}`);
  
  // Add a session key
  const sessionKey = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Hardhat account #1
  const addSessionTx = await zkSyncArtistManager.addSessionKey(testArtistId, sessionKey);
  await addSessionTx.wait();
  console.log(`Added session key ${sessionKey} for artist ${testArtistId}`);
  
  console.log("Deployment and setup completed successfully");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 