// scripts/deploy-base.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying ArtistFundManager contract to Base Sepolia...");

  // Get the contract factory
  const ArtistFundManager = await hre.ethers.getContractFactory("ArtistFundManager");
  
  // Deploy the contract
  const artistFundManager = await ArtistFundManager.deploy();
  
  // Wait for deployment to complete
  await artistFundManager.waitForDeployment();
  
  // Get the deployed contract address
  const contractAddress = await artistFundManager.getAddress();
  
  console.log(`ArtistFundManager deployed to: ${contractAddress}`);
  console.log("");
  console.log("Update your .env.local file with:");
  console.log(`NEXT_PUBLIC_BASE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("");
  console.log("To verify the contract:");
  console.log(`npx hardhat verify --network baseSepolia ${contractAddress}`);
  
  console.log("Deployment completed successfully");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 