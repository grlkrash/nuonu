'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Loader2, Wallet } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'
import { connect, disconnect } from '@wagmi/core'
import { zksyncSepoliaTestnet } from 'viem/chains'
import { ssoConnector, wagmiConfig, handleZkSyncError } from '../../lib/zksync-sso-config'
import { useToast } from '@/components/ui/use-toast'
import { env } from '@/lib/env'

interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
}

export function ZkSyncWalletConnect() {
  const router = useRouter()
  const { toast } = useToast()
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
        
        // Also check for wallet address in cookies as a fallback
        const getCookieValue = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
        
        const cookieAddress = getCookieValue('wallet-address');
        if (cookieAddress && !storedAddress) {
          console.log('Wallet address found in cookie but not localStorage, restoring:', cookieAddress);
          localStorage.setItem('walletAddress', cookieAddress);
        }
        
        // Use the address from localStorage or cookie
        const walletAddress = storedAddress || cookieAddress;
        
        // Check if there's an active Supabase session
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('Supabase session exists:', sessionData.session ? 'Yes' : 'No')
        
        if (sessionData.session && walletAddress) {
          console.log('Session and wallet address found, verifying match')
          
          // Verify the wallet address matches the one in the session metadata
          const sessionWalletAddress = sessionData.session.user.user_metadata?.wallet_address
          
          if (sessionWalletAddress && sessionWalletAddress !== walletAddress) {
            console.warn('Wallet address mismatch between storage and session metadata')
            console.log('Storage address:', walletAddress)
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
              address: walletAddress,
              isConnected: true,
              isConnecting: false,
            })
          }
        } else if (walletAddress) {
          // We have a wallet address but may not have a session
          // Just update the UI state, actual recovery is handled by SessionRecovery component
          setWallet({
            address: walletAddress,
            isConnected: true,
            isConnecting: false,
          })
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
    setWallet({
      address: null,
      isConnected: false,
      isConnecting: true,
    })
    setError(null)

    try {
      // Step 1: Clear ALL browser storage to prevent conflicts
      console.log('Clearing ALL storage before zkSync SSO connection...')
      
      // First disconnect any existing connections
      try {
        await disconnect(wagmiConfig)
        console.log('Disconnected any existing connections')
      } catch (e) {
        console.log('No existing connections to disconnect')
      }
      
      // Clear localStorage completely
      console.log('Clearing localStorage completely')
      localStorage.clear()
      
      // Clear sessionStorage completely
      console.log('Clearing sessionStorage completely')
      sessionStorage.clear()
      
      // Clear all cookies
      console.log('Clearing all cookies')
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=')
        if (name) {
          document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
        }
      })
      
      // Step 2: Verify browser compatibility
      console.log('Checking browser compatibility for zkSync SSO...')
      if (!window.isSecureContext) {
        throw new Error('Browser is not in a secure context. Please use HTTPS or localhost.')
      }
      
      if (!('credentials' in navigator)) {
        throw new Error('Browser does not support WebAuthn/Passkeys required for zkSync SSO')
      }
      
      // Step 3: Verify contract configuration
      console.log('Verifying zkSync SSO contract configuration...')
      console.log('Contract address:', env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS)
      console.log('RPC URL:', env.NEXT_PUBLIC_ZKSYNC_RPC_URL)
      
      // Check if contract address looks like a local development address
      if (env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS?.startsWith('0xe7f1725E')) {
        console.warn('WARNING: Using what appears to be a Hardhat default contract address')
        console.warn('This is likely not the correct zkSync SSO contract address')
        
        // Show warning but continue - don't throw error yet
        toast({
          title: "Configuration Warning",
          description: "Using a development contract address. Connection may fail.",
          variant: "destructive"
        })
      }
      
      // Step 4: Connect using EXACTLY the official documentation approach
      console.log('Connecting to zkSync SSO using EXACT documentation approach')
      console.log('Chain ID:', zksyncSepoliaTestnet.id)
      
      // This is the exact code from the documentation
      const result = await connect(wagmiConfig, {
        connector: ssoConnector,
        chainId: zksyncSepoliaTestnet.id,
      })
      
      console.log('Connection successful:', result)

      if (!result || !result.accounts || result.accounts.length === 0) {
        throw new Error('No accounts returned from connection')
      }

      const address = result.accounts[0]
      console.log('Connected with address:', address)
      
      // Store the wallet address
      localStorage.setItem('walletAddress', address)
      
      // Update UI state
      setWallet({
        address,
        isConnected: true,
        isConnecting: false,
      })
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`
      })

      // Step 5: Handle Supabase authentication
      try {
        // Create an email from the wallet address
        const email = `${address.toLowerCase()}@wallet.zksync`
        console.log('Using email for Supabase authentication:', email)
        
        // Use a deterministic password based on the wallet address
        const password = `${address.toLowerCase()}-${address.slice(2, 10)}-recovery`

        // Try to sign in first
        console.log('Attempting to sign in with wallet-based email')
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        // If sign in fails, create a new account
        if (signInError) {
          console.log('Sign in failed, creating new account:', signInError.message)
          
          // Create a new account
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                wallet_address: address,
              },
              emailRedirectTo: `${window.location.origin}/auth/callback?skip_confirmation=true`
            },
          })

          if (signUpError) {
            console.error('Account creation failed:', signUpError)
            console.log('Continuing with zkSync SSO only (without Supabase account)')
            // Continue with zkSync SSO only - don't throw an error here
          } else {
            console.log('New account created successfully')
            console.log('Session created:', signUpData.session ? 'Yes' : 'No')
            
            // If we have a session, redirect to onboarding
            if (signUpData.session) {
              console.log('Redirecting to onboarding for new user')
              router.push('/onboarding')
            }
          }
        } else {
          // Sign in was successful
          console.log('Sign in successful')
          console.log('Session created:', signInData.session ? 'Yes' : 'No')
          
          // Update user metadata if needed
          if (signInData.session && (!signInData.user?.user_metadata?.wallet_address || 
              signInData.user.user_metadata.wallet_address !== address)) {
            console.log('Updating user metadata with wallet address')
            await supabase.auth.updateUser({
              data: { wallet_address: address }
            })
          }
          
          // Redirect to dashboard
          console.log('Redirecting to dashboard')
          router.push('/dashboard')
        }
      } catch (supabaseError) {
        console.error('Error with Supabase authentication:', supabaseError)
        // Don't throw here - we still have a successful zkSync connection
        // Just show a toast notification
        toast({
          title: "Partial Connection",
          description: "Connected to wallet but couldn't create account. Some features may be limited."
        })
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err)
      setWallet({
        address: null,
        isConnected: false,
        isConnecting: false,
      })
      
      // Get a user-friendly error message
      const userFriendlyError = handleZkSyncError(err)
      setError(userFriendlyError)
      
      // Check for contract address issues
      if (err.message && (err.message.includes('contract') || err.message.includes('address'))) {
        console.error('CONTRACT ADDRESS ERROR DETECTED')
        console.error('Current contract address:', env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS)
        
        toast({
          title: "Contract Configuration Error",
          description: "The zkSync SSO contract address may be incorrect. Please check your configuration.",
          variant: "destructive"
        })
      }
      // Check for session creation errors
      else if (err.message && err.message.includes('session creation')) {
        console.log('Session creation error detected - clearing all related storage')
        
        // Clear all localStorage items related to zkSync SSO
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('zksync') || key.includes('wagmi') || key.includes('walletconnect'))) {
            keysToRemove.push(key)
          }
        }
        
        // Remove the keys in a separate loop to avoid index issues
        keysToRemove.forEach(key => {
          console.log(`Clearing localStorage item: ${key}`)
          localStorage.removeItem(key)
        })
        
        // Clear all cookies related to zkSync SSO
        document.cookie = 'zksync-sso-code-verifier=; path=/; max-age=0; SameSite=Lax'
        document.cookie = 'zksync-sso-state=; path=/; max-age=0; SameSite=Lax'
        document.cookie = 'wallet-address=; path=/; max-age=0; SameSite=Lax'
        
        toast({
          title: "Session Creation Error",
          description: "Failed to create session. This may be due to an incorrect contract address configuration.",
          variant: "destructive"
        })
      }
      // Check for code verifier issues
      else if (err.message && err.message.includes('code verifier')) {
        console.log('Code verifier issue detected - clearing related storage')
        
        // Clear localStorage items related to zkSync SSO
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('zksync') || key.includes('wagmi') || key.includes('walletconnect'))) {
            keysToRemove.push(key)
          }
        }
        
        // Remove the keys in a separate loop to avoid index issues
        keysToRemove.forEach(key => {
          console.log(`Clearing localStorage item: ${key}`)
          localStorage.removeItem(key)
        })
        
        // Clear related cookies
        document.cookie = 'zksync-sso-code-verifier=; path=/; max-age=0; SameSite=Lax'
        document.cookie = 'zksync-sso-state=; path=/; max-age=0; SameSite=Lax'
        
        toast({
          title: "Connection Error",
          description: "Authentication conflict detected. Please clear your browser cache and try again.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Connection Error",
          description: userFriendlyError,
          variant: "destructive"
        })
      }
    }
  }

  const handleDisconnect = async () => {
    try {
      console.log('Disconnecting wallet')
      await disconnect(wagmiConfig)
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear stored wallet address
      localStorage.removeItem('walletAddress')
      document.cookie = 'wallet-address=; path=/; max-age=0; SameSite=Lax'
      
      // Clear any localStorage items that might be related to zkSync SSO
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('zksync') || key.includes('wagmi') || key.includes('walletconnect'))) {
          keysToRemove.push(key)
        }
      }
      
      // Remove the keys in a separate loop to avoid index issues
      keysToRemove.forEach(key => {
        console.log(`Clearing localStorage item: ${key}`)
        localStorage.removeItem(key)
      })
      
      // Clear related cookies
      document.cookie = 'zksync-sso-code-verifier=; path=/; max-age=0; SameSite=Lax'
      document.cookie = 'zksync-sso-state=; path=/; max-age=0; SameSite=Lax'
      
      // Update state
      setWallet({
        address: null,
        isConnected: false,
        isConnecting: false,
      })
      
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected.",
      })
      
      // Redirect to sign in page
      router.push('/signin')
    } catch (err) {
      console.error('Error disconnecting wallet:', err)
      
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {wallet.isConnected ? (
        <div className="flex flex-col gap-2">
          <div className="bg-gray-800 p-3 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">
                {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Connected'}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisconnect}
              className="h-8 px-2 text-xs"
            >
              Disconnect
            </Button>
          </div>
          <Button 
            variant="default" 
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>
      ) : (
        <Button 
          variant="default" 
          onClick={handleConnect} 
          disabled={wallet.isConnecting}
          className="w-full"
        >
          {wallet.isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </>
          )}
        </Button>
      )}
    </div>
  )
} 