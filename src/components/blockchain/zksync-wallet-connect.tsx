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

export function ZkSyncWalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        console.log('Checking for existing wallet connection...')
        
        // Check localStorage first
        const storedWalletAddress = localStorage.getItem('walletAddress')
        
        if (storedWalletAddress) {
          console.log('Found wallet address in localStorage:', storedWalletAddress)
          
          // Verify if the user is also logged in with Supabase
          console.log('Checking for Supabase session...')
          const { data, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Error getting Supabase session:', error)
            localStorage.removeItem('walletAddress')
            return
          }
          
          console.log('Current Supabase session:', data.session ? 'exists' : 'none')
          
          if (data.session) {
            console.log('Valid session found, setting wallet as connected')
            
            // Check if the wallet address in session metadata matches localStorage
            const metadataWalletAddress = data.session.user?.user_metadata?.wallet_address
            
            if (metadataWalletAddress && metadataWalletAddress !== storedWalletAddress) {
              console.warn('Wallet address mismatch between localStorage and session metadata')
              console.log('localStorage:', storedWalletAddress)
              console.log('Session metadata:', metadataWalletAddress)
            }
            
            setWalletAddress(storedWalletAddress)
            setIsConnected(true)
          } else {
            console.log('No Supabase session found, clearing wallet connection')
            localStorage.removeItem('walletAddress')
          }
        } else {
          console.log('No wallet address found in localStorage')
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err)
        // Clear any potentially invalid wallet connection
        localStorage.removeItem('walletAddress')
      }
    }
    
    checkWalletConnection()
  }, [])

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)
    
    try {
      console.log('Connecting wallet with zkSync SSO...')
      console.log('Using zkSync Sepolia testnet with chain ID:', zksyncSepoliaTestnet.id)
      
      // Connect using zkSync SSO
      console.log('Initializing connection with ssoConnector...')
      const result = await connect(wagmiConfig, {
        connector: ssoConnector,
        chainId: zksyncSepoliaTestnet.id,
      })
      
      console.log('Connection result:', JSON.stringify(result, null, 2))
      
      if (!result) {
        throw new Error('Connection failed: No result returned')
      }
      
      if (!result.accounts || result.accounts.length === 0) {
        throw new Error('Connection failed: No accounts returned')
      }
      
      const address = result.accounts[0]
      console.log('Wallet connected successfully:', address)
      
      // Verify the connection was successful
      if (!address) {
        throw new Error('Connection failed: Invalid address')
      }
      
      setWalletAddress(address)
      setIsConnected(true)
      
      // Store wallet address in localStorage for persistence
      localStorage.setItem('walletAddress', address)
      
      // Generate a wallet-specific email for Supabase authentication
      const walletEmail = `${address.toLowerCase()}@wallet.user`
      // Use UUID for better security
      const walletPassword = uuidv4()
      
      console.log('Attempting to sign in with wallet email:', walletEmail)
      
      // Try to sign in with the wallet email
      console.log('Signing in with Supabase...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: walletEmail,
        password: walletPassword,
      })
      
      if (signInError) {
        console.log('Sign in failed, creating new account:', signInError.message)
        
        // If sign in fails, create a new account
        console.log('Creating new Supabase account...')
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: walletEmail,
          password: walletPassword,
          options: {
            data: {
              wallet_address: address,
              auth_method: 'wallet',
            },
          },
        })
        
        if (signUpError) {
          console.error('Failed to create account:', signUpError)
          throw new Error(`Failed to create account: ${signUpError.message}`)
        }
        
        console.log('Account created successfully:', signUpData?.user?.id)
        
        // Verify session was created
        console.log('Verifying session after signup...')
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('Session after signup:', sessionData.session ? 'exists' : 'none')
        
        if (!sessionData.session) {
          // Try to sign in again after account creation
          console.log('No session after signup, attempting to sign in again')
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email: walletEmail,
            password: walletPassword,
          })
          
          if (retryError) {
            console.error('Failed to sign in after account creation:', retryError)
            throw new Error(`Failed to sign in after account creation: ${retryError.message}`)
          }
          
          console.log('Retry sign in successful:', retryData?.user?.id)
        }
        
        // Redirect to onboarding if new account
        console.log('Redirecting to onboarding...')
        router.push('/onboarding')
      } else {
        console.log('Signed in successfully:', signInData?.user?.id)
        
        // Verify session exists
        console.log('Verifying session after signin...')
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('Session after signin:', sessionData.session ? 'exists' : 'none')
        
        if (!sessionData.session) {
          throw new Error('Failed to create session after successful sign in')
        }
        
        // Redirect to dashboard for existing users
        console.log('Redirecting to dashboard...')
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      console.error('Wallet connection error:', err)
      
      // Properly type the error for TypeScript
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.log('Error message:', errorMessage)
      
      // Provide more specific error messages based on the error type
      if (errorMessage.includes('Request rejected')) {
        setError('Connection request was rejected. Please try again and approve the connection in your wallet.')
      } else if (errorMessage.includes('User rejected')) {
        setError('You rejected the connection request. Please try again and approve the connection.')
      } else if (errorMessage.includes('session creation')) {
        setError('Error during session creation. Please try again or use a different wallet.')
        console.error('Session creation error details:', err)
      } else if (errorMessage.includes('Failed to create account')) {
        setError('Failed to create account. Please try again with a different wallet.')
      } else {
        setError('Failed to connect wallet: ' + errorMessage)
      }
      
      // Clean up if there was an error
      localStorage.removeItem('walletAddress')
      setWalletAddress(null)
      setIsConnected(false)
      
      // Try to disconnect the wallet if it was partially connected
      try {
        await disconnect(wagmiConfig)
      } catch (disconnectErr) {
        console.error('Error during disconnect after failed connection:', disconnectErr)
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      console.log('Disconnecting wallet...')
      
      // Disconnect wallet
      console.log('Calling disconnect on wagmiConfig...')
      await disconnect(wagmiConfig)
      console.log('Wallet disconnected from zkSync SSO')
      
      // Sign out from Supabase
      console.log('Signing out from Supabase...')
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        console.error('Error signing out from Supabase:', signOutError)
        throw new Error(`Failed to sign out from Supabase: ${signOutError.message}`)
      } else {
        console.log('Signed out from Supabase successfully')
      }
      
      // Clear local storage
      console.log('Clearing wallet address from localStorage...')
      localStorage.removeItem('walletAddress')
      
      // Reset state
      setWalletAddress(null)
      setIsConnected(false)
      
      console.log('Wallet disconnected successfully')
      
      // Redirect to home page
      console.log('Redirecting to home page...')
      router.push('/')
    } catch (err: unknown) {
      console.error('Disconnect error:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(`Failed to disconnect wallet: ${errorMessage}`)
    }
  }

  return (
    <div className="p-4 bg-black border border-gray-700 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Connect Your Wallet</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {!isConnected ? (
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full bg-transparent border border-white text-white hover:bg-white hover:text-black"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect with zkSync SSO
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-gray-800 rounded-md">
            <p className="text-sm text-white font-medium">Connected Wallet</p>
            <p className="text-sm text-gray-400">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</p>
          </div>
          
          <Button 
            onClick={handleDisconnect}
            className="w-full bg-transparent border border-white text-white hover:bg-white hover:text-black"
          >
            Disconnect Wallet
          </Button>
        </div>
      )}
      
      <p className="mt-4 text-xs text-gray-400">
        Connect your zkSync wallet to access exclusive features and manage your blockchain assets.
      </p>
    </div>
  )
} 