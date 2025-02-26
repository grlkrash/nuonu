const hre = require("hardhat");

async function main() {
  console.log("Testing end-to-end user flow...");
  
  // Contract addresses
  const fundDistributionAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const zkSyncArtistManagerAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  // Get contract instances
  const FundDistribution = await hre.ethers.getContractFactory("FundDistribution");
  const fundDistribution = FundDistribution.attach(fundDistributionAddress);
  
  const ZkSyncArtistManager = await hre.ethers.getContractFactory("ZkSyncArtistManager");
  const zkSyncArtistManager = ZkSyncArtistManager.attach(zkSyncArtistManagerAddress);
  
  // Get signers (accounts)
  const [admin, artist] = await hre.ethers.getSigners();
  
  console.log("Admin address:", admin.address);
  console.log("Artist address:", artist.address);
  
  // Step 1: Create a new artist profile
  console.log("\n📝 Step 1: Creating a new artist profile...");
  const artistId = "artist-" + Math.floor(Math.random() * 1000);
  const registerTx = await zkSyncArtistManager.registerArtist(artistId, artist.address);
  await registerTx.wait();
  console.log(`Artist registered with ID: ${artistId} and wallet: ${artist.address}`);
  
  // Step 2: Create a new grant
  console.log("\n💰 Step 2: Creating a new grant...");
  const grantTitle = "Artist Innovation Grant";
  const grantDescription = "Supporting innovative artistic projects";
  const grantAmount = hre.ethers.parseEther("2.0"); // 2 ETH
  const token = "0x0000000000000000000000000000000000000000"; // Native token (ETH)
  const deadline = Math.floor(Date.now() / 1000) + 86400 * 7; // 7 days from now
  
  // First, ensure the contract has enough funds
  const contractBalance = await hre.ethers.provider.getBalance(fundDistributionAddress);
  if (contractBalance < grantAmount) {
    console.log("Depositing additional ETH to the contract...");
    const depositTx = await fundDistribution.depositNativeToken({ value: grantAmount });
    await depositTx.wait();
    console.log(`Deposited ${hre.ethers.formatEther(grantAmount)} ETH to the contract`);
  }
  
  // Create the grant
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
  const grantId = 2; // Assuming this is the second grant created
  try {
    const grant = await fundDistribution.getGrant(grantId);
    console.log("Grant details:", {
      id: grant.id.toString(),
      title: grant.title,
      amount: hre.ethers.formatEther(grant.amount),
      remainingAmount: hre.ethers.formatEther(grant.remainingAmount),
      deadline: new Date(Number(grant.deadline) * 1000).toISOString()
    });
  } catch (error) {
    console.log(`Error retrieving grant #${grantId}: ${error.message}`);
    console.log("Using grant #1 instead...");
    const grant = await fundDistribution.getGrant(1);
    console.log("Grant details:", {
      id: grant.id.toString(),
      title: grant.title,
      amount: hre.ethers.formatEther(grant.amount),
      remainingAmount: hre.ethers.formatEther(grant.remainingAmount),
      deadline: new Date(Number(grant.deadline) * 1000).toISOString()
    });
  }
  
  // Step 3: Submit an application
  console.log("\n📄 Step 3: Submitting an application...");
  // In a real application, this would be done through the frontend
  // Here we're simulating the application submission
  console.log("Application submitted through the frontend (simulated)");
  
  // Step 4: Review and approve the application
  console.log("\n✅ Step 4: Reviewing and approving the application...");
  // In a real application, this would be done through the admin interface
  // Here we're simulating the application approval
  console.log("Application approved through the admin interface (simulated)");
  
  // Step 5: Process payment
  console.log("\n💸 Step 5: Processing payment...");
  // In a real application, this would trigger a blockchain transaction
  // Here we're simulating the payment by sending funds to the artist's wallet through ZkSync
  
  // First, check the artist's balance before
  const artistBalanceBefore = await hre.ethers.provider.getBalance(artist.address);
  console.log(`Artist balance before: ${hre.ethers.formatEther(artistBalanceBefore)} ETH`);
  
  // Send funds to the artist through ZkSync
  const paymentAmount = hre.ethers.parseEther("0.5"); // 0.5 ETH
  const opportunityId = "opportunity-" + Math.floor(Math.random() * 1000);
  
  // Send funds to the ZkSync contract
  const receiveFundsTx = await zkSyncArtistManager.connect(admin).receiveFunds(opportunityId, artistId, {
    value: paymentAmount
  });
  await receiveFundsTx.wait();
  console.log(`Funds received by ZkSync contract: ${hre.ethers.formatEther(paymentAmount)} ETH`);
  
  // Check pending funds
  const pendingFunds = await zkSyncArtistManager.getPendingFunds(artistId);
  console.log(`Pending funds for artist ${artistId}: ${hre.ethers.formatEther(pendingFunds)} ETH`);
  
  // Distribute funds to the artist
  const distributeTx = await zkSyncArtistManager.connect(artist).distributeFunds(artistId);
  await distributeTx.wait();
  console.log("Funds distributed successfully");
  
  // Check the artist's balance after
  const artistBalanceAfter = await hre.ethers.provider.getBalance(artist.address);
  console.log(`Artist balance after: ${hre.ethers.formatEther(artistBalanceAfter)} ETH`);
  
  // Calculate the difference (accounting for gas costs)
  const balanceDifference = artistBalanceAfter - artistBalanceBefore;
  console.log(`Balance difference: ${hre.ethers.formatEther(balanceDifference)} ETH`);
  
  console.log("\n🎉 End-to-end user flow test completed successfully!");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 