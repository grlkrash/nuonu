import { ethers } from 'ethers'

// ABI for the Chainlink CCIP Router
const CCIP_ROUTER_ABI = [
  // Function to send a cross-chain message
  'function ccipSend(uint64 destinationChainSelector, address receiver, bytes calldata data) external payable returns (bytes32)',
  // Event for message sent
  'event MessageSent(bytes32 indexed messageId, uint64 indexed destinationChainSelector, address receiver, address feeToken, uint256 fees)'
]

// Chain selectors for supported networks
const CHAIN_SELECTORS = {
  'ethereum-sepolia': '16015286601757825753',
  'base-goerli': '5790810961207155433',
  'optimism-goerli': '2664363617261496610',
  'avalanche-fuji': '14767482510784806043',
  'polygon-mumbai': '12532609583862916517'
}

// CCIP Router addresses for supported networks
const CCIP_ROUTER_ADDRESSES = {
  'ethereum-sepolia': '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59',
  'base-goerli': '0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D',
  'optimism-goerli': '0xEB52E9Ae4A9Fb37172978642d4C141ef53876f26',
  'avalanche-fuji': '0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8',
  'polygon-mumbai': '0x70499c328e1E2a3c41108bd3730F6670a44595D1'
}

/**
 * Gets a provider for the specified network
 */
export async function getCcipProvider(network: keyof typeof CHAIN_SELECTORS) {
  // Use the appropriate RPC URL based on the network
  const rpcUrl = process.env[`NEXT_PUBLIC_${network.toUpperCase().replace('-', '_')}_RPC_URL`]
  if (!rpcUrl) {
    throw new Error(`RPC URL not found for network: ${network}`)
  }
  
  return new ethers.providers.JsonRpcProvider(rpcUrl)
}

/**
 * Gets a signer for the specified network
 */
export async function getCcipSigner(network: keyof typeof CHAIN_SELECTORS) {
  const provider = await getCcipProvider(network)
  
  // In a real app, this would use a secure method to get the private key
  // For demo purposes, we're using an environment variable
  const privateKey = process.env[`${network.toUpperCase().replace('-', '_')}_PRIVATE_KEY`]
  if (!privateKey) {
    throw new Error(`Private key not found for network: ${network}`)
  }
  
  return new ethers.Wallet(privateKey, provider)
}

/**
 * Gets the CCIP Router contract for the specified network
 */
export async function getCcipRouter(network: keyof typeof CHAIN_SELECTORS) {
  const signer = await getCcipSigner(network)
  const routerAddress = CCIP_ROUTER_ADDRESSES[network]
  
  return new ethers.Contract(routerAddress, CCIP_ROUTER_ABI, signer)
}

/**
 * Sends a cross-chain message using Chainlink CCIP
 */
export async function sendCrossChainMessage(
  sourceNetwork: keyof typeof CHAIN_SELECTORS,
  destinationNetwork: keyof typeof CHAIN_SELECTORS,
  receiverAddress: string,
  message: string
) {
  try {
    const router = await getCcipRouter(sourceNetwork)
    const destinationChainSelector = CHAIN_SELECTORS[destinationNetwork]
    
    // Encode the message
    const encodedMessage = ethers.utils.defaultAbiCoder.encode(['string'], [message])
    
    // Estimate the fee
    const fees = await router.getFee(destinationChainSelector, receiverAddress, encodedMessage)
    
    // Send the message
    const tx = await router.ccipSend(
      destinationChainSelector,
      receiverAddress,
      encodedMessage,
      { value: fees }
    )
    
    const receipt = await tx.wait()
    
    // Extract the message ID from the event
    const messageId = receipt.events?.find(e => e.event === 'MessageSent')?.args?.messageId
    
    return {
      success: true,
      txHash: tx.hash,
      messageId
    }
  } catch (error) {
    console.error('Error sending cross-chain message:', error)
    throw new Error(`Failed to send cross-chain message: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Registers an artist across multiple chains using Chainlink CCIP
 */
export async function registerArtistCrossChain(
  artistId: string,
  walletAddress: string,
  sourceNetwork: keyof typeof CHAIN_SELECTORS,
  destinationNetworks: Array<keyof typeof CHAIN_SELECTORS>
) {
  try {
    const results = []
    
    // Register on the source network first
    // This would call the appropriate blockchain service for the source network
    
    // Then send cross-chain messages to register on destination networks
    for (const destinationNetwork of destinationNetworks) {
      // Encode the registration message
      const message = JSON.stringify({
        type: 'REGISTER_ARTIST',
        artistId,
        walletAddress
      })
      
      // Get the receiver address (the contract that will handle the message on the destination chain)
      const receiverAddress = CCIP_ROUTER_ADDRESSES[destinationNetwork]
      
      // Send the cross-chain message
      const result = await sendCrossChainMessage(
        sourceNetwork,
        destinationNetwork,
        receiverAddress,
        message
      )
      
      results.push({
        network: destinationNetwork,
        ...result
      })
    }
    
    return {
      success: true,
      results
    }
  } catch (error) {
    console.error('Error registering artist cross-chain:', error)
    throw new Error(`Failed to register artist cross-chain: ${error instanceof Error ? error.message : String(error)}`)
  }
} 