// scripts/test-blockchain-integration.js
const hre = require("hardhat");

async function main() {
  console.log("Testing blockchain integration...");
  
  // Get the deployed FundDistribution contract
  const fundDistributionAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const FundDistribution = await hre.ethers.getContractFactory("FundDistribution");
  const fundDistribution = FundDistribution.attach(fundDistributionAddress);
  
  // Get the deployed ZkSyncArtistManager contract
  const zkSyncArtistManagerAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const ZkSyncArtistManager = await hre.ethers.getContractFactory("ZkSyncArtistManager");
  const zkSyncArtistManager = ZkSyncArtistManager.attach(zkSyncArtistManagerAddress);
  
  // Get the deployer address
  const [deployer, artist] = await hre.ethers.getSigners();
  
  console.log("Deployer address:", deployer.address);
  console.log("Artist address:", artist.address);
  
  // Test FundDistribution contract
  console.log("\nTesting FundDistribution contract...");
  
  // First, deposit ETH to the contract
  console.log("Depositing ETH to the contract...");
  const depositAmount = hre.ethers.parseEther("5.0"); // 5 ETH
  const depositTx = await fundDistribution.depositNativeToken({ value: depositAmount });
  await depositTx.wait();
  console.log(`Deposited ${hre.ethers.formatEther(depositAmount)} ETH to the contract`);
  
  // Check contract balance
  const contractBalance = await hre.ethers.provider.getBalance(fundDistributionAddress);
  console.log(`Contract balance: ${hre.ethers.formatEther(contractBalance)} ETH`);
  
  // Create a grant
  const grantTitle = "Test Grant";
  const grantDescription = "A test grant for artists";
  const grantAmount = hre.ethers.parseEther("1.0"); // 1 ETH
  const token = "0x0000000000000000000000000000000000000000"; // Native token (ETH)
  const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
  
  console.log("Creating a grant...");
  const createGrantTx = await fundDistribution.createGrant(
    grantTitle,
    grantDescription,
    grantAmount,
    token,
    deadline
  );
  await createGrantTx.wait();
  console.log("Grant created successfully");
  
  // Get the grant details
  const grant = await fundDistribution.getGrant(1);
  console.log("Grant details:", {
    id: grant.id.toString(),
    title: grant.title,
    amount: hre.ethers.formatEther(grant.amount),
    remainingAmount: hre.ethers.formatEther(grant.remainingAmount),
    deadline: new Date(Number(grant.deadline) * 1000).toISOString()
  });
  
  // Test ZkSyncArtistManager contract
  console.log("\nTesting ZkSyncArtistManager contract...");
  
  // Check if the test artist exists
  const testArtistId = "test-artist-1";
  const artistWallet = await zkSyncArtistManager.artistWallets(testArtistId);
  console.log(`Artist ${testArtistId} wallet:`, artistWallet);
  
  // Check session keys
  const sessionKeys = await zkSyncArtistManager.getSessionKeys(testArtistId);
  console.log(`Session keys for artist ${testArtistId}:`, sessionKeys);
  
  // Test receiving funds
  console.log("\nTesting fund reception...");
  const opportunityId = "test-opportunity-1";
  const receiveFundsTx = await zkSyncArtistManager.receiveFunds(opportunityId, testArtistId, {
    value: hre.ethers.parseEther("0.5") // 0.5 ETH
  });
  await receiveFundsTx.wait();
  console.log("Funds received successfully");
  
  // Check pending funds
  const pendingFunds = await zkSyncArtistManager.getPendingFunds(testArtistId);
  console.log(`Pending funds for artist ${testArtistId}:`, hre.ethers.formatEther(pendingFunds));
  
  console.log("\nBlockchain integration test completed successfully");
}

// Execute the test
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 