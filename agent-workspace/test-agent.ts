import { AgentKit, CdpWalletProvider } from '@coinbase/agentkit'
import { 
  cdpWalletActionProvider,
  cdpApiActionProvider,
  erc20ActionProvider,
  pythActionProvider,
  walletActionProvider,
  wethActionProvider
} from '@coinbase/agentkit/providers'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  try {
    // Initialize CDP wallet provider
    const cdpConfig = {
      apiKey: process.env.COINBASE_API_KEY,
      apiSecret: process.env.COINBASE_API_SECRET,
      networks: {
        base: {
          chainId: '84532', // Base Sepolia
          rpcUrl: 'https://sepolia.base.org',
        }
      },
      persistence: {
        walletDataFile: '.agent-wallet-data.json'
      }
    }
    
    if (!cdpConfig.apiKey || !cdpConfig.apiSecret) {
      throw new Error('Missing CDP credentials')
    }
    
    const walletProvider = new CdpWalletProvider(cdpConfig)
    
    // Initialize AgentKit
    const agentkit = new AgentKit({
      walletProvider,
      actionProviders: [
        cdpWalletActionProvider(),
        cdpApiActionProvider(),
        erc20ActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        wethActionProvider(),
      ]
    })
    
    // Create wallet
    const wallet = await agentkit.walletProvider.createWallet({
      name: 'Artist Grant Agent',
      description: 'Wallet for managing artist grants and funds',
    })
    
    console.log('Agent wallet created:', {
      address: wallet.address,
      id: wallet.id
    })
    
    // Get balance
    const balance = await agentkit.walletProvider.getBalance()
    console.log('Wallet balance:', balance.toString())
    
    return wallet
  } catch (error) {
    console.error('Error initializing agent:', error)
    throw error
  }
}

main()
  .then(wallet => console.log('Success! Wallet:', wallet))
  .catch(error => console.error('Failed:', error)) 