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

export const AGENT_ID = 'artist-grant-agent-001' 