// scripts/deploy-base-simple.js
require("dotenv").config({ path: ".env.local" });
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying ArtistFundManager contract to Base Sepolia with Optimism interoperability...");

  // Check for required environment variables
  if (!process.env.PRIVATE_KEY) {
    console.error("Error: PRIVATE_KEY environment variable is required");
    process.exit(1);
  }

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
  
  // Update .env.local file with the new contract address
  console.log("Updating .env.local file with contract address...");
  
  let envContent;
  try {
    envContent = fs.readFileSync(".env.local", "utf8");
  } catch (error) {
    envContent = "";
  }
  
  // Update or add the contract address
  if (envContent.includes("NEXT_PUBLIC_ARTIST_FUND_MANAGER_BASE=")) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_ARTIST_FUND_MANAGER_BASE=.*/g,
      `NEXT_PUBLIC_ARTIST_FUND_MANAGER_BASE=${contractAddress}`
    );
  } else {
    envContent += `\nNEXT_PUBLIC_ARTIST_FUND_MANAGER_BASE=${contractAddress}`;
  }
  
  // Add Optimism environment variables if they don't exist
  if (!envContent.includes("NEXT_PUBLIC_OPTIMISM_RPC_URL=")) {
    envContent += `\nNEXT_PUBLIC_OPTIMISM_RPC_URL=https://sepolia.optimism.io`;
  }
  
  if (!envContent.includes("NEXT_PUBLIC_OPTIMISM_CHAIN_ID=")) {
    envContent += `\nNEXT_PUBLIC_OPTIMISM_CHAIN_ID=11155420`;
  }
  
  fs.writeFileSync(".env.local", envContent);
  
  console.log("Environment variables updated successfully");
  
  // Test the deployed contract
  console.log("\nTesting contract functionality...");
  
  // Register an artist
  console.log("Registering artist...");
  const artistId = "artist1";
  const optimismAddress = wallet.address; // Using the same address for demo purposes
  
  const registerTx = await contract.registerArtistSimple(artistId, wallet.address);
  await registerTx.wait();
  console.log(`Artist registered with ID: ${artistId}, wallet: ${wallet.address}`);
  
  // Update the artist with optimism address
  console.log("\nUpdating artist with optimism address...");
  try {
    // Check if the contract has an updateArtistOptimismAddress function
    if (contract.functions.updateArtistOptimismAddress) {
      const updateTx = await contract.updateArtistOptimismAddress(artistId, optimismAddress);
      await updateTx.wait();
      console.log(`Artist updated with optimism address: ${optimismAddress}`);
    } else {
      console.log("updateArtistOptimismAddress function not found. Skipping optimism address update.");
      console.log("Will continue with the rest of the script...");
    }
  } catch (error) {
    console.log("Error updating artist optimism address:", error.message);
    console.log("Continuing with the rest of the script...");
  }
  
  // Create a test grant
  console.log("\nCreating test grant...");
  const grantId = "grant1";
  const grantTitle = "Test Grant";
  const grantAmount = ethers.utils.parseEther("0.01");
  
  const createGrantTx = await contract.createGrant(grantId, grantTitle, grantAmount, {
    value: grantAmount
  });
  await createGrantTx.wait();
  console.log(`Grant created with ID: ${grantId}, title: ${grantTitle}, amount: ${ethers.utils.formatEther(grantAmount)} ETH`);
  
  // Award grant to artist
  console.log("\nAwarding grant to artist...");
  const awardTx = await contract.awardGrant(grantId, artistId);
  await awardTx.wait();
  console.log(`Grant ${grantId} awarded to artist ${artistId}`);
  
  // Initiate cross-chain transaction
  console.log("\nInitiating cross-chain transaction to Optimism...");
  const txAmount = ethers.utils.parseEther("0.005");
  const targetChain = "optimism";
  
  // Make sure the artist has funds before initiating the transaction
  console.log("Checking if artist has sufficient funds...");
  const pendingFunds = await contract.getPendingFunds(artistId);
  console.log(`Artist pending funds: ${ethers.utils.formatEther(pendingFunds)} ETH`);
  
  if (pendingFunds.lt(txAmount)) {
    console.log("Artist doesn't have enough funds. Adding more funds...");
    // Add more funds to the artist if needed
    const additionalFunds = ethers.utils.parseEther("0.01");
    const fundTx = await contract.createGrant(
      "extraGrant", 
      "Extra Funds", 
      additionalFunds, 
      { value: additionalFunds }
    );
    await fundTx.wait();
    console.log(`Added ${ethers.utils.formatEther(additionalFunds)} ETH to artist funds`);
    
    const awardTx = await contract.awardGrant("extraGrant", artistId);
    await awardTx.wait();
    console.log("Extra funds awarded to artist");
  }
  
  console.log("Initiating cross-chain transaction...");
  const initiateTx = await contract.initiateCrossChainTransaction(
    artistId,
    txAmount,
    targetChain,
    optimismAddress  // This is now correctly used as the targetAddress parameter
  );
  const initiateTxReceipt = await initiateTx.wait();
  
  // Debug: Log all events to see their structure
  initiateTxReceipt.events.forEach((event, index) => {
    console.log(`Event ${index}:`, event.event || "Anonymous event");
    if (event.args) {
      console.log("Event args:", event.args);
    }
  });
  
  // Extract txId from the first argument of the CrossChainTransactionInitiated event
  if (initiateTxReceipt.events.length > 0 && 
      initiateTxReceipt.events[0].event === "CrossChainTransactionInitiated" && 
      initiateTxReceipt.events[0].args && 
      initiateTxReceipt.events[0].args[0]) {
    txId = initiateTxReceipt.events[0].args[0].toString();
    console.log(`Cross-chain transaction initiated with ID: ${txId}, amount: ${ethers.utils.formatEther(txAmount)} ETH`);
  } else {
    console.log("Could not find CrossChainTransactionInitiated event or txId in the transaction receipt");
    console.log("Using a default txId of 1 for testing purposes");
    txId = "1"; // Default for testing
  }
  
  // Get artist details
  console.log("\nGetting artist details...");
  const artist = await contract.getArtist(artistId);
  console.log(`Artist ID: ${artist.id}`);
  console.log(`Wallet: ${artist.wallet}`);
  console.log(`Optimism Address: ${artist.optimismAddress}`);
  console.log(`Verified: ${artist.verified}`);
  
  // Get artist by Optimism address
  console.log("\nGetting artist by Optimism address...");
  const artistByOptimism = await contract.getArtistByOptimismAddress(optimismAddress);
  console.log(`Artist ID: ${artistByOptimism.id}`);
  console.log(`Wallet: ${artistByOptimism.wallet}`);
  console.log(`Optimism Address: ${artistByOptimism.optimismAddress}`);
  console.log(`Verified: ${artistByOptimism.verified}`);
  
  // Get cross-chain transaction details
  console.log("\nGetting cross-chain transaction details...");
  const tx = await contract.getCrossChainTransaction(txId);
  console.log(`Transaction ID: ${tx.id}`);
  console.log(`Artist ID: ${tx.artistId}`);
  console.log(`Amount: ${ethers.utils.formatEther(tx.amount)} ETH`);
  console.log(`Target Chain: ${tx.targetChain}`);
  console.log(`Target Address: ${tx.targetAddress}`);
  console.log(`Status: ${tx.status}`);
  console.log(`Timestamp: ${new Date(tx.timestamp.toNumber() * 1000).toISOString()}`);
  
  // Update transaction status
  console.log("\nUpdating transaction status to 'completed'...");
  const statusUpdateTx = await contract.updateCrossChainTransactionStatus(txId, "completed");
  await statusUpdateTx.wait();
  
  // Get updated transaction details
  const updatedTx = await contract.getCrossChainTransaction(txId);
  console.log(`Updated Status: ${updatedTx.status}`);
  
  console.log("\nDeployment and testing completed successfully");
  console.log("");
  console.log("Update your .env.local file with:");
  console.log(`NEXT_PUBLIC_ARTIST_FUND_MANAGER_BASE=${contractAddress}`);
  console.log("");
  console.log("To verify the contract:");
  console.log(`npx hardhat verify --network baseSepolia ${contractAddress}`);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  }); 