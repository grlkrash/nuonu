'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import * as fcl from '@onflow/fcl'
import { WalletConnect } from './wallet-connect'
import { registerArtist as registerArtistOnBase } from '@/lib/services/blockchain'
import { registerArtist as registerArtistOnZkSync, createSessionKey } from '@/lib/services/zksync-blockchain'
import { registerArtist as registerArtistOnFlow } from '@/lib/services/flow-blockchain'
import { registerArtistCrossChain } from '@/lib/services/chainlink-ccip'

interface MultiChainWalletProps {
  userId: string
  className?: string
}

type BlockchainNetwork = 'base' | 'zksync' | 'flow' | 'cross-chain'

interface WalletState {
  base: {
    connected: boolean
    address: string
    balance: string
  }
  zksync: {
    connected: boolean
    address: string
    balance: string
    sessionKey?: string
  }
  flow: {
    connected: boolean
    address: string
    balance: string
  }
  'cross-chain': {
    connected: boolean
    sourceNetwork?: 'base' | 'zksync' | 'flow'
    destinationNetworks?: Array<'base' | 'zksync' | 'flow'>
  }
}

export function MultiChainWallet({ userId, className = '' }: MultiChainWalletProps) {
  const [activeNetwork, setActiveNetwork] = useState<BlockchainNetwork>('base')
  const [walletState, setWalletState] = useState<WalletState>({
    base: { connected: false, address: '', balance: '0' },
    zksync: { connected: false, address: '', balance: '0' },
    flow: { connected: false, address: '', balance: '0' },
    'cross-chain': { connected: false }
  })
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Connect to Base/Ethereum wallet
  const connectBaseWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No Ethereum wallet found. Please install MetaMask or another wallet.')
      return
    }
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      const balance = ethers.utils.formatEther(await provider.getBalance(address))
      
      setWalletState(prev => ({
        ...prev,
        base: {
          connected: true,
          address,
          balance
        }
      }))
      
      setActiveNetwork('base')
      setError(null)
    } catch (err) {
      console.error('Error connecting Base wallet:', err)
      setError('Failed to connect Base wallet. Please try again.')
    }
  }
  
  // Connect to zkSync wallet
  const connectZkSyncWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No Ethereum wallet found. Please install MetaMask or another wallet.')
      return
    }
    
    try {
      // In a real implementation, this would use zkSync specific libraries
      // For now, we'll use the same Ethereum wallet
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      const balance = ethers.utils.formatEther(await provider.getBalance(address))
      
      setWalletState(prev => ({
        ...prev,
        zksync: {
          connected: true,
          address,
          balance
        }
      }))
      
      setActiveNetwork('zksync')
      setError(null)
    } catch (err) {
      console.error('Error connecting zkSync wallet:', err)
      setError('Failed to connect zkSync wallet. Please try again.')
    }
  }
  
  // Connect to Flow wallet
  const connectFlowWallet = async () => {
    try {
      const user = await fcl.logIn()
      
      if (user.addr) {
        // In a real implementation, this would fetch the FLOW balance
        const balance = '0.0'
        
        setWalletState(prev => ({
          ...prev,
          flow: {
            connected: true,
            address: user.addr,
            balance
          }
        }))
        
        setActiveNetwork('flow')
        setError(null)
      }
    } catch (err) {
      console.error('Error connecting Flow wallet:', err)
      setError('Failed to connect Flow wallet. Please try again.')
    }
  }
  
  // Setup cross-chain integration
  const setupCrossChain = () => {
    // Check which networks are connected
    const connectedNetworks: Array<'base' | 'zksync' | 'flow'> = []
    
    if (walletState.base.connected) connectedNetworks.push('base')
    if (walletState.zksync.connected) connectedNetworks.push('zksync')
    if (walletState.flow.connected) connectedNetworks.push('flow')
    
    if (connectedNetworks.length < 2) {
      setError('Please connect at least two wallets to use cross-chain functionality.')
      return
    }
    
    setWalletState(prev => ({
      ...prev,
      'cross-chain': {
        connected: true,
        sourceNetwork: connectedNetworks[0],
        destinationNetworks: connectedNetworks.slice(1)
      }
    }))
    
    setActiveNetwork('cross-chain')
    setError(null)
  }
  
  // Disconnect wallet
  const disconnectWallet = async () => {
    if (activeNetwork === 'flow') {
      await fcl.unauthenticate()
    }
    
    if (activeNetwork === 'cross-chain') {
      setWalletState(prev => ({
        ...prev,
        'cross-chain': {
          connected: false
        }
      }))
    } else {
      setWalletState(prev => ({
        ...prev,
        [activeNetwork]: {
          connected: false,
          address: '',
          balance: '0'
        }
      }))
    }
  }
  
  // Create a session key for zkSync
  const createZkSyncSessionKey = async () => {
    if (!walletState.zksync.connected) {
      setError('Please connect your zkSync wallet first.')
      return
    }
    
    setIsRegistering(true)
    setError(null)
    setSuccess(null)
    
    try {
      const result = await createSessionKey(userId)
      
      setWalletState(prev => ({
        ...prev,
        zksync: {
          ...prev.zksync,
          sessionKey: result.sessionKey
        }
      }))
      
      setSuccess(`Session key created successfully: ${result.sessionKey.substring(0, 8)}...`)
    } catch (err) {
      console.error('Error creating session key:', err)
      setError('Failed to create session key. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }
  
  // Register wallet with the appropriate blockchain
  const registerWallet = async () => {
    setIsRegistering(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (activeNetwork === 'base') {
        const address = walletState.base.address
        
        if (!address) {
          throw new Error('No wallet connected')
        }
        
        await registerArtistOnBase(userId, address)
        setSuccess('Wallet registered successfully on Base!')
      } else if (activeNetwork === 'zksync') {
        const address = walletState.zksync.address
        
        if (!address) {
          throw new Error('No wallet connected')
        }
        
        await registerArtistOnZkSync(userId, address)
        setSuccess('Wallet registered successfully on zkSync Era!')
      } else if (activeNetwork === 'flow') {
        const address = walletState.flow.address
        
        if (!address) {
          throw new Error('No wallet connected')
        }
        
        await registerArtistOnFlow(userId, address)
        setSuccess('Wallet registered successfully on Flow!')
      } else if (activeNetwork === 'cross-chain') {
        const sourceNetwork = walletState['cross-chain'].sourceNetwork
        const destinationNetworks = walletState['cross-chain'].destinationNetworks
        
        if (!sourceNetwork || !destinationNetworks || destinationNetworks.length === 0) {
          throw new Error('Cross-chain configuration is incomplete')
        }
        
        const sourceAddress = walletState[sourceNetwork].address
        
        if (!sourceAddress) {
          throw new Error(`No wallet connected for ${sourceNetwork}`)
        }
        
        await registerArtistCrossChain(
          userId,
          sourceAddress,
          sourceNetwork,
          destinationNetworks
        )
        
        setSuccess(`Wallet registered across multiple chains: ${sourceNetwork} → ${destinationNetworks.join(', ')}`)
      }
    } catch (err) {
      console.error(`Error registering ${activeNetwork} wallet:`, err)
      setError(`Failed to register ${activeNetwork} wallet. Please try again.`)
    } finally {
      setIsRegistering(false)
    }
  }
  
  return (
    <div className={`${className}`}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Multi-Chain Wallet</h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveNetwork('base')}
            className={`px-3 py-1 rounded-md ${
              activeNetwork === 'base'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Base
          </button>
          <button
            onClick={() => setActiveNetwork('zksync')}
            className={`px-3 py-1 rounded-md ${
              activeNetwork === 'zksync'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            zkSync Era
          </button>
          <button
            onClick={() => setActiveNetwork('flow')}
            className={`px-3 py-1 rounded-md ${
              activeNetwork === 'flow'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Flow
          </button>
          <button
            onClick={setupCrossChain}
            className={`px-3 py-1 rounded-md ${
              activeNetwork === 'cross-chain'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Cross-Chain
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-sm">
            {success}
          </div>
        )}
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          {activeNetwork === 'base' && (
            <div>
              <h3 className="font-medium mb-2">Base Wallet</h3>
              {!walletState.base.connected ? (
                <button
                  onClick={connectBaseWallet}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                  Connect Base Wallet
                </button>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Connected</p>
                    <button
                      onClick={disconnectWallet}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Disconnect
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mb-1 truncate">
                    {walletState.base.address}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Balance: {walletState.base.balance} ETH
                  </p>
                  <button
                    onClick={registerWallet}
                    disabled={isRegistering}
                    className="mt-4 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                  >
                    {isRegistering ? 'Registering...' : 'Register Wallet'}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeNetwork === 'zksync' && (
            <div>
              <h3 className="font-medium mb-2">zkSync Era Wallet</h3>
              {!walletState.zksync.connected ? (
                <button
                  onClick={connectZkSyncWallet}
                  className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors"
                >
                  Connect zkSync Wallet
                </button>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Connected</p>
                    <button
                      onClick={disconnectWallet}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Disconnect
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mb-1 truncate">
                    {walletState.zksync.address}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Balance: {walletState.zksync.balance} ETH
                  </p>
                  
                  {walletState.zksync.sessionKey ? (
                    <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                      <p className="text-xs text-purple-700 dark:text-purple-400">
                        Session Key: {walletState.zksync.sessionKey.substring(0, 8)}...
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={createZkSyncSessionKey}
                      disabled={isRegistering}
                      className="mt-2 w-full py-1 px-3 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                    >
                      {isRegistering ? 'Creating...' : 'Create Session Key'}
                    </button>
                  )}
                  
                  <button
                    onClick={registerWallet}
                    disabled={isRegistering}
                    className="mt-4 w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                  >
                    {isRegistering ? 'Registering...' : 'Register Wallet'}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeNetwork === 'flow' && (
            <div>
              <h3 className="font-medium mb-2">Flow Wallet</h3>
              {!walletState.flow.connected ? (
                <button
                  onClick={connectFlowWallet}
                  className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
                >
                  Connect Flow Wallet
                </button>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Connected</p>
                    <button
                      onClick={disconnectWallet}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Disconnect
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mb-1 truncate">
                    {walletState.flow.address}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Balance: {walletState.flow.balance} FLOW
                  </p>
                  <button
                    onClick={registerWallet}
                    disabled={isRegistering}
                    className="mt-4 w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                  >
                    {isRegistering ? 'Registering...' : 'Register Wallet'}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeNetwork === 'cross-chain' && (
            <div>
              <h3 className="font-medium mb-2">Cross-Chain Integration</h3>
              {!walletState['cross-chain'].connected ? (
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Connect at least two wallets to enable cross-chain functionality.
                  </p>
                  <button
                    onClick={setupCrossChain}
                    className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md transition-colors"
                  >
                    Setup Cross-Chain
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Cross-Chain Setup</p>
                    <button
                      onClick={disconnectWallet}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Reset
                    </button>
                  </div>
                  
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md mb-4">
                    <p className="text-sm text-orange-700 dark:text-orange-400">
                      Source Network: <span className="font-medium">{walletState['cross-chain'].sourceNetwork}</span>
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                      Destination Networks: <span className="font-medium">{walletState['cross-chain'].destinationNetworks?.join(', ')}</span>
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Register your wallet across multiple blockchains using Chainlink CCIP for cross-chain messaging.
                  </p>
                  
                  <button
                    onClick={registerWallet}
                    disabled={isRegistering}
                    className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                  >
                    {isRegistering ? 'Registering Across Chains...' : 'Register Across Chains'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium mb-2">About Multi-Chain Support</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Our platform supports multiple blockchain networks to provide artists with flexibility and options for receiving payments:
        </p>
        
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
              <span className="text-xs font-medium text-blue-800 dark:text-blue-300">B</span>
            </div>
            <div>
              <p className="text-sm font-medium">Base (Coinbase L2)</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fast and low-cost transactions on Ethereum's layer 2
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-2">
              <span className="text-xs font-medium text-purple-800 dark:text-purple-300">Z</span>
            </div>
            <div>
              <p className="text-sm font-medium">zkSync Era</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Zero-knowledge rollup with improved transaction efficiency and session keys
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-2">
              <span className="text-xs font-medium text-green-800 dark:text-green-300">F</span>
            </div>
            <div>
              <p className="text-sm font-medium">Flow</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Developer-friendly blockchain designed for NFTs and digital assets
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-2">
              <span className="text-xs font-medium text-orange-800 dark:text-orange-300">C</span>
            </div>
            <div>
              <p className="text-sm font-medium">Chainlink CCIP</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cross-Chain Interoperability Protocol for seamless multi-chain integration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 