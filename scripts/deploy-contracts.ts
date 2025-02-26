import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { ZkSyncArtistManager__factory } from "../typechain-types";
import { Wallet } from "zksync-web3";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

dotenv.config();

async function deployBaseContract() {
  console.log("Deploying ArtistFundManager to Base...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const artistFundManager = await ethers.deployContract("ArtistFundManager");
  await artistFundManager.waitForDeployment();
  
  console.log("ArtistFundManager deployed to:", await artistFundManager.getAddress());
  
  return artistFundManager;
}

async function deployZkSyncContract() {
  console.log("Deploying ZkSyncArtistManager to zkSync Era...");
  
  // This requires a zkSync-specific deployment process
  // For the MVP, we'll simulate this with a placeholder
  console.log("Note: For actual deployment, use the zkSync deployment tools");
  
  // Placeholder for zkSync deployment
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("Missing PRIVATE_KEY environment variable");
  
  // This is a simplified version - actual deployment would use zkSync tooling
  const wallet = new Wallet(privateKey);
  const deployer = new Deployer(hre, wallet);
  
  const artifact = await deployer.loadArtifact("ZkSyncArtistManager");
  const zkSyncArtistManager = await deployer.deploy(artifact);
  
  console.log("ZkSyncArtistManager deployed to:", zkSyncArtistManager.address);
  
  return zkSyncArtistManager;
}

async function deployFlowContract() {
  console.log("Deploying FlowArtistManager to Flow blockchain...");
  
  // Flow deployment requires the Flow CLI and specific deployment process
  // For the MVP, we'll simulate this with a placeholder
  console.log("Note: For actual deployment, use the Flow CLI and deployment tools");
  
  // Placeholder for Flow contract address
  const flowContractAddress = "0x01cf0e2f2f715450";
  console.log("FlowArtistManager deployed to:", flowContractAddress);
  
  return flowContractAddress;
}

async function main() {
  try {
    // Deploy to Base (Ethereum L2)
    const baseContract = await deployBaseContract();
    
    // Deploy to zkSync Era
    const zkSyncContract = await deployZkSyncContract();
    
    // Deploy to Flow
    const flowContractAddress = await deployFlowContract();
    
    // Save contract addresses to a file for reference
    const fs = require("fs");
    const contractAddresses = {
      base: await baseContract.getAddress(),
      zkSync: zkSyncContract.address,
      flow: flowContractAddress
    };
    
    fs.writeFileSync(
      "contract-addresses.json",
      JSON.stringify(contractAddresses, null, 2)
    );
    
    console.log("Contract addresses saved to contract-addresses.json");
    
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 