const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment process...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  
  const balance = await deployer.getBalance();
  console.log(`Account balance: ${ethers.utils.formatEther(balance)} ETH`);

  // Deploy ArtistToken
  console.log("\nDeploying ArtistToken...");
  const ArtistToken = await ethers.getContractFactory("ArtistToken");
  const artistToken = await ArtistToken.deploy(
    "Artist Governance Token", 
    "ARTIST",
    ethers.utils.parseEther("10000000") // 10 million initial supply
  );
  await artistToken.deployed();
  console.log(`ArtistToken deployed to: ${artistToken.address}`);

  // Deploy TimelockController for DAO governance
  console.log("\nDeploying TimelockController...");
  const TimelockController = await ethers.getContractFactory("TimelockController");
  const minDelay = 2 * 24 * 60 * 60; // 2 days in seconds
  const proposers = [deployer.address];
  const executors = [deployer.address];
  const timelockController = await TimelockController.deploy(
    minDelay,
    proposers,
    executors,
    deployer.address
  );
  await timelockController.deployed();
  console.log(`TimelockController deployed to: ${timelockController.address}`);

  // Deploy ArtistDAO
  console.log("\nDeploying ArtistDAO...");
  const ArtistDAO = await ethers.getContractFactory("ArtistDAO");
  const artistDAO = await ArtistDAO.deploy(
    artistToken.address,
    timelockController.address
  );
  await artistDAO.deployed();
  console.log(`ArtistDAO deployed to: ${artistDAO.address}`);

  // Deploy FundDistribution
  console.log("\nDeploying FundDistribution...");
  const FundDistribution = await ethers.getContractFactory("FundDistribution");
  const fundDistribution = await FundDistribution.deploy(
    artistToken.address,
    artistDAO.address
  );
  await fundDistribution.deployed();
  console.log(`FundDistribution deployed to: ${fundDistribution.address}`);

  // Deploy ArtistNFT
  console.log("\nDeploying ArtistNFT...");
  const ArtistNFT = await ethers.getContractFactory("ArtistNFT");
  const artistNFT = await ArtistNFT.deploy(
    "Artist NFT Collection",
    "ARTNFT",
    "https://artist-grant-ai-agent.com/api/metadata/"
  );
  await artistNFT.deployed();
  console.log(`ArtistNFT deployed to: ${artistNFT.address}`);

  // Setup roles and permissions
  console.log("\nSetting up roles and permissions...");
  
  // Grant minter role to deployer in ArtistToken
  const MINTER_ROLE = await artistToken.MINTER_ROLE();
  await artistToken.grantRole(MINTER_ROLE, deployer.address);
  console.log("Granted MINTER_ROLE to deployer in ArtistToken");
  
  // Grant minter role to FundDistribution in ArtistToken
  await artistToken.grantRole(MINTER_ROLE, fundDistribution.address);
  console.log("Granted MINTER_ROLE to FundDistribution in ArtistToken");

  // Transfer ownership of ArtistNFT to DAO
  await artistNFT.transferOwnership(artistDAO.address);
  console.log("Transferred ownership of ArtistNFT to ArtistDAO");

  // Grant proposer role to ArtistDAO in TimelockController
  const PROPOSER_ROLE = await timelockController.PROPOSER_ROLE();
  await timelockController.grantRole(PROPOSER_ROLE, artistDAO.address);
  console.log("Granted PROPOSER_ROLE to ArtistDAO in TimelockController");

  // Grant executor role to ArtistDAO in TimelockController
  const EXECUTOR_ROLE = await timelockController.EXECUTOR_ROLE();
  await timelockController.grantRole(EXECUTOR_ROLE, artistDAO.address);
  console.log("Granted EXECUTOR_ROLE to ArtistDAO in TimelockController");

  // Revoke admin role from deployer in TimelockController
  const TIMELOCK_ADMIN_ROLE = await timelockController.TIMELOCK_ADMIN_ROLE();
  await timelockController.revokeRole(TIMELOCK_ADMIN_ROLE, deployer.address);
  console.log("Revoked TIMELOCK_ADMIN_ROLE from deployer in TimelockController");

  console.log("\nDeployment completed successfully!");
  console.log("\nContract Addresses:");
  console.log(`- ArtistToken: ${artistToken.address}`);
  console.log(`- TimelockController: ${timelockController.address}`);
  console.log(`- ArtistDAO: ${artistDAO.address}`);
  console.log(`- FundDistribution: ${fundDistribution.address}`);
  console.log(`- ArtistNFT: ${artistNFT.address}`);

  // Write deployment addresses to a file for future reference
  const fs = require("fs");
  const deploymentInfo = {
    network: network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      ArtistToken: artistToken.address,
      TimelockController: timelockController.address,
      ArtistDAO: artistDAO.address,
      FundDistribution: fundDistribution.address,
      ArtistNFT: artistNFT.address
    }
  };

  fs.writeFileSync(
    `deployment-${network.name}-${Math.floor(Date.now() / 1000)}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment information saved to file.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 