import { zksyncSsoConnector } from "zksync-sso/connector"
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
      //   token: "ETH", // Use ETH for native token
      //   to: "0x...", // Specific address to allow transfers to
      //   limit: {
      //     type: "lifetime", // Can be "lifetime", "allowance", or "unlimited"
      //     value: parseEther("0.01"), // Maximum amount that can be transferred
      //   },
      // },
    ],
    
    // Configure contract call policies (optional)
    // This allows the session to call specific contract methods
    calls: [
      // Example: Allow calls to a specific contract method
      // {
      //   to: "0x...", // Contract address
      //   function: "transfer(address,uint256)", // Function signature
      //   args: [
      //     // Argument constraints (optional)
      //     // { type: "address", value: "0x..." }, // Specific address
      //     // { type: "uint256", max: parseEther("0.01") }, // Maximum amount
      //   ],
      //   limit: {
      //     type: "unlimited", // No limit on number of calls
      //   },
      // },
    ],
    
    // Configure batch call policies (optional)
    // This allows the session to make batch calls to contracts
    batches: [
      // Example: Allow batch calls to specific contracts
      // {
      //   calls: [
      //     {
      //       to: "0x...", // Contract address
      //       function: "approve(address,uint256)", // Function signature
      //     },
      //     {
      //       to: "0x...", // Contract address
      //       function: "transferFrom(address,address,uint256)", // Function signature
      //     },
      //   ],
      //   limit: {
      //     type: "lifetime", // Can be "lifetime", "allowance", or "unlimited"
      //     value: 5, // Maximum number of times this batch can be called
      //   },
      // },
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
    }
  }
})

console.log('zkSync SSO connector initialized with debug mode enabled')

// Create the wagmi config
export const wagmiConfig = createConfig({
  connectors: [ssoConnector],
  chains: [zksyncSepoliaTestnet],
  logger: {
    warn: (message) => console.warn(message),
    error: (message) => console.error(message),
  },
})

console.log('wagmiConfig created with zkSync SSO connector') 