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
      // Step 1: Clear existing connections and storage to prevent conflicts
      console.log('Preparing for zkSync SSO connection...')
      try {
        await disconnect(wagmiConfig)
        console.log('Disconnected any existing zkSync connections')
        
        // Wait a moment before reconnecting
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Clear any localStorage items that might be related to zkSync SSO
        // This helps prevent code verifier conflicts
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('zksync') || key.includes('wagmi') || key.includes('walletconnect'))) {
            if (key !== 'walletAddress') { // Keep our wallet address
              console.log(`Clearing localStorage item: ${key}`)
              localStorage.removeItem(key)
            }
          }
        }
        
        // Clear related cookies
        document.cookie = 'zksync-sso-code-verifier=; path=/; max-age=0; SameSite=Lax'
        document.cookie = 'zksync-sso-state=; path=/; max-age=0; SameSite=Lax'
      } catch (disconnectError) {
        console.error('Error disconnecting:', disconnectError)
        // Continue anyway
      }
      
      // Step 2: Connect to zkSync SSO (independent of Supabase)
      console.log('Initializing connection with zkSync Sepolia testnet')
      const result = await connect(wagmiConfig, {
        connector: ssoConnector,
        chainId: zksyncSepoliaTestnet.id,
      })
      console.log('Connection result:', result ? 'Success' : 'Failed')

      if (!result || !result.accounts || result.accounts.length === 0) {
        throw new Error('Failed to connect wallet: No accounts returned')
      }

      const address = result.accounts[0]
      console.log('Successfully connected to zkSync SSO with address:', address)

      // Store the wallet address in localStorage and cookies for redundancy
      localStorage.setItem('walletAddress', address)
      document.cookie = `wallet-address=${address}; path=/; max-age=604800; SameSite=Lax`
      
      // Update UI state to show connected
      setWallet({
        address,
        isConnected: true,
        isConnecting: false,
      })
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`
      })

      // Step 3: Now handle Supabase authentication (after successful zkSync connection)
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
      
      // Check for session creation errors
      if (err.message && err.message.includes('session creation')) {
        console.log('Session creation error detected - clearing all related storage')
        
        // Clear all localStorage items related to zkSync SSO
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('zksync') || key.includes('wagmi') || key.includes('walletconnect'))) {
            console.log(`Clearing localStorage item: ${key}`)
            localStorage.removeItem(key)
          }
        }
        
        // Clear all cookies related to zkSync SSO
        document.cookie = 'zksync-sso-code-verifier=; path=/; max-age=0; SameSite=Lax'
        document.cookie = 'zksync-sso-state=; path=/; max-age=0; SameSite=Lax'
        document.cookie = 'wallet-address=; path=/; max-age=0; SameSite=Lax'
        
        toast({
          title: "Session Creation Error",
          description: userFriendlyError
        })
      }
      // Check for code verifier issues
      else if (err.message && err.message.includes('code verifier')) {
        console.log('Code verifier issue detected - clearing related storage')
        
        // Clear localStorage items related to zkSync SSO
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('zksync') || key.includes('wagmi') || key.includes('walletconnect'))) {
            console.log(`Clearing localStorage item: ${key}`)
            localStorage.removeItem(key)
          }
        }
        
        // Clear related cookies
        document.cookie = 'zksync-sso-code-verifier=; path=/; max-age=0; SameSite=Lax'
        document.cookie = 'zksync-sso-state=; path=/; max-age=0; SameSite=Lax'
        
        toast({
          title: "Connection Error",
          description: userFriendlyError
        })
      } else {
        toast({
          title: "Connection Error",
          description: userFriendlyError
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
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('zksync') || key.includes('wagmi') || key.includes('walletconnect'))) {
          console.log(`Clearing localStorage item: ${key}`)
          localStorage.removeItem(key)
        }
      }
      
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