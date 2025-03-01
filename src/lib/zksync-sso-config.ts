import { zksyncSsoConnector } from 'zksync-sso/connector'
import { createConfig, http } from 'wagmi'
import { parseEther } from 'viem'
import { zksyncSepoliaTestnet } from 'viem/chains'
import { env } from "@/lib/env"

// Official contract addresses from zkSync documentation
const OFFICIAL_ZKSYNC_SSO_CONTRACT = {
  sepolia: "0x9A6DE0f62Aa270A8bCB1e2610078650D539B1Ef9", // Official Sepolia testnet address
  testnet: "0x9A6DE0f62Aa270A8bCB1e2610078650D539B1Ef9"  // Same as Sepolia for testnet
}

// Chain configuration matching official docs
const sepoliaChain = {
  ...zksyncSepoliaTestnet,
  id: Number(process.env.NEXT_PUBLIC_ZKSYNC_CHAIN_ID || zksyncSepoliaTestnet.id),
}

// Get network from env or default to sepolia
const network = (env.NEXT_PUBLIC_ZKSYNC_NETWORK || 'sepolia') as keyof typeof OFFICIAL_ZKSYNC_SSO_CONTRACT

console.log('Initializing zkSync SSO with:')
console.log(`- Network: ${network}`)
console.log(`- RPC URL: ${sepoliaChain.rpcUrls.default.http[0]}`)
console.log(`- Contract Address: ${OFFICIAL_ZKSYNC_SSO_CONTRACT[network]}`)
console.log(`- Chain ID: ${sepoliaChain.id}`)

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

// Storage keys
const STORAGE_KEYS = {
  SESSION: 'zksync-sso-session',
  CODE_VERIFIER: 'zksync-sso-code-verifier'
}

// Client-side storage helper
const storage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null
    try {
      return window.localStorage.getItem(key)
    } catch (error) {
      console.warn('Failed to get item from storage:', error)
      return null
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, value)
    } catch (error) {
      console.warn('Failed to set item in storage:', error)
    }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove item from storage:', error)
    }
  }
}

export const getZkSyncSSOConfig = () => {
  const contractAddress = process.env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS;
  const authServerUrl = process.env.NEXT_PUBLIC_ZKSYNC_SSO_AUTH_SERVER_URL || 'https://sso-testnet.zksync.dev';
  const chainId = process.env.NEXT_PUBLIC_ZKSYNC_CHAIN_ID;

  if (!contractAddress) {
    console.error("Missing NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS");
    throw new Error("Missing ZKSYNC_CONTRACT_ADDRESS");
  }

  if (!authServerUrl) {
    console.error("Missing NEXT_PUBLIC_ZKSYNC_SSO_AUTH_SERVER_URL");
    throw new Error("Missing ZKSYNC_SSO_AUTH_SERVER_URL");
  }

  if (!chainId) {
    console.error("Missing NEXT_PUBLIC_ZKSYNC_CHAIN_ID");
    throw new Error("Missing ZKSYNC_CHAIN_ID");
  }

  const parsedChainId = parseInt(chainId, 10);

  if (isNaN(parsedChainId)) {
    console.error("Invalid NEXT_PUBLIC_ZKSYNC_CHAIN_ID");
    throw new Error("Invalid ZKSYNC_CHAIN_ID");
  }

  console.log("ZkSync SSO Config:", {
    contractAddress,
    authServerUrl,
    chainId: parsedChainId,
  });

  const sessionConfig = {
    expiry: "1 day",
    feeLimit: parseEther("0.1"),
    transfers: [
      {
        // Allow transfers to any address with a value limit of 0.01 ETH
        to: "0x0000000000000000000000000000000000000000", // Zero address as a placeholder
        valueLimit: parseEther("0.01"),
      },
    ],
  };

  console.log("Session config:", sessionConfig);

  return {
    contractAddress,
    authServerUrl,
    chainId: parsedChainId,
    sessionConfig,
    debug: true,
  };
};

export const getZkSyncSSOConnector = () => {
  const config = getZkSyncSSOConfig();
  
  console.log('Creating zkSync SSO connector with config:', config);
  
  return zksyncSsoConnector({
    contractAddress: config.contractAddress,
    authServerUrl: config.authServerUrl,
    chains: [sepoliaChain],
    options: {
      shimDisconnect: true,
      debug: config.debug,
    },
    session: config.sessionConfig,
  });
};

export const wagmiConfig = createConfig({
  connectors: [getZkSyncSSOConnector()],
  chains: [sepoliaChain],
  transports: {
    [sepoliaChain.id]: http(sepoliaChain.rpcUrls.default.http[0])
  },
})

console.log('wagmiConfig created with zkSync SSO connector')

// Helper function to handle zkSync SSO errors (to be used in components)
export function handleZkSyncSSOError(error: any) {
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