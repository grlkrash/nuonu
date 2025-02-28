// scripts/deploy-zksync.js
const hre = require("hardhat");
const { Wallet, Provider } = require("zksync-web3");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");

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
    console.log("");
    console.log("Update your .env.local file with:");
    console.log(`NEXT_PUBLIC_ARTIST_FUND_MANAGER_ZKSYNC=${contractAddress}`);
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
    console.log("");
    console.log("Add this to your .env.local file:");
    console.log(`ZKSYNC_SESSION_KEY=${sessionKeyPrivate}`);
    
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