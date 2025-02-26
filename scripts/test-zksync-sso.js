#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { ethers } = require('ethers');
const { Provider, Wallet } = require('zksync-web3');
const { zksyncSsoConnector } = require('zksync-sso/connector');
const { zksyncSepoliaTestnet } = require('viem/chains');

// ABI for the ZkSyncArtistManager contract
const ABI = [
  'function registerArtist(string artistId, address walletAddress) public',
  'function addSessionKey(string artistId, address sessionKey) public',
  'function removeSessionKey(string artistId, address sessionKey) public',
  'function receiveFunds(string opportunityId, string artistId) public payable',
  'function distributeFunds(string artistId) public',
  'event ArtistRegistered(string artistId, address walletAddress)',
  'event SessionKeyAdded(string artistId, address sessionKey)',
  'event SessionKeyRemoved(string artistId, address sessionKey)',
  'event FundsReceived(string opportunityId, string artistId, uint256 amount)',
  'event FundsDistributed(string artistId, address wallet, uint256 amount)'
];

// Contract address on zkSync Era testnet
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ARTIST_FUND_MANAGER_ZKSYNC;

async function main() {
  try {
    console.log('Testing zkSync Smart Sign-On (SSO) Implementation');
    console.log('-----------------------------------------------');

    // Check if contract address is available
    if (!CONTRACT_ADDRESS) {
      console.error('Error: Contract address not found in environment variables');
      console.log('Please set NEXT_PUBLIC_ARTIST_FUND_MANAGER_ZKSYNC in .env.local');
      process.exit(1);
    }

    console.log(`Using contract address: ${CONTRACT_ADDRESS}`);

    // Get zkSync provider
    const provider = new Provider(process.env.NEXT_PUBLIC_ZKSYNC_RPC_URL || 'https://testnet.era.zksync.dev');
    console.log('Connected to zkSync network:', await provider.getNetwork().then(n => n.name));

    // Get wallet
    const privateKey = process.env.ZKSYNC_PRIVATE_KEY;
    if (!privateKey) {
      console.error('Error: zkSync private key not found');
      console.log('Please set ZKSYNC_PRIVATE_KEY in .env.local');
      process.exit(1);
    }

    const wallet = new Wallet(privateKey, provider);
    const address = await wallet.getAddress();
    console.log('Using wallet address:', address);
    
    // Get contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
    console.log('Contract instance created');

    // Test artist registration
    const artistId = `artist_${Date.now()}`;
    console.log(`\nRegistering artist with ID: ${artistId}`);
    
    try {
      const tx = await contract.registerArtist(artistId, address);
      await tx.wait();
      console.log('Artist registered successfully!');
      console.log('Transaction hash:', tx.hash);
    } catch (error) {
      console.error('Error registering artist:', error.message);
    }

    // Create zkSync SSO session
    console.log('\nCreating zkSync Smart Sign-On session');
    
    try {
      // Create a zkSync SSO connector with session configuration
      const ssoConnector = zksyncSsoConnector({
        session: {
          expiry: '1 day',
          feeLimit: ethers.parseEther('0.01'),
          transfers: [
            {
              to: address, // Self-transfer for testing
              valueLimit: ethers.parseEther('0.01'),
            },
          ],
        },
      });
      
      console.log('SSO connector created');
      
      // Create a session
      console.log('Creating session...');
      const session = await ssoConnector.createSession(wallet);
      console.log('Session created successfully!');
      console.log('Session ID:', session.id);
      console.log('Session expiry:', new Date(session.expiry).toLocaleString());
      
      // Add the session key to the contract
      console.log('\nAdding session key to contract');
      const addTx = await contract.addSessionKey(artistId, session.id);
      await addTx.wait();
      console.log('Session key added to contract!');
      console.log('Transaction hash:', addTx.hash);
      
      // Test using the session key
      console.log('\nTesting session key by receiving funds');
      const opportunityId = `opportunity_${Date.now()}`;
      const amount = ethers.parseEther('0.001');
      
      // Use the session to send a transaction
      const receiveTx = await contract.receiveFunds(opportunityId, artistId, {
        value: amount
      });
      await receiveTx.wait();
      console.log('Funds received successfully using session key!');
      console.log('Transaction hash:', receiveTx.hash);
      
      // Test distributing funds
      console.log('\nTesting fund distribution');
      const distributeTx = await contract.distributeFunds(artistId);
      await distributeTx.wait();
      console.log('Funds distributed successfully!');
      console.log('Transaction hash:', distributeTx.hash);
      
      // Remove the session key
      console.log('\nRemoving session key');
      const removeTx = await contract.removeSessionKey(artistId, session.id);
      await removeTx.wait();
      console.log('Session key removed successfully!');
      console.log('Transaction hash:', removeTx.hash);
      
    } catch (error) {
      console.error('Error in zkSync SSO testing:', error);
      console.error('Error message:', error.message);
    }
    
    console.log('\nzkSync SSO testing completed');
  } catch (error) {
    console.error('Unhandled error:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 