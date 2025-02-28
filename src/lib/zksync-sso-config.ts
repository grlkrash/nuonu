import { zksyncSsoConnector, callPolicy } from "zksync-sso/connector"
import { zksyncSepoliaTestnet } from "viem/chains"
import { createConfig } from "@wagmi/core"
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

// Create the zkSync SSO connector with enhanced session configuration
export const ssoConnector = zksyncSsoConnector({
  // Session configuration allows users to perform actions without signing each transaction
  session: {
    // Set session expiry to 1 day
    expiry: "1 day",
    
    // Allow up to 0.1 ETH to be spent in gas fees
    feeLimit: parseEther("0.1"),
    
    // Configure transfer policies (optional)
    // This allows the session to transfer tokens to specific addresses with limits
    transfers: [
      // Example: Allow transfers to a specific address with a limit
      // {
      //   to: "0x...", // Specific address to allow transfers to
      //   valueLimit: parseEther("0.01"), // Maximum amount that can be transferred
      // },
    ],
    
    // Configure contract call policies using the callPolicy helper as recommended in the docs
    contractCalls: [
      // Example: Allow calls to a specific contract method
      // callPolicy({
      //   address: "0x...", // Contract address
      //   abi: erc20Abi, // ABI of the contract
      //   functionName: "transfer", // Function name to allow
      //   constraints: [
      //     {
      //       index: 0, // First argument (recipient address)
      //       value: "0x...", // Specific address to allow transfers to
      //     },
      //     {
      //       index: 1, // Second argument (amount)
      //       limit: {
      //         limit: parseEther("0.01"), // Maximum amount
      //         period: "1 hour", // Time period for the limit
      //       },
      //     },
      //   ],
      // }),
    ],
  },
  
  // Add debug mode to get more information
  debug: true,
  
  // Use environment variables for configuration
  rpcUrl: env.NEXT_PUBLIC_ZKSYNC_RPC_URL,
  contractAddress: env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS,
  
  // Add custom error handling with more detailed logging
  onError: (error) => {
    console.error('zkSync SSO error:', error)
    
    // Log specific error types for better debugging
    if (error.message?.includes('User rejected')) {
      console.log('User rejected the connection request')
    } else if (error.message?.includes('Session expired')) {
      console.log('Session has expired, need to reconnect')
      // Could trigger a session refresh here
    } else if (error.message?.includes('Policy violation')) {
      console.log('Session policy violation - attempted action not allowed by session policy')
    } else if (error.message?.includes('code verifier')) {
      console.log('Code verifier issue - this may indicate a conflict with Supabase auth')
    }
  }
})

console.log('zkSync SSO connector initialized with debug mode enabled')

// Create the wagmi config
export const wagmiConfig = createConfig({
  connectors: [ssoConnector],
  chains: [zksyncSepoliaTestnet],
})

console.log('wagmiConfig created with zkSync SSO connector') 