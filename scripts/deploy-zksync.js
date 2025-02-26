// scripts/deploy-zksync.js
const hre = require("hardhat");
const { Wallet, Provider } = require("zksync-web3");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");

async function main() {
  console.log("Deploying ZkSyncArtistManager contract to zkSync Era Testnet...");

  // Initialize the wallet
  const provider = new Provider(process.env.ZKSYNC_TESTNET_RPC || "https://testnet.era.zksync.dev");
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
  
  // Initialize the deployer
  const deployer = new Deployer(hre, wallet);
  
  // Load the artifact
  const artifact = await deployer.loadArtifact("ZkSyncArtistManager");
  
  // Deploy the contract
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
  
  // Set up initial roles
  console.log("Setting up initial configuration...");
  
  // Initialize the contract with the deployer as the owner
  const initTx = await zkSyncArtistManager.initialize(wallet.address);
  await initTx.wait();
  
  console.log(`Contract initialized with owner: ${wallet.address}`);
  
  // Create a session key for the contract
  console.log("Creating session key...");
  
  // Generate a new session key
  const sessionKeyPrivate = Wallet.createRandom().privateKey;
  const sessionKeyWallet = new Wallet(sessionKeyPrivate);
  const sessionKeyAddress = sessionKeyWallet.address;
  
  // Register the session key with the contract
  const registerTx = await zkSyncArtistManager.registerSessionKey(sessionKeyAddress, true);
  await registerTx.wait();
  
  console.log(`Session key created and registered: ${sessionKeyAddress}`);
  console.log(`Session key private key (keep secure!): ${sessionKeyPrivate}`);
  console.log("");
  console.log("Add this to your .env.local file:");
  console.log(`ZKSYNC_SESSION_KEY=${sessionKeyPrivate}`);
  
  console.log("Deployment and setup completed successfully");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 