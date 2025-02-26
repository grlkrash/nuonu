import { ethers } from 'ethers'
import { Provider, Wallet } from 'zksync-web3'
import * as fcl from '@onflow/fcl'

// Define interfaces for different blockchain wallets
export interface BaseWallet {
  address: string
  provider: any
  signer: any
}

export interface ZkSyncWallet extends BaseWallet {
  sessionKey?: string
}

export interface FlowWallet {
  address: string
  authenticated: boolean
}

export interface WalletState {
  baseWallet: BaseWallet | null
  zkSyncWallet: ZkSyncWallet | null
  flowWallet: FlowWallet | null
  isConnecting: boolean
  error: string | null
}

// Wallet abstraction class
export class WalletAbstraction {
  private state: WalletState = {
    baseWallet: null,
    zkSyncWallet: null,
    flowWallet: null,
    isConnecting: false,
    error: null
  }

  private listeners: ((state: WalletState) => void)[] = []

  // Subscribe to state changes
  subscribe(listener: (state: WalletState) => void) {
    this.listeners.push(listener)
    listener(this.state)
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // Update state and notify listeners
  private setState(newState: Partial<WalletState>) {
    this.state = { ...this.state, ...newState }
    this.listeners.forEach(listener => listener(this.state))
  }

  // Connect to Base (Ethereum) wallet
  async connectBaseWallet() {
    try {
      this.setState({ isConnecting: true, error: null })
      
      if (!window.ethereum) {
        throw new Error('MetaMask or another web3 provider is required')
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      
      this.setState({ 
        baseWallet: { address, provider, signer },
        isConnecting: false
      })
      
      return { address, provider, signer }
    } catch (error) {
      console.error('Error connecting to Base wallet:', error)
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to connect to Base wallet',
        isConnecting: false
      })
      throw error
    }
  }

  // Connect to zkSync wallet
  async connectZkSyncWallet() {
    try {
      this.setState({ isConnecting: true, error: null })
      
      if (!window.ethereum) {
        throw new Error('MetaMask or another web3 provider is required')
      }
      
      // Connect to zkSync network
      const provider = new Provider('https://mainnet.era.zksync.io')
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum)
      await ethProvider.send('eth_requestAccounts', [])
      const signer = ethProvider.getSigner()
      const address = await signer.getAddress()
      
      // Create zkSync wallet
      const zkSyncWallet = new Wallet(signer, provider)
      
      this.setState({ 
        zkSyncWallet: { 
          address, 
          provider, 
          signer: zkSyncWallet 
        },
        isConnecting: false
      })
      
      return { address, provider, signer: zkSyncWallet }
    } catch (error) {
      console.error('Error connecting to zkSync wallet:', error)
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to connect to zkSync wallet',
        isConnecting: false
      })
      throw error
    }
  }

  // Create zkSync session key
  async createZkSyncSessionKey() {
    try {
      if (!this.state.zkSyncWallet) {
        throw new Error('zkSync wallet not connected')
      }
      
      // This is a simplified version - in a real implementation, 
      // you would use the zkSync Smart Sign-On SDK
      const sessionKey = ethers.Wallet.createRandom().privateKey
      
      this.setState({
        zkSyncWallet: {
          ...this.state.zkSyncWallet,
          sessionKey
        }
      })
      
      return sessionKey
    } catch (error) {
      console.error('Error creating zkSync session key:', error)
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to create zkSync session key'
      })
      throw error
    }
  }

  // Connect to Flow wallet
  async connectFlowWallet() {
    try {
      this.setState({ isConnecting: true, error: null })
      
      // Configure FCL
      fcl.config()
        .put('accessNode.api', 'https://rest-mainnet.onflow.org')
        .put('discovery.wallet', 'https://fcl-discovery.onflow.org/authn')
        .put('app.detail.title', 'Artist Grant AI')
        .put('app.detail.icon', 'https://placekitten.com/g/200/200')
      
      // Authenticate with FCL wallet
      const user = await fcl.authenticate()
      
      this.setState({ 
        flowWallet: { 
          address: user.addr,
          authenticated: true
        },
        isConnecting: false
      })
      
      return { address: user.addr, authenticated: true }
    } catch (error) {
      console.error('Error connecting to Flow wallet:', error)
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to connect to Flow wallet',
        isConnecting: false
      })
      throw error
    }
  }

  // Disconnect all wallets
  disconnectAll() {
    // Disconnect Flow wallet if connected
    if (this.state.flowWallet) {
      fcl.unauthenticate()
    }
    
    this.setState({
      baseWallet: null,
      zkSyncWallet: null,
      flowWallet: null,
      error: null
    })
  }

  // Get current state
  getState(): WalletState {
    return this.state
  }

  // Check if any wallet is connected
  isAnyWalletConnected(): boolean {
    return !!(this.state.baseWallet || this.state.zkSyncWallet || this.state.flowWallet)
  }

  // Get connected wallet addresses
  getConnectedAddresses() {
    return {
      base: this.state.baseWallet?.address || null,
      zkSync: this.state.zkSyncWallet?.address || null,
      flow: this.state.flowWallet?.address || null
    }
  }
}

// Create a singleton instance
export const walletAbstraction = new WalletAbstraction()

// React hook for using wallet abstraction
export function useWalletAbstraction() {
  const [state, setState] = React.useState<WalletState>(walletAbstraction.getState())
  
  React.useEffect(() => {
    return walletAbstraction.subscribe(setState)
  }, [])
  
  return {
    ...state,
    connectBaseWallet: () => walletAbstraction.connectBaseWallet(),
    connectZkSyncWallet: () => walletAbstraction.connectZkSyncWallet(),
    createZkSyncSessionKey: () => walletAbstraction.createZkSyncSessionKey(),
    connectFlowWallet: () => walletAbstraction.connectFlowWallet(),
    disconnectAll: () => walletAbstraction.disconnectAll(),
    isAnyWalletConnected: () => walletAbstraction.isAnyWalletConnected(),
    getConnectedAddresses: () => walletAbstraction.getConnectedAddresses()
  }
}

// Add React import at the top
import React from 'react' 