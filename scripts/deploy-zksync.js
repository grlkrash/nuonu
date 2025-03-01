// scripts/deploy-zksync.js
const hre = require("hardhat");
const { Wallet, Provider } = require("zksync-web3");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying ZkSyncArtistManager contract to zkSync Era Testnet...");

  // Get network from hardhat config
  const network = hre.network.name;
  console.log(`Using network: ${network}`);

  try {
    // Initialize the provider
    const provider = new Provider("https://sepolia.era.zksync.dev");
    console.log("Provider initialized");

    // Check if private key exists
    const privateKey = process.env.ZKSYNC_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("ZKSYNC_PRIVATE_KEY not found in environment variables");
    }

    // Log private key length and format (without exposing the key)
    console.log(`Private key length: ${privateKey.length}`);
    console.log(`Has 0x prefix: ${privateKey.startsWith("0x")}`);

    // Use private key as is - do not modify it
    const wallet = new Wallet(privateKey, provider);
    console.log(`Wallet initialized with address: ${wallet.address}`);
    
    // Initialize the deployer with the connected wallet
    const deployer = new Deployer(hre, wallet);
    console.log("Deployer initialized");
    
    // Load the artifact
    const artifact = await deployer.loadArtifact("ZkSyncArtistManager");
    console.log("Artifact loaded");
    
    // Deploy the contract
    console.log("Deploying contract...");
    const zkSyncArtistManager = await deployer.deploy(artifact);
    
    // Get the deployed contract address
    const contractAddress = zkSyncArtistManager.address;
    
    console.log(`ZkSyncArtistManager deployed to: ${contractAddress}`);
    
    // Update .env.local with the contract address
    const envPath = path.resolve(__dirname, '../.env.local');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace or add the contract address
    if (envContent.includes('NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS=${contractAddress}`;
    }
    
    if (envContent.includes('NEXT_PUBLIC_ARTIST_FUND_MANAGER_ZKSYNC=')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_ARTIST_FUND_MANAGER_ZKSYNC=.*/,
        `NEXT_PUBLIC_ARTIST_FUND_MANAGER_ZKSYNC=${contractAddress}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_ARTIST_FUND_MANAGER_ZKSYNC=${contractAddress}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated .env.local with zkSync contract address: ${contractAddress}`);
    
    console.log("");
    console.log("To verify the contract:");
    console.log(`npx hardhat verify --network zkSyncTestnet ${contractAddress}`);
    
    // Register the deployer as an artist first
    console.log("Registering deployer as artist...");
    const registerTx = await zkSyncArtistManager.registerArtist("admin", wallet.address);
    await registerTx.wait();
    console.log("Artist registered");
    
    // Create a session key for the contract
    console.log("Creating session key...");
    
    // Generate a new session key
    const sessionKeyPrivate = Wallet.createRandom().privateKey;
    const sessionKeyWallet = new Wallet(sessionKeyPrivate);
    const sessionKeyAddress = sessionKeyWallet.address;
    
    // Register the session key with the contract
    const addKeyTx = await zkSyncArtistManager.addSessionKey("admin", sessionKeyAddress);
    await addKeyTx.wait();
    
    console.log(`Session key created and registered: ${sessionKeyAddress}`);
    console.log(`Session key private key (keep secure!): ${sessionKeyPrivate}`);
    
    // Update .env.local with the session key
    if (envContent.includes('ZKSYNC_SESSION_KEY=')) {
      envContent = envContent.replace(
        /ZKSYNC_SESSION_KEY=.*/,
        `ZKSYNC_SESSION_KEY=${sessionKeyPrivate}`
      );
    } else {
      envContent += `\nZKSYNC_SESSION_KEY=${sessionKeyPrivate}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated .env.local with zkSync session key`);
    
    // Create a test grant
    console.log("Creating a test grant...");
    const grantAmount = hre.ethers.utils.parseEther("0.01");
    const createGrantTx = await zkSyncArtistManager.createGrant(
      "test-grant-1",
      "Test Grant",
      grantAmount,
      { value: grantAmount }
    );
    await createGrantTx.wait();
    console.log(`Test grant created with amount: ${hre.ethers.utils.formatEther(grantAmount)} ETH`);
    
    console.log("Deployment and setup completed successfully");
  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 