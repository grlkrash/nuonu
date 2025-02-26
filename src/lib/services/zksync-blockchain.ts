import { ethers } from 'ethers'
import { Provider, Wallet } from 'zksync-web3'

// ABI for the ZkSyncArtistManager contract
const ABI = [
  // Function to register an artist
  'function registerArtist(string artistId, address walletAddress) public',
  // Function to add a session key
  'function addSessionKey(string artistId, address sessionKey) public',
  // Function to remove a session key
  'function removeSessionKey(string artistId, address sessionKey) public',
  // Function to receive funds
  'function receiveFunds(string opportunityId, string artistId) public payable',
  // Function to distribute funds
  'function distributeFunds(string artistId) public',
  // Events
  'event ArtistRegistered(string artistId, address walletAddress)',
  'event SessionKeyAdded(string artistId, address sessionKey)',
  'event SessionKeyRemoved(string artistId, address sessionKey)',
  'event FundsReceived(string opportunityId, string artistId, uint256 amount)',
  'event FundsDistributed(string artistId, address wallet, uint256 amount)'
]

// Contract address on zkSync Era testnet
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS || ''

/**
 * Gets a zkSync provider
 */
export async function getZkSyncProvider() {
  // Use zkSync Era testnet for development
  return new Provider(process.env.NEXT_PUBLIC_ZKSYNC_RPC_URL || 'https://testnet.era.zksync.dev')
}

/**
 * Gets a zkSync wallet
 */
export async function getZkSyncWallet() {
  const provider = await getZkSyncProvider()
  
  // In a real app, this would use a secure method to get the private key
  // For demo purposes, we're using an environment variable
  const privateKey = process.env.ZKSYNC_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('zkSync private key not found')
  }
  
  return new Wallet(privateKey, provider)
}

/**
 * Gets the contract instance
 */
export async function getZkSyncContract() {
  const wallet = await getZkSyncWallet()
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet)
}

/**
 * Registers an artist with the contract
 */
export async function registerArtist(artistId: string, walletAddress: string) {
  try {
    const contract = await getZkSyncContract()
    const tx = await contract.registerArtist(artistId, walletAddress)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error('Error registering artist on zkSync:', error)
    throw new Error(`Failed to register artist on zkSync: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Adds a session key for an artist
 */
export async function addSessionKey(artistId: string, sessionKey: string) {
  try {
    const contract = await getZkSyncContract()
    const tx = await contract.addSessionKey(artistId, sessionKey)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error('Error adding session key on zkSync:', error)
    throw new Error(`Failed to add session key on zkSync: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Removes a session key for an artist
 */
export async function removeSessionKey(artistId: string, sessionKey: string) {
  try {
    const contract = await getZkSyncContract()
    const tx = await contract.removeSessionKey(artistId, sessionKey)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error('Error removing session key on zkSync:', error)
    throw new Error(`Failed to remove session key on zkSync: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Receives funds for an artist
 */
export async function receiveFunds(opportunityId: string, artistId: string, amount: string) {
  try {
    const contract = await getZkSyncContract()
    const tx = await contract.receiveFunds(opportunityId, artistId, {
      value: ethers.utils.parseEther(amount)
    })
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error('Error receiving funds on zkSync:', error)
    throw new Error(`Failed to receive funds on zkSync: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Distributes funds to an artist
 */
export async function distributeFunds(artistId: string) {
  try {
    const contract = await getZkSyncContract()
    const tx = await contract.distributeFunds(artistId)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error('Error distributing funds on zkSync:', error)
    throw new Error(`Failed to distribute funds on zkSync: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Creates a session key for an artist
 * This is a zkSync Era specific feature
 */
export async function createSessionKey(artistId: string) {
  try {
    // Generate a new random private key for the session
    const sessionWallet = ethers.Wallet.createRandom()
    const sessionKey = sessionWallet.address
    
    // Add the session key to the contract
    await addSessionKey(artistId, sessionKey)
    
    return {
      success: true,
      sessionKey,
      privateKey: sessionWallet.privateKey
    }
  } catch (error) {
    console.error('Error creating session key on zkSync:', error)
    throw new Error(`Failed to create session key on zkSync: ${error instanceof Error ? error.message : String(error)}`)
  }
} 