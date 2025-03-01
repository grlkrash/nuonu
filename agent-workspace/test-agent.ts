import { AgentKit, CdpWalletProvider } from '@coinbase/agentkit'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load environment from parent directory's .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Define wallet data file path
const WALLET_DATA_FILE = path.resolve(__dirname, './wallet_data.json')

async function main() {
  try {
    console.log('Initializing CDP wallet provider...')
    
    // Map our existing environment variables to the ones expected by AgentKit
    if (process.env.COINBASE_API_KEY && !process.env.CDP_API_KEY_NAME) {
      process.env.CDP_API_KEY_NAME = process.env.COINBASE_API_KEY;
      console.log('Using COINBASE_API_KEY as CDP_API_KEY_NAME');
    }
    
    if (process.env.COINBASE_API_SECRET && !process.env.CDP_API_KEY_PRIVATE_KEY) {
      process.env.CDP_API_KEY_PRIVATE_KEY = process.env.COINBASE_API_SECRET;
      console.log('Using COINBASE_API_SECRET as CDP_API_KEY_PRIVATE_KEY');
    }
    
    // Read existing wallet data if available
    let walletDataStr: string | undefined
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, 'utf8')
        console.log('Found existing wallet data')
      } catch (error) {
        console.error('Error reading wallet data:', error)
      }
    }
    
    // Get environment variables
    const apiKeyName = process.env.CDP_API_KEY_NAME || ''
    const apiKeyPrivate = process.env.CDP_API_KEY_PRIVATE_KEY || ''
    
    // Use the correct network ID from the environment or default to base-sepolia
    const networkId = process.env.NETWORK_ID || 'base-sepolia'
    
    console.log('API Key Name:', apiKeyName)
    console.log('API Key Private Key (first 10 chars):', apiKeyPrivate.substring(0, 10) + '...')
    console.log('Network ID:', networkId)
    console.log('Wallet Data exists:', !!walletDataStr)
    
    if (!apiKeyName || !apiKeyPrivate) {
      throw new Error('Missing CDP credentials in .env.local')
    }
    
    // Configure the wallet provider using CdpWalletProvider.configureWithWallet
    console.log('Configuring CDP Wallet Provider...')
    
    // Create configuration object according to the documentation
    const config = {
      apiKeyName: apiKeyName,
      apiKeyPrivateKey: apiKeyPrivate.replace(/\\n/g, '\n'),
      networkId: networkId,
      cdpWalletData: walletDataStr || undefined
    }
    
    const walletProvider = await CdpWalletProvider.configureWithWallet(config)
    
    // Initialize AgentKit
    const agentkit = await AgentKit.from({
      walletProvider,
    })
    
    // Get wallet address
    const address = walletProvider.getAddress()
    console.log(`Wallet address: ${address}`)
    
    // Get wallet balance
    console.log('Getting wallet balance...')
    const balance = await walletProvider.getBalance()
    console.log(`Wallet balance: ${balance} WEI`)
    
    // Export wallet data for future use
    console.log('Exporting wallet data...')
    const exportedWallet = await walletProvider.exportWallet()
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet, null, 2))
    console.log('Wallet data saved to:', WALLET_DATA_FILE)
    
    return {
      address: address,
      balance: balance.toString()
    }
  } catch (error) {
    console.error('Error initializing agent wallet:', error)
    throw error
  }
}

main()
  .then(result => console.log('Success!', result))
  .catch(error => console.error('Failed:', error)) 