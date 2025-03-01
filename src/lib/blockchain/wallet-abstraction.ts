import { ethers } from 'ethers'
import { Provider, Wallet } from 'zksync-web3'
import * as fcl from '@onflow/fcl'
import { zksyncSsoConnector, callPolicy } from 'zksync-sso/connector'
import { zksyncSepoliaTestnet } from 'viem/chains'
import { cdpWalletManager, CdpWalletConfig } from './cdp-wallet'

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

export interface CdpWalletProvider {
  provider: any
}

export interface WalletState {
  baseWallet: BaseWallet | null
  zkSyncWallet: ZkSyncWallet | null
  flowWallet: FlowWallet | null
  cdpWallet: CdpWalletProvider | null
  isConnecting: boolean
  error: string | null
}

// Wallet abstraction class
export class WalletAbstraction {
  private state: WalletState = {
    baseWallet: null,
    zkSyncWallet: null,
    flowWallet: null,
    cdpWallet: null,
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
      
      // Use the actual zkSync SSO SDK to create a session key
      // This is a simplified implementation - in a real app, you would configure
      // more detailed session parameters as shown in the SDK documentation
      const ssoConnector = zksyncSsoConnector({
        session: {
          expiry: '1 day',
          feeLimit: ethers.utils.parseEther('0.1'),
          transfers: [
            {
              to: this.state.zkSyncWallet.address,
              valueLimit: ethers.utils.parseEther('0.1'),
            },
          ],
        },
      })
      
      // For demo purposes, we'll create a session key and store it
      // In a real implementation, this would involve more complex interaction with the SDK
      const sessionKey = await ssoConnector.createSession(this.state.zkSyncWallet.signer)
      
      this.setState({
        zkSyncWallet: {
          ...this.state.zkSyncWallet,
          sessionKey: sessionKey.id
        }
      })
      
      return sessionKey.id
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

  // Initialize CDP wallet for agent
  async initializeAgentWallet(config: CdpWalletConfig) {
    try {
      this.setState({ isConnecting: true, error: null })
      
      const provider = await cdpWalletManager.initialize(config)
      
      this.setState({ 
        cdpWallet: provider,
        isConnecting: false
      })
      
      return provider
    } catch (error) {
      console.error('Error initializing CDP wallet:', error)
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to initialize CDP wallet',
        isConnecting: false
      })
      throw error
    }
  }

  // Get CDP wallet provider
  getCdpWallet() {
    return this.state.cdpWallet
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
      cdpWallet: null,
      error: null
    })
  }

  // Get current state
  getState(): WalletState {
    return this.state
  }

  // Check if any wallet is connected
  isAnyWalletConnected(): boolean {
    return !!(this.state.baseWallet || this.state.zkSyncWallet || this.state.flowWallet || this.state.cdpWallet)
  }

  // Get connected wallet addresses
  getConnectedAddresses() {
    return {
      base: this.state.baseWallet?.address || null,
      zkSync: this.state.zkSyncWallet?.address || null,
      flow: this.state.flowWallet?.address || null,
      cdp: this.state.cdpWallet?.provider.connection.url || null
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
    initializeAgentWallet: (config: CdpWalletConfig) => walletAbstraction.initializeAgentWallet(config),
    getCdpWallet: () => walletAbstraction.getCdpWallet(),
    disconnectAll: () => walletAbstraction.disconnectAll(),
    isAnyWalletConnected: () => walletAbstraction.isAnyWalletConnected(),
    getConnectedAddresses: () => walletAbstraction.getConnectedAddresses()
  }
}

// Add React import at the top
import React from 'react' 