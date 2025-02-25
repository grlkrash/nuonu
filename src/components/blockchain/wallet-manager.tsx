'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { registerArtist } from '@/lib/services/blockchain'
import { updateProfile } from '@/lib/services/profiles'

interface WalletManagerProps {
  userId: string
  className?: string
}

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
}

export function WalletManager({ userId, className = '' }: WalletManagerProps) {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  
  // Check for connected wallet
  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum)
          const accounts = await provider.listAccounts()
          
          if (accounts.length > 0) {
            setWalletAddress(accounts[0])
            loadTransactions(accounts[0])
          }
        } catch (err) {
          console.error('Error checking wallet:', err)
        }
      }
    }
    
    checkWallet()
    
    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0])
          loadTransactions(accounts[0])
        } else {
          setWalletAddress('')
          setTransactions([])
        }
      })
    }
    
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {})
      }
    }
  }, [])
  
  const loadTransactions = async (address: string) => {
    setIsLoadingTransactions(true)
    
    try {
      // In a real app, this would fetch transactions from an API or blockchain explorer
      // For demo purposes, we're creating mock transactions
      const mockTransactions: Transaction[] = [
        {
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          to: address,
          value: '0.1',
          timestamp: Date.now() - 86400000 // 1 day ago
        },
        {
          hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          from: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          to: address,
          value: '0.05',
          timestamp: Date.now() - 172800000 // 2 days ago
        }
      ]
      
      setTransactions(mockTransactions)
    } catch (err) {
      console.error('Error loading transactions:', err)
    } finally {
      setIsLoadingTransactions(false)
    }
  }
  
  const handleRegisterWallet = async () => {
    if (!walletAddress) {
      setError('No wallet connected. Please connect your wallet first.')
      return
    }
    
    setIsRegistering(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Register wallet with the contract
      await registerArtist(userId, walletAddress)
      
      // Update user profile with wallet address
      await updateProfile({
        id: userId,
        wallet_address: walletAddress
      })
      
      setSuccess('Wallet registered successfully!')
    } catch (err) {
      console.error('Error registering wallet:', err)
      setError('Failed to register wallet. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }
  
  if (!walletAddress) {
    return (
      <div className={`${className} p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md text-center`}>
        <p className="text-gray-600 dark:text-gray-300">
          No wallet connected. Please connect your wallet above to manage it.
        </p>
      </div>
    )
  }
  
  return (
    <div className={`${className}`}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md">
          {success}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Connected Wallet</h3>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
          <p className="font-mono text-sm break-all">{walletAddress}</p>
          
          <button
            onClick={handleRegisterWallet}
            disabled={isRegistering}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {isRegistering ? 'Registering...' : 'Register Wallet for Payments'}
          </button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">Transaction History</h3>
        
        {isLoadingTransactions ? (
          <div className="p-4 text-center">
            <p className="text-gray-600 dark:text-gray-300">Loading transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((tx) => (
                  <tr key={tx.hash}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tx.hash.substring(0, 6)}...{tx.hash.substring(tx.hash.length - 4)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{tx.value} ETH</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md text-center">
            <p className="text-gray-600 dark:text-gray-300">No transactions found.</p>
          </div>
        )}
      </div>
    </div>
  )
} 