'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import { zksyncSsoConnector } from 'zksync-sso/connector'
import { zksyncSepoliaTestnet } from 'viem/chains'
import { createConfig, connect, disconnect } from '@wagmi/core'
import { parseEther } from 'viem'
import { ssoConnector, wagmiConfig } from '@/lib/zksync-sso-config'

interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
}

export function ZkSyncWalletConnect() {
  const router = useRouter()
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
  })
  const [error, setError] = useState<string | null>(null)

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      console.log('Checking wallet connection on component mount')
      try {
        // Check if wallet address is stored in localStorage
        const storedAddress = localStorage.getItem('walletAddress')
        console.log('Wallet address from localStorage:', storedAddress)
        
        // Check if there's an active Supabase session
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('Supabase session exists:', sessionData.session ? 'Yes' : 'No')
        
        if (sessionData.session && storedAddress) {
          console.log('Session and wallet address found, verifying match')
          
          // Verify the wallet address matches the one in the session metadata
          const sessionWalletAddress = sessionData.session.user.user_metadata.wallet_address
          
          if (sessionWalletAddress && sessionWalletAddress !== storedAddress) {
            console.warn('Wallet address mismatch between localStorage and session metadata')
            console.log('localStorage address:', storedAddress)
            console.log('Session metadata address:', sessionWalletAddress)
            
            // Update localStorage with the correct address from session
            localStorage.setItem('walletAddress', sessionWalletAddress)
            
            // Set wallet state with the address from session
            setWallet({
              address: sessionWalletAddress,
              isConnected: true,
              isConnecting: false,
            })
          } else {
            // Set wallet state with the stored address
            setWallet({
              address: storedAddress,
              isConnected: true,
              isConnecting: false,
            })
          }
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err)
        
        // Clean up if there was an error
        localStorage.removeItem('walletAddress')
        setWallet({
          address: null,
          isConnected: false,
          isConnecting: false,
        })
      }
    }
    
    checkWalletConnection()
  }, [])

  const handleConnect = async () => {
    setWallet(prev => ({ ...prev, isConnecting: true }))
    setError(null)
    
    try {
      console.log('Initializing connection with ssoConnector on zkSync Sepolia testnet')
      
      // Attempt to connect the wallet
      const result = await connect(wagmiConfig, {
        connector: ssoConnector,
        chainId: zksyncSepoliaTestnet.id,
      })
      console.log('Connection result:', JSON.stringify(result, null, 2))
      
      // Check if connection was successful
      if (!result || !result.accounts || result.accounts.length === 0) {
        throw new Error('Failed to connect wallet: No accounts returned')
      }
      
      // Get the connected wallet address
      const address = result.accounts[0]
      console.log('Connected wallet address:', address)
      
      // Verify the address is valid
      if (!address) {
        throw new Error('Failed to connect wallet: Invalid address')
      }
      
      // Generate a random password for the user
      // Note: This is only used for Supabase authentication, not for the wallet
      const password = crypto.randomUUID()
      
      // Create an email from the wallet address
      const email = `${address.toLowerCase()}@wallet.zksync`
      console.log('Using wallet email for Supabase auth:', email)
      
      // Try to sign in with the wallet email
      console.log('Attempting to sign in with wallet email')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      // If sign in fails, create a new account
      if (signInError) {
        console.log('Sign in failed, creating new account:', signInError.message)
        
        // Create a new account with the wallet email
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              wallet_address: address,
            },
          },
        })
        
        // Check if account creation was successful
        if (signUpError) {
          console.error('Failed to create account:', signUpError)
          throw new Error(`Failed to create account: ${signUpError.message}`)
        }
        
        // Verify session was created
        if (!signUpData.session) {
          console.error('No session created after sign up')
          throw new Error('Session creation failed after sign up')
        }
        
        console.log('New account created successfully')
        console.log('Session created:', signUpData.session ? 'Yes' : 'No')
        
        // Store the wallet address in localStorage
        localStorage.setItem('walletAddress', address)
        
        // Set the wallet state
        setWallet({
          address,
          isConnected: true,
          isConnecting: false,
        })
        
        // Redirect to onboarding for new users
        console.log('Redirecting to onboarding for new user')
        router.push('/onboarding')
      } else {
        // Sign in was successful
        console.log('Sign in successful')
        console.log('Session created:', signInData.session ? 'Yes' : 'No')
        
        // Verify session was created
        if (!signInData.session) {
          console.error('No session created after sign in')
          throw new Error('Session creation failed after sign in')
        }
        
        // Store the wallet address in localStorage
        localStorage.setItem('walletAddress', address)
        
        // Set the wallet state
        setWallet({
          address,
          isConnected: true,
          isConnecting: false,
        })
        
        // Redirect to dashboard for existing users
        console.log('Redirecting to dashboard for existing user')
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      console.error('Error connecting wallet:', err)
      
      // Extract error message based on error type
      let errorMessage = 'Failed to connect wallet'
      
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = String(err)
      }
      
      // Handle specific error cases
      if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
        setError('Connection request was rejected. Please approve the connection request in your wallet.')
      } else if (errorMessage.includes('user rejected')) {
        setError('You rejected the connection request. Please try again and approve the connection.')
      } else if (errorMessage.includes('Session creation failed')) {
        setError('Error during session creation. Please see console for more info.')
        console.error('Session creation error details:', err)
      } else if (errorMessage.includes('Failed to create account')) {
        setError('Failed to create account. Please try again later.')
      } else if (errorMessage.includes('high approval amount')) {
        setError('The approval amount is higher than expected. This is normal for zkSync SSO and is used as a maximum limit, not an actual charge.')
      } else {
        setError(`Failed to connect wallet: ${errorMessage}`)
      }
      
      // Clean up in case of error
      localStorage.removeItem('walletAddress')
      
      // Try to disconnect the wallet if it was partially connected
      try {
        await disconnect(wagmiConfig)
      } catch (disconnectErr) {
        console.error('Error disconnecting after failed connection:', disconnectErr)
      }
      
      // Reset wallet state
      setWallet({
        address: null,
        isConnected: false,
        isConnecting: false,
      })
    } finally {
      setWallet(prev => ({ ...prev, isConnecting: false }))
    }
  }

  const handleDisconnect = async () => {
    setWallet(prev => ({ ...prev, isConnecting: true }))
    setError(null)
    
    try {
      console.log('Disconnecting wallet')
      
      // Disconnect from wagmiConfig
      console.log('Calling disconnect from wagmiConfig')
      await disconnect(wagmiConfig)
      console.log('Successfully disconnected from zkSync SSO')
      
      // Sign out from Supabase
      console.log('Signing out from Supabase')
      const { error: signOutError } = await supabase.auth.signOut()
      
      if (signOutError) {
        console.error('Error signing out from Supabase:', signOutError)
      } else {
        console.log('Successfully signed out from Supabase')
      }
      
      // Clear wallet address from localStorage
      console.log('Clearing wallet address from localStorage')
      localStorage.removeItem('walletAddress')
      
      // Reset wallet state
      console.log('Resetting wallet state')
      setWallet({
        address: null,
        isConnected: false,
        isConnecting: false,
      })
      
      console.log('Wallet disconnected successfully')
      
      // Redirect to home page
      console.log('Redirecting to home page')
      router.push('/')
    } catch (err: unknown) {
      console.error('Error disconnecting wallet:', err)
      
      // Extract error message based on error type
      let errorMessage = 'Failed to disconnect wallet'
      
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = String(err)
      }
      
      setError(`Failed to disconnect wallet: ${errorMessage}`)
      
      // Reset wallet state anyway to allow user to try again
      setWallet({
        address: null,
        isConnected: false,
        isConnecting: false,
      })
    } finally {
      setWallet(prev => ({ ...prev, isConnecting: false }))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      {!wallet.isConnected ? (
        <Button
          onClick={handleConnect}
          disabled={wallet.isConnecting}
          className="w-full bg-transparent border border-white text-white hover:bg-white hover:text-black"
        >
          {wallet.isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect zkSync Wallet
            </>
          )}
        </Button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-gray-800 rounded-md">
            <p className="text-sm text-white font-medium">Connected Wallet</p>
            <p className="text-sm text-gray-400">{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</p>
          </div>
          
          <Button
            onClick={handleDisconnect}
            disabled={wallet.isConnecting}
            variant="destructive"
            className="w-full"
          >
            {wallet.isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect Wallet'
            )}
          </Button>
        </div>
      )}
      
      <p className="mt-4 text-xs text-gray-400">
        Connect your zkSync wallet to access exclusive features and manage your blockchain assets.
      </p>
    </div>
  )
} 