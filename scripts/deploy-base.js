// scripts/deploy-base.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying FundDistribution contract to Base Goerli...");

  // Get the contract factory
  const FundDistribution = await hre.ethers.getContractFactory("FundDistribution");
  
  // Deploy the contract
  const fundDistribution = await FundDistribution.deploy();
  
  // Wait for deployment to complete
  await fundDistribution.waitForDeployment();
  
  // Get the deployed contract address
  const contractAddress = await fundDistribution.getAddress();
  
  console.log(`FundDistribution deployed to: ${contractAddress}`);
  console.log("");
  console.log("Update your .env.local file with:");
  console.log(`NEXT_PUBLIC_ARTIST_FUND_MANAGER_BASE=${contractAddress}`);
  console.log("");
  console.log("To verify the contract:");
  console.log(`npx hardhat verify --network baseGoerli ${contractAddress}`);
  
  // Set up initial roles
  console.log("Setting up initial roles...");
  
  // Get the deployer address
  const [deployer] = await hre.ethers.getSigners();
  
  // Grant ADMIN_ROLE to deployer
  const ADMIN_ROLE = await fundDistribution.ADMIN_ROLE();
  const DISTRIBUTOR_ROLE = await fundDistribution.DISTRIBUTOR_ROLE();
  
  // Check if deployer already has ADMIN_ROLE
  const hasAdminRole = await fundDistribution.hasRole(ADMIN_ROLE, deployer.address);
  
  if (!hasAdminRole) {
    console.log(`Granting ADMIN_ROLE to ${deployer.address}...`);
    const tx = await fundDistribution.grantRole(ADMIN_ROLE, deployer.address);
    await tx.wait();
    console.log("ADMIN_ROLE granted successfully");
  } else {
    console.log(`${deployer.address} already has ADMIN_ROLE`);
  }
  
  // Grant DISTRIBUTOR_ROLE to deployer
  const hasDistributorRole = await fundDistribution.hasRole(DISTRIBUTOR_ROLE, deployer.address);
  
  if (!hasDistributorRole) {
    console.log(`Granting DISTRIBUTOR_ROLE to ${deployer.address}...`);
    const tx = await fundDistribution.grantRole(DISTRIBUTOR_ROLE, deployer.address);
    await tx.wait();
    console.log("DISTRIBUTOR_ROLE granted successfully");
  } else {
    console.log(`${deployer.address} already has DISTRIBUTOR_ROLE`);
  }
  
  console.log("Deployment and setup completed successfully");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 