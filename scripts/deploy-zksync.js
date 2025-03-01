// scripts/deploy-zksync.js
require('dotenv').config({ path: '.env.local' });
const { Wallet, Provider, Contract, utils } = require('zksync-web3');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// ABI and bytecode for ZkSyncArtistManager contract
const contractABI = require('../artifacts-zk/contracts/ZkSyncArtistManager.sol/ZkSyncArtistManager.json').abi;
const contractBytecode = require('../artifacts-zk/contracts/ZkSyncArtistManager.sol/ZkSyncArtistManager.json').bytecode;

async function main() {
  try {
    console.log('Starting ZkSync deployment with Optimism interoperability...');

    // Check if private key is available
    if (!process.env.ZKSYNC_PRIVATE_KEY) {
      throw new Error('ZKSYNC_PRIVATE_KEY environment variable is not set');
    }

    // Initialize provider and wallet
    const provider = new Provider(process.env.NEXT_PUBLIC_ZKSYNC_RPC_URL || 'https://sepolia.era.zksync.dev');
    const wallet = new Wallet(process.env.ZKSYNC_PRIVATE_KEY, provider);
    const deployer = wallet.address;

    console.log(`Deployer address: ${deployer}`);
    console.log(`Current network: ${await provider.getNetwork().then(network => network.name)}`);
    
    // Check balance
    const balance = await provider.getBalance(deployer);
    console.log(`Deployer balance: ${ethers.utils.formatEther(balance)} ETH`);

    if (balance.eq(0)) {
      throw new Error('Deployer has no balance. Please fund the account before deployment.');
    }
    
    // Deploy the contract
    console.log('Deploying ZkSyncArtistManager contract...');
    
    const factory = new ethers.ContractFactory(contractABI, contractBytecode, wallet);
    const contract = await factory.deploy();
    
    await contract.deployed();
    
    console.log(`ZkSyncArtistManager deployed to: ${contract.address}`);

    // Update .env.local file with the new contract address
    const envFilePath = path.resolve(process.cwd(), '.env.local');
    let envContent = '';
    
    try {
      envContent = fs.readFileSync(envFilePath, 'utf8');
    } catch (error) {
      console.log('No existing .env.local file, creating a new one.');
    }

    // Update or add the contract address
    const addressRegex = /^NEXT_PUBLIC_ZKSYNC_ARTIST_MANAGER_ADDRESS=.*/m;
    const newAddressLine = `NEXT_PUBLIC_ZKSYNC_ARTIST_MANAGER_ADDRESS=${contract.address}`;
    
    if (addressRegex.test(envContent)) {
      envContent = envContent.replace(addressRegex, newAddressLine);
    } else {
      envContent += `\n${newAddressLine}`;
    }

    // Generate a session key for the contract
    const sessionKey = ethers.Wallet.createRandom().privateKey;
    const sessionKeyRegex = /^ZKSYNC_SESSION_KEY=.*/m;
    const newSessionKeyLine = `ZKSYNC_SESSION_KEY=${sessionKey}`;
    
    if (sessionKeyRegex.test(envContent)) {
      envContent = envContent.replace(sessionKeyRegex, newSessionKeyLine);
    } else {
      envContent += `\n${newSessionKeyLine}`;
    }
    
    // Add Optimism-related environment variables if they don't exist
    if (!envContent.includes('NEXT_PUBLIC_OPTIMISM_RPC_URL=')) {
      envContent += `\nNEXT_PUBLIC_OPTIMISM_RPC_URL=https://sepolia.optimism.io`;
    }
    
    if (!envContent.includes('NEXT_PUBLIC_OPTIMISM_CHAIN_ID=')) {
      envContent += `\nNEXT_PUBLIC_OPTIMISM_CHAIN_ID=11155420`;
    }

    // Write the updated content back to the file
    fs.writeFileSync(envFilePath, envContent);
    console.log('Updated .env.local file with new contract address, session key, and Optimism variables');

    // Register the deployer as an artist with Optimism address
    console.log('Registering deployer as an artist with Optimism address...');
    const artistId = "deployer-artist";
    const optimismAddress = deployer; // Using the same address for demo purposes
    
    const registerTx = await contract.registerArtist(artistId, deployer, optimismAddress);
    await registerTx.wait();
    console.log(`Artist registered with ID: ${artistId}, wallet: ${deployer}, optimismAddress: ${optimismAddress}`);
    
    // Create a session key for the contract
    console.log('Creating session key...');
    const sessionWallet = new ethers.Wallet(sessionKey);
    const sessionAddress = sessionWallet.address;
    
    const addSessionTx = await contract.addSessionKey(artistId, sessionAddress);
    await addSessionTx.wait();
    console.log(`Session key created with address: ${sessionAddress}`);

    // Create a test grant
    console.log('Creating a test grant...');
    const grantId = "grant-" + Date.now();
    const grantTitle = "Test Grant";
    const grantAmount = ethers.utils.parseEther('0.01');
    
    const createGrantTx = await contract.createGrant(grantId, grantTitle, grantAmount, {
      value: grantAmount
    });
    await createGrantTx.wait();
    console.log(`Grant created with ID: ${grantId}, title: ${grantTitle}, amount: ${ethers.utils.formatEther(grantAmount)} ETH`);
    
    // Award grant to artist
    console.log('Awarding grant to artist...');
    const awardTx = await contract.awardGrant(grantId, artistId);
    await awardTx.wait();
    console.log(`Grant ${grantId} awarded to artist ${artistId}`);

    // Initiate a test cross-chain transaction
    console.log('Initiating a test cross-chain transaction...');
    const txAmount = ethers.utils.parseEther('0.005');
    const targetChain = "optimism";
    
    const initiateTx = await contract.initiateCrossChainTransaction(
      artistId,
      txAmount,
      targetChain,
      optimismAddress
    );
    const initiateTxReceipt = await initiateTx.wait();
    
    // Find the transaction ID from the event logs
    let txId;
    for (const event of initiateTxReceipt.events) {
      if (event.event === "CrossChainTransactionInitiated") {
        txId = event.args.txId.toString();
        break;
      }
    }
    
    console.log(`Cross-chain transaction initiated with ID: ${txId}, amount: ${ethers.utils.formatEther(txAmount)} ETH`);

    // Get artist details
    console.log('Getting artist details...');
    const artist = await contract.getArtist(artistId);
    console.log(`Artist ID: ${artist.id}`);
    console.log(`Wallet: ${artist.wallet}`);
    console.log(`Optimism Address: ${artist.optimismAddress}`);
    console.log(`Verified: ${artist.verified}`);
    
    // Get cross-chain transaction details
    console.log('Getting cross-chain transaction details...');
    const tx = await contract.getCrossChainTransaction(txId);
    console.log(`Transaction ID: ${tx.id}`);
    console.log(`Artist ID: ${tx.artistId}`);
    console.log(`Amount: ${ethers.utils.formatEther(tx.amount)} ETH`);
    console.log(`Target Chain: ${tx.targetChain}`);
    console.log(`Target Address: ${tx.targetAddress}`);
    console.log(`Status: ${tx.status}`);
    console.log(`Timestamp: ${new Date(tx.timestamp.toNumber() * 1000).toISOString()}`);
    
    // Update transaction status
    console.log('Updating transaction status to "completed"...');
    const updateTx = await contract.updateCrossChainTransactionStatus(txId, "completed");
    await updateTx.wait();
    
    // Get updated transaction details
    const updatedTx = await contract.getCrossChainTransaction(txId);
    console.log(`Updated Status: ${updatedTx.status}`);

    console.log('ZkSync deployment with Optimism interoperability completed successfully!');
    
    console.log('\nOptimism Interoperability Features:');
    console.log('- The contract now supports cross-chain transactions to Optimism');
    console.log('- Artists can register with an Optimism address');
    console.log('- Funds can be transferred from zkSync to Optimism using the initiateCrossChainTransaction function');
    console.log('- Transaction status can be updated and tracked');
    
  } catch (error) {
    console.error('Error during deployment:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 