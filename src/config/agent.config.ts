import { AgentKitConfig } from '@coinbase/agentkit'

export const agentConfig: AgentKitConfig = {
  networks: {
    base: {
      chainId: '84532', // Base Sepolia
      rpcUrl: 'https://sepolia.base.org',
    },
    zksync: {
      chainId: '300', // zkSync Era Testnet
      rpcUrl: 'https://sepolia.era.zksync.dev',
    }
  },
  persistence: {
    walletDataFile: '.agent-wallet-data.json'
  }
}

// Agent identifier for logging and tracking
export const AGENT_ID = 'artist-grant-agent-001'

// Network configuration for different chains
export const NETWORK_CONFIG = {
  base: {
    name: 'Base Sepolia',
    id: 'base-sepolia',
    chainId: '84532',
    rpcUrl: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
    currency: 'ETH'
  },
  zksync: {
    name: 'zkSync Era Testnet',
    id: 'zksync-era-testnet',
    chainId: '300',
    rpcUrl: 'https://sepolia.era.zksync.dev',
    explorer: 'https://sepolia.explorer.zksync.io',
    currency: 'ETH'
  },
  flow: {
    name: 'Flow Testnet',
    id: 'flow-testnet',
    accessNode: 'https://rest-testnet.onflow.org',
    explorer: 'https://testnet.flowscan.org',
    currency: 'FLOW'
  }
} 