'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

interface WalletConnectProps {
  onConnect?: (address: string) => void
  className?: string
}

export function WalletConnect({ onConnect, className = '' }: WalletConnectProps) {
  const [wallet, setWallet] = useState<{ address: string; provider: any; signer: any } | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Get connected accounts
          const provider = new ethers.providers.Web3Provider(window.ethereum)
          const accounts = await provider.listAccounts()
          
          if (accounts.length > 0) {
            const signer = provider.getSigner()
            const address = await signer.getAddress()
            
            setWallet({
              address,
              provider,
              signer
            })
            
            if (onConnect) onConnect(address)
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err)
        }
      }
    }
    
    checkConnection()
  }, [onConnect])
  
  const connectWallet = async () => {
    setError(null)
    
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No Ethereum wallet found. Please install MetaMask or another wallet.')
      return
    }
    
    try {
      setConnecting(true)
      
      // Request account access
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      
      setWallet({
        address,
        provider,
        signer
      })
      
      if (onConnect) onConnect(address)
    } catch (err) {
      console.error('Error connecting wallet:', err)
      setError('Failed to connect wallet. Please try again.')
    } finally {
      setConnecting(false)
    }
  }
  
  const disconnectWallet = () => {
    setWallet(null)
  }
  
  return (
    <div className={`${className}`}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {!wallet ? (
        <button
          onClick={connectWallet}
          disabled={connecting}
          className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
        >
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <p className="font-medium">Connected Wallet</p>
            <button
              onClick={disconnectWallet}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Disconnect
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {wallet.address}
          </p>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Network: {window.ethereum?.chainId === '0x14a33' ? 'Base Goerli Testnet' : 'Unknown'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 