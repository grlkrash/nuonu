// scripts/deploy-base-simple.js
require("dotenv").config({ path: ".env.local" });
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying ArtistFundManager contract to Base Sepolia...");

  // Load contract artifact
  const artifactPath = path.join(__dirname, "../src/artifacts/src/contracts/base/ArtistFundManager.sol/ArtistFundManager.json");
  const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Configure provider and wallet
  const provider = new ethers.providers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org");
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`Deploying from address: ${wallet.address}`);
  
  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`Wallet balance: ${ethers.utils.formatEther(balance)} ETH`);
  
  if (balance.eq(0)) {
    console.error("Error: Wallet has no ETH. Please fund your wallet before deploying.");
    process.exit(1);
  }
  
  // Create contract factory
  const factory = new ethers.ContractFactory(
    contractArtifact.abi,
    contractArtifact.bytecode,
    wallet
  );
  
  // Deploy contract
  console.log("Deploying contract...");
  const contract = await factory.deploy();
  console.log(`Transaction hash: ${contract.deployTransaction.hash}`);
  
  // Wait for deployment to complete
  console.log("Waiting for deployment confirmation...");
  await contract.deployed();
  
  // Get the deployed contract address
  const contractAddress = contract.address;
  
  console.log(`ArtistFundManager deployed to: ${contractAddress}`);
  console.log("");
  console.log("Update your .env.local file with:");
  console.log(`NEXT_PUBLIC_ARTIST_FUND_MANAGER_BASE=${contractAddress}`);
  console.log("");
  console.log("To verify the contract:");
  console.log(`npx hardhat verify --network baseSepolia ${contractAddress}`);
  
  console.log("Deployment completed successfully");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  }); 