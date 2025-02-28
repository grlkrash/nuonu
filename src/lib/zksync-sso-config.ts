import { zksyncSsoConnector, callPolicy } from "zksync-sso/connector"
import { zksyncSepoliaTestnet } from "viem/chains"
import { createConfig, http } from "@wagmi/core"
import { parseEther } from "viem"
import { env } from "@/lib/env"

console.log('Initializing zkSync SSO with:')
console.log(`- Network: ${env.NEXT_PUBLIC_ZKSYNC_NETWORK}`)
console.log(`- RPC URL: ${env.NEXT_PUBLIC_ZKSYNC_RPC_URL}`)
console.log(`- Contract Address: ${env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS}`)
console.log(`- Chain ID: ${zksyncSepoliaTestnet.id}`)

// Validate required environment variables
if (!env.NEXT_PUBLIC_ZKSYNC_RPC_URL) {
  console.error('Missing NEXT_PUBLIC_ZKSYNC_RPC_URL environment variable')
}

if (!env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS) {
  console.error('Missing NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS environment variable')
}

// Create the zkSync SSO connector with minimal configuration
// Following the official documentation at https://docs.zksync.io/zksync-era/unique-features/zksync-sso/getting-started
export const ssoConnector = zksyncSsoConnector({
  // Optional metadata for better UX
  metadata: {
    name: 'Nuonu App',
  },
  // Session configuration allows users to perform actions without signing each transaction
  session: {
    // Set session expiry to 1 day
    expiry: "1 day",
    // Allow up to 0.1 ETH to be spent in gas fees
    feeLimit: parseEther("0.1"),
  }
})

console.log('zkSync SSO connector initialized with session configuration:', {
  expiry: "1 day",
  feeLimit: parseEther("0.1").toString()
})

// Create the wagmi config with the required client property
export const wagmiConfig = createConfig({
  connectors: [ssoConnector],
  chains: [zksyncSepoliaTestnet],
  transports: {
    [zksyncSepoliaTestnet.id]: http(env.NEXT_PUBLIC_ZKSYNC_RPC_URL),
  },
})

// Helper function to handle zkSync SSO errors (to be used in components)
export function handleZkSyncError(error: any) {
  console.error('zkSync SSO error:', error)
  
  // Log specific error types for better debugging
  if (!error) {
    console.log('Empty error object received')
    return 'Unknown error occurred'
  }
  
  const errorMessage = typeof error === 'string' ? error : error.message
  
  if (!errorMessage) {
    console.log('Error object has no message property:', error)
    return 'Unknown error occurred'
  }
  
  // Log the full error object for debugging
  console.log('Full error object:', JSON.stringify(error, null, 2))
  
  if (errorMessage.includes('User rejected')) {
    console.log('User rejected the connection request')
    return 'User rejected the connection request'
  } else if (errorMessage.includes('Session expired')) {
    console.log('Session has expired, need to reconnect')
    return 'Session has expired, please reconnect'
  } else if (errorMessage.includes('Policy violation')) {
    console.log('Session policy violation - attempted action not allowed by session policy')
    return 'Action not allowed by session policy'
  } else if (errorMessage.includes('code verifier')) {
    console.log('Code verifier issue - this may indicate a conflict with Supabase auth')
    console.log('This often happens when there are multiple authentication systems running simultaneously')
    return 'Authentication conflict detected. Please clear your browser cache and try again.'
  } else if (errorMessage.includes('session creation')) {
    console.log('Session creation error - this may indicate an issue with the zkSync SSO configuration')
    console.log('Session configuration used:', JSON.stringify({
      expiry: "1 day",
      feeLimit: parseEther("0.1").toString()
    }))
    return 'Failed to create session. Please try again after clearing your browser cache.'
  }
  
  return errorMessage || 'Unknown error occurred'
}

console.log('wagmiConfig created with zkSync SSO connector') 