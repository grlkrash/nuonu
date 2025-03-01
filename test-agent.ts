import { AgentKit, CdpWalletProvider } from '@coinbase/agentkit'
import * as path from 'path'
import * as fs from 'fs'

// Define file paths
const WALLET_DATA_FILE = path.resolve(__dirname, './wallet_data.json')
const CREDENTIALS_FILE = path.resolve(__dirname, './cdp_credentials.json')

async function main() {
  try {
    console.log('Initializing CDP wallet provider...')
    
    // Read credentials from JSON file
    let credentials
    try {
      const credentialsData = fs.readFileSync(CREDENTIALS_FILE, 'utf8')
      credentials = JSON.parse(credentialsData)
      console.log('Loaded credentials from file')
    } catch (error) {
      console.error('Error reading credentials file:', error)
      throw new Error('Failed to load CDP credentials')
    }
    
    const { apiKeyName, apiKeyPrivateKey, networkId } = credentials
    
    console.log('API Key Name:', apiKeyName)
    console.log('API Key Private Key (first 10 chars):', apiKeyPrivateKey.substring(0, 10) + '...')
    console.log('Network ID:', networkId)
    
    // Read existing wallet data if available
    let walletDataStr: string | undefined
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, 'utf8')
        console.log('Found existing wallet data')
      } catch (error) {
        console.error('Error reading wallet data:', error)
      }
    } else {
      console.log('Wallet data does not exist')
    }
    
    // Configure the wallet provider using CdpWalletProvider.configureWithWallet
    console.log('Configuring CDP Wallet Provider...')
    
    // Create configuration object according to the documentation
    const config = {
      apiKeyName,
      apiKeyPrivateKey,
      networkId,
      cdpWalletData: walletDataStr
    }
    
    console.log('Config prepared, initializing wallet provider...')
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