// scripts/test-agentkit-contract.js
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const { 
  AgentKit,
  CdpWalletProvider,
  wethActionProvider,
  pythActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider
} = require("@coinbase/agentkit");
const { Coinbase } = require("@coinbase/coinbase-sdk");

// File paths
const WALLET_DATA_FILE = path.resolve(process.cwd(), "wallet-data.json");
const API_KEY_JSON_PATH = path.resolve(process.cwd(), "cdp_api_key.json");

// Network configuration
const NETWORK_ID = "base-sepolia";
const CONTRACT_ADDRESS = "0xDF8f4BD01cA6CA917B29b833eDC39A48D347B584";
const CONTRACT_ABI_PATH = path.join(__dirname, "../src/artifacts/src/contracts/base/ArtistFundManager.sol/ArtistFundManager.json");

// Load contract ABI
const contractArtifact = JSON.parse(fs.readFileSync(CONTRACT_ABI_PATH, "utf8"));
const contractABI = contractArtifact.abi;

async function main() {
  console.log("Testing AgentKit interaction with ArtistFundManager contract...");
  console.log(`Network: ${NETWORK_ID}`);
  console.log(`Contract Address: ${CONTRACT_ADDRESS}`);

  try {
    // Load API key from JSON file
    const apiKeyJson = JSON.parse(fs.readFileSync(API_KEY_JSON_PATH, "utf8"));
    console.log(`Using API key: ${apiKeyJson.name.split('/').pop()}`);

    // Configure Coinbase SDK with the JSON file
    Coinbase.configure({
      apiKeyName: apiKeyJson.name.split('/').pop(),
      privateKey: apiKeyJson.privateKey
    });
    console.log('Coinbase SDK configured successfully');

    // Load or initialize wallet data
    let walletDataStr;
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
        console.log("Loaded existing wallet data");
      } catch (error) {
        console.error("Error reading wallet data:", error);
      }
    }

    // Configure the wallet provider
    const config = {
      apiKeyName: apiKeyJson.name.split('/').pop(),
      apiKeyPrivateKey: apiKeyJson.privateKey,
      cdpWalletData: walletDataStr,
      networkId: NETWORK_ID,
    };

    console.log("Initializing CDP wallet provider...");
    const walletProvider = await CdpWalletProvider.configureWithWallet(config);
    
    // Initialize AgentKit with all required action providers
    console.log('Initializing AgentKit with action providers...');
    const agentkit = new AgentKit({
      walletProvider,
      actionProviders: [
        wethActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        cdpApiActionProvider({
          apiKeyName: apiKeyJson.name.split('/').pop(),
          apiKeyPrivateKey: apiKeyJson.privateKey,
        }),
        cdpWalletActionProvider({
          apiKeyName: apiKeyJson.name.split('/').pop(),
          apiKeyPrivateKey: apiKeyJson.privateKey,
        }),
      ],
    });
    
    // Save wallet data for future use
    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));
    console.log("Wallet data saved");

    // Get wallet details
    const address = walletProvider.getAddress();
    console.log(`Wallet Address: ${address}`);
    
    // Get wallet balance
    const provider = new ethers.providers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
    const balance = await provider.getBalance(address);
    console.log(`Wallet Balance: ${ethers.utils.formatEther(balance)} ETH`);

    // Create contract instance
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      contractABI,
      provider
    );

    // Test read-only contract interactions
    console.log("\nTesting contract read operations:");
    
    // Get owner address
    const owner = await contract.owner();
    console.log(`Contract Owner: ${owner}`);
    
    // Test if our wallet is the owner
    const isOwner = owner.toLowerCase() === address.toLowerCase();
    console.log(`Our wallet is the owner: ${isOwner}`);

    // Test contract write operations if we have enough balance
    if (balance.gt(ethers.utils.parseEther("0.0003"))) {
      console.log("\nTesting contract write operations:");
      
      // Create a transaction to register an artist
      const artistId = `artist_${Date.now()}`;
      const artistWallet = address;
      
      console.log(`Registering artist with ID: ${artistId} and wallet: ${artistWallet}`);
      
      try {
        // Create transaction data
        const txData = contract.interface.encodeFunctionData(
          "registerArtist",
          [artistId, artistWallet]
        );
        
        // Get available actions
        console.log("Getting available actions...");
        const actions = agentkit.getActions();
        console.log(`Found ${actions.length} available actions`);
        
        // Since there's no direct contract interaction action, we'll use the native transfer action
        // with data field to send a transaction to the contract
        console.log("\nUsing WalletActionProvider_native_transfer to send a contract transaction...");
        const nativeTransferAction = actions.find(a => a.name === 'WalletActionProvider_native_transfer');
        
        if (nativeTransferAction) {
          console.log("Found WalletActionProvider_native_transfer action");
          
          try {
            // Prepare transaction parameters
            const txParams = {
              amount: "0", // No ETH value being sent
              destination: CONTRACT_ADDRESS, // The contract address
              data: txData // The encoded function call data
            };
            
            console.log("Sending transaction with the following parameters:");
            console.log(JSON.stringify(txParams, null, 2));
            
            // Invoke the action
            const result = await nativeTransferAction.invoke(txParams);
            
            console.log("Transaction result:", result);
            if (result && result.hash) {
              console.log(`Transaction hash: ${result.hash}`);
              
              // Wait for transaction confirmation
              console.log("Waiting for transaction confirmation...");
              const receipt = await provider.waitForTransaction(result.hash);
              
              console.log("Transaction confirmed!");
              console.log(`Gas used: ${receipt.gasUsed.toString()}`);
              console.log(`Block number: ${receipt.blockNumber}`);
              
              // Verify the artist was registered
              const artist = await contract.getArtist(artistId);
              console.log(`Artist registered: ${artist.id === artistId}`);
            }
          } catch (actionError) {
            console.error("Error invoking native transfer action:", actionError.message);
            console.log("This might be because the action doesn't support the data field for contract interactions");
            
            // Fallback to a more direct approach if available
            console.log("\nFalling back to alternative approach...");
            
            // Check if the wallet provider has a sendTransaction method
            if (typeof walletProvider.sendTransaction === 'function') {
              console.log("Using walletProvider.sendTransaction method");
              
              const rawTx = {
                to: CONTRACT_ADDRESS,
                data: txData,
                value: "0x0",
                gasLimit: ethers.utils.hexlify(500000)
              };
              
              const txResult = await walletProvider.sendTransaction(rawTx);
              console.log("Transaction sent:", txResult);
            } else {
              console.log("walletProvider.sendTransaction method not available");
              console.log("Consider implementing a custom action provider for contract interactions");
            }
          }
        } else {
          console.log("WalletActionProvider_native_transfer action not found");
          console.log("Consider implementing a custom action provider for contract interactions");
        }
      } catch (txError) {
        console.error("Transaction error:", txError.message);
        
        // Check if the error is related to permissions
        if (txError.message.includes("caller is not the owner")) {
          console.log("\nError: Only the contract owner can register artists");
          console.log(`Contract owner: ${owner}`);
          console.log(`Our wallet: ${address}`);
          console.log("You need to use the owner's wallet to call this function");
        } else {
          console.log("Error details:", JSON.stringify(txError, null, 2));
        }
      }
    } else {
      console.log("\nSkipping write operations due to insufficient balance");
      console.log(`Current balance: ${ethers.utils.formatEther(balance)} ETH`);
      console.log("Required balance: 0.0003 ETH");
      console.log("Please fund your wallet with testnet ETH to test write operations");
    }

    console.log("\nAgentKit contract interaction test completed");
  } catch (error) {
    console.error("Error during contract interaction:", error);
    process.exit(1);
  }
}

// Execute the main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 