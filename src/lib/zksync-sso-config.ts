import { zksyncSsoConnector, callPolicy } from "zksync-sso/connector"
import { zksyncSepoliaTestnet } from "viem/chains"
import { createConfig, http } from "@wagmi/core"
import { parseEther } from "viem"
import { env } from "@/lib/env"

// Add a check for the correct contract address
const OFFICIAL_ZKSYNC_SSO_CONTRACT = {
  sepolia: "0x7a1d5e38e8d3a0f8f8f8a9b3f9a9f8f8a9b8f8a9",  // Replace with actual address
  testnet: "0x7a1d5e38e8d3a0f8f8f8a9b3f9a9f8f8a9b8f8a9"   // Replace with actual address
}

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

// Check if using the official contract address
const isUsingOfficialContract = Object.values(OFFICIAL_ZKSYNC_SSO_CONTRACT).includes(
  env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS
)

if (!isUsingOfficialContract) {
  console.warn('WARNING: Not using an official zkSync SSO contract address. This may cause connection issues.')
  console.warn('Current address:', env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS)
  console.warn('Expected addresses:', OFFICIAL_ZKSYNC_SSO_CONTRACT)
}

// Create the zkSync SSO connector with minimal configuration
// Following the official documentation at https://docs.zksync.io/zksync-era/unique-features/zksync-sso/getting-started
export const ssoConnector = zksyncSsoConnector({
  // Session configuration allows users to perform actions without signing each transaction
  session: {
    // Set session expiry to 1 day
    expiry: "1 day",
    // Allow up to 0.1 ETH to be spent in gas fees
    feeLimit: parseEther("0.1"),
  }
})

// Log the exact configuration for debugging
console.log('zkSync SSO connector initialized with EXACT configuration from documentation:', {
  session: {
    expiry: "1 day",
    feeLimit: parseEther("0.1").toString()
  }
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
  
  // Get the error message
  const errorMessage = typeof error === 'string' ? error : error.message
  
  if (!errorMessage) {
    console.log('Error object has no message property:', error)
    return 'Unknown error occurred'
  }
  
  // Log the full error object for debugging
  console.log('Full error object:', JSON.stringify(error, null, 2))
  
  // Check for specific error types
  if (errorMessage.includes('User rejected')) {
    console.log('User rejected the connection request')
    return 'User rejected the connection request'
  } 
  
  if (errorMessage.includes('Session expired')) {
    console.log('Session has expired, need to reconnect')
    return 'Session has expired, please reconnect'
  } 
  
  if (errorMessage.includes('Policy violation')) {
    console.log('Session policy violation - attempted action not allowed by session policy')
    return 'Action not allowed by session policy'
  } 
  
  if (errorMessage.includes('code verifier')) {
    console.log('Code verifier issue detected')
    return 'Authentication conflict detected. Please try again in a regular (non-private) browser window.'
  } 
  
  if (errorMessage.includes('session creation')) {
    console.log('SESSION CREATION ERROR DETECTED - DETAILED DEBUGGING:')
    console.log('Browser: ' + navigator.userAgent)
    console.log('Private browsing: Likely yes (based on your report)')
    console.log('WebAuthn support: ' + ('credentials' in navigator))
    console.log('Secure context: ' + window.isSecureContext)
    
    // Check for Safari-specific issues
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    if (isSafari) {
      console.log('SAFARI DETECTED: Safari has known issues with WebAuthn in private browsing')
      return 'Safari private browsing may not support zkSync SSO. Please try Chrome or regular Safari window.'
    }
    
    return 'Session creation failed. Please try in a regular (non-private) browser window.'
  }
  
  // Add specific check for contract address issues
  if (errorMessage.includes('contract') || errorMessage.includes('address')) {
    console.log('Possible contract address issue detected')
    return 'Connection failed due to contract configuration. Please check your contract address.'
  }
  
  // Default error message
  return errorMessage || 'Unknown error occurred'
}

console.log('wagmiConfig created with zkSync SSO connector') 