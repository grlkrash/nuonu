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

// Create the zkSync SSO connector
export const ssoConnector = zksyncSsoConnector({
  // Session configuration allows users to perform actions without signing each transaction
  session: {
    expiry: "1 day",
    // Allow up to 0.1 ETH to be spent in gas fees
    feeLimit: parseEther("0.1"),
  },
  // Add debug mode to get more information
  debug: true,
  // Use environment variables for configuration
  rpcUrl: env.NEXT_PUBLIC_ZKSYNC_RPC_URL,
  contractAddress: env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS,
  // Add custom error handling
  onError: (error) => {
    console.error('zkSync SSO error:', error)
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