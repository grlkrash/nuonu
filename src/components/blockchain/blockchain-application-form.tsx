'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ethers } from 'ethers'
import * as fcl from '@onflow/fcl'
import { registerArtist as registerArtistOnBase } from '@/lib/services/blockchain'
import { registerArtist as registerArtistOnZkSync } from '@/lib/services/zksync-blockchain'
import { registerArtist as registerArtistOnFlow } from '@/lib/services/flow-blockchain'
import { useUser } from '@/lib/auth-hooks'
import Link from 'next/link'

interface BlockchainApplicationFormProps {
  opportunityId: string
  opportunityTitle: string
  className?: string
}

type BlockchainNetwork = 'base' | 'zksync' | 'flow'

interface WalletState {
  connected: boolean
  address: string
  network: BlockchainNetwork
}

export function BlockchainApplicationForm({
  opportunityId,
  opportunityTitle,
  className = '',
}: BlockchainApplicationFormProps) {
  const router = useRouter()
  const { user, loading } = useUser()
  const [wallet, setWallet] = useState<WalletState | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<BlockchainNetwork>('base')
  
  // Connect to wallet based on selected network
  const connectWallet = async () => {
    if (!user) {
      setError('Please sign in to connect your wallet')
      return
    }

    setIsConnecting(true)
    setError(null)
    
    try {
      if (selectedNetwork === 'base' || selectedNetwork === 'zksync') {
        if (typeof window === 'undefined' || !window.ethereum) {
          throw new Error('No Ethereum wallet found. Please install MetaMask or another wallet.')
        }
        
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        await provider.send('eth_requestAccounts', [])
        
        const signer = provider.getSigner()
        const address = await signer.getAddress()
        
        setWallet({
          connected: true,
          address,
          network: selectedNetwork
        })
      } else if (selectedNetwork === 'flow') {
        const user = await fcl.logIn()
        
        if (user.addr) {
          setWallet({
            connected: true,
            address: user.addr,
            network: 'flow'
          })
        } else {
          throw new Error('Failed to connect Flow wallet')
        }
      }
    } catch (err) {
      console.error(`Error connecting ${selectedNetwork} wallet:`, err)
      setError(`Failed to connect ${selectedNetwork} wallet. Please try again.`)
    } finally {
      setIsConnecting(false)
    }
  }
  
  // Disconnect wallet
  const disconnectWallet = async () => {
    if (wallet?.network === 'flow') {
      await fcl.unauthenticate()
    }
    
    setWallet(null)
  }
  
  // Apply for opportunity using connected wallet
  const applyForOpportunity = async () => {
    if (!user) {
      setError('Please sign in to apply')
      return
    }

    if (!wallet) {
      setError('Please connect your wallet first')
      return
    }
    
    setIsApplying(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Register artist wallet on the appropriate blockchain
      if (wallet.network === 'base') {
        await registerArtistOnBase(user.id, wallet.address)
      } else if (wallet.network === 'zksync') {
        await registerArtistOnZkSync(user.id, wallet.address)
      } else if (wallet.network === 'flow') {
        await registerArtistOnFlow(user.id, wallet.address)
      }
      
      // In a real implementation, this would also submit the application to the opportunity
      // For now, we'll just simulate success
      
      setSuccess(`Successfully applied to "${opportunityTitle}" using your ${wallet.network.toUpperCase()} wallet`)
      
      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (err) {
      console.error('Error applying for opportunity:', err)
      setError(`Failed to apply for opportunity. Please try again. ${err instanceof Error ? err.message : ''}`)
    } finally {
      setIsApplying(false)
    }
  }
  
  // If user is not authenticated, show a message prompting them to sign in
  if (!loading && !user) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">Blockchain Application</h2>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300 mb-2">
            Create an account to apply via blockchain
          </h3>
          <p className="text-amber-600 dark:text-amber-400 mb-4">
            Sign up or sign in to apply for this opportunity using blockchain verification.
          </p>
          <div className="flex gap-4">
            <Link href="/signup">
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Create Account
              </button>
            </Link>
            <Link href="/signin">
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                Sign In
              </button>
            </Link>
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          <p>Applying with blockchain verification allows you to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Verify your identity using your blockchain wallet</li>
            <li>Create verifiable credentials for your application</li>
            <li>Track your application status on-chain</li>
            <li>Build a verifiable portfolio of applications</li>
          </ul>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Apply with Blockchain Wallet</h2>
      
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
      
      {!wallet ? (
        <div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Connect your blockchain wallet to apply for this opportunity. Your wallet address will be used to receive payments if your application is accepted.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Blockchain Network
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedNetwork('base')}
                className={`px-3 py-1 rounded-md ${
                  selectedNetwork === 'base'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Base
              </button>
              <button
                type="button"
                onClick={() => setSelectedNetwork('zksync')}
                className={`px-3 py-1 rounded-md ${
                  selectedNetwork === 'zksync'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                zkSync Era
              </button>
              <button
                type="button"
                onClick={() => setSelectedNetwork('flow')}
                className={`px-3 py-1 rounded-md ${
                  selectedNetwork === 'flow'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Flow
              </button>
            </div>
          </div>
          
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {isConnecting ? 'Connecting...' : `Connect ${selectedNetwork.toUpperCase()} Wallet`}
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="font-medium">Connected to {wallet.network.toUpperCase()}</p>
              <button
                onClick={disconnectWallet}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Disconnect
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate">
              {wallet.address}
            </p>
          </div>
          
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Applying for: {opportunityTitle}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              By applying with your blockchain wallet, you agree to receive payments through this wallet address if your application is accepted.
            </p>
          </div>
          
          <button
            onClick={applyForOpportunity}
            disabled={isApplying}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {isApplying ? 'Applying...' : 'Apply Now'}
          </button>
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Why use a blockchain wallet?
        </h3>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
          <li>Receive payments directly without intermediaries</li>
          <li>Lower transaction fees compared to traditional payment methods</li>
          <li>Faster international payments without currency conversion delays</li>
          <li>Full control over your funds at all times</li>
          <li>Transparent payment history on the blockchain</li>
        </ul>
      </div>
    </div>
  )
} 