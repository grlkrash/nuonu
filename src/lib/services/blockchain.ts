import { ethers } from 'ethers'

// ABI for the ArtistFundManager contract
const ABI = [
  // Function to register an artist
  'function registerArtist(string artistId, address walletAddress) public',
  // Function to receive a grant
  'function receiveGrant(string grantId, string artistId) public payable',
  // Function to distribute funds
  'function distributeFunds(string artistId) public',
  // Event for funds received
  'event FundsReceived(string grantId, string artistId, uint256 amount)',
  // Event for funds distributed
  'event FundsDistributed(string artistId, address wallet, uint256 amount)'
]

// Contract address on Base testnet
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''

/**
 * Connects to the blockchain provider
 */
export async function getProvider() {
  // Use Base testnet for development
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_RPC_URL || 'https://goerli.base.org'
  )
  return provider
}

/**
 * Gets a signer for transactions
 */
export async function getSigner() {
  const provider = await getProvider()
  
  // In a real app, this would use a secure method to get the private key
  // For demo purposes, we're using an environment variable
  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey) {
    throw new Error('Private key not found')
  }
  
  return new ethers.Wallet(privateKey, provider)
}

/**
 * Gets the contract instance
 */
export async function getContract() {
  const signer = await getSigner()
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
}

/**
 * Registers an artist with the contract
 */
export async function registerArtist(artistId: string, walletAddress: string) {
  try {
    const contract = await getContract()
    const tx = await contract.registerArtist(artistId, walletAddress)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error('Error registering artist:', error)
    throw new Error(`Failed to register artist: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Receives a grant for an artist
 */
export async function receiveGrant(grantId: string, artistId: string, amount: string) {
  try {
    const contract = await getContract()
    const tx = await contract.receiveGrant(grantId, artistId, {
      value: ethers.utils.parseEther(amount)
    })
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error('Error receiving grant:', error)
    throw new Error(`Failed to receive grant: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Distributes funds to an artist
 */
export async function distributeFunds(artistId: string) {
  try {
    const contract = await getContract()
    const tx = await contract.distributeFunds(artistId)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error('Error distributing funds:', error)
    throw new Error(`Failed to distribute funds: ${error instanceof Error ? error.message : String(error)}`)
  }
} 