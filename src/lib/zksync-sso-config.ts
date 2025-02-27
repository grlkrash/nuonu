import { zksyncSsoConnector } from '@zksync/sso'
import { zksyncSepoliaTestnet } from '@zksync/sso/chains'
import { createConfig, http } from 'wagmi'
import { env } from '@/lib/env'

console.log('Initializing zkSync SSO with:')
console.log(`- Network: ${env.NEXT_PUBLIC_ZKSYNC_NETWORK}`)
console.log(`- RPC URL: ${env.NEXT_PUBLIC_ZKSYNC_RPC_URL}`)
console.log(`- Contract Address: ${env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS}`)

// Validate required environment variables
if (!env.NEXT_PUBLIC_ZKSYNC_RPC_URL) {
  console.error('Missing NEXT_PUBLIC_ZKSYNC_RPC_URL environment variable')
}

if (!env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS) {
  console.error('Missing NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS environment variable')
}

// Create the zkSync SSO connector
export const ssoConnector = zksyncSsoConnector({
  chains: [zksyncSepoliaTestnet],
  options: {
    debug: true, // Enable debug mode for more detailed logs
    session: {
      expiry: '1 day',
      feeLimit: '0.1', // 0.1 ETH for gas fees
    },
    rpcUrl: env.NEXT_PUBLIC_ZKSYNC_RPC_URL,
    contractAddress: env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS,
    onError: (error) => {
      console.error('zkSync SSO error:', error)
    }
  },
})

console.log('zkSync SSO connector initialized with debug mode enabled')

// Create the wagmi config
export const wagmiConfig = createConfig({
  connectors: [ssoConnector],
  chains: [zksyncSepoliaTestnet],
  transports: {
    [zksyncSepoliaTestnet.id]: http(env.NEXT_PUBLIC_ZKSYNC_RPC_URL),
  },
  logger: {
    warn: (message) => console.warn(message),
    error: (message) => console.error(message),
  },
})

console.log('wagmiConfig created with zkSync SSO connector') 