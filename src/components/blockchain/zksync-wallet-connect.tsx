'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Loader2, Wallet } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'
import { connect, disconnect } from '@wagmi/core'
import { zksyncSepoliaTestnet } from 'viem/chains'
import { getZkSyncSSOConnector, wagmiConfig, handleZkSyncSSOError } from '../../lib/zksync-sso-config'
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
    if (typeof window === 'undefined') return
    
    setWallet({
      address: null,
      isConnected: false,
      isConnecting: true,
    })
    setError(null)

    try {
      // Step 1: Verify browser compatibility first
      if (!window.isSecureContext) {
        throw new Error('Browser is not in a secure context. Please use HTTPS or localhost.')
      }
      
      if (!('credentials' in navigator)) {
        throw new Error('Browser does not support WebAuthn/Passkeys required for zkSync SSO')
      }
      
      console.log('Browser compatibility check passed')
      
      // Step 2: Check for existing Supabase session
      const { data: sessionData } = await supabase.auth.getSession()
      console.log('Supabase session check:', sessionData.session ? 'Session exists' : 'No session')
      
      // Step 3: Preserve Supabase auth state
      const authToken = localStorage.getItem('supabase.auth.token')
      const authRefreshToken = localStorage.getItem('supabase.auth.refreshToken')
      
      // Step 4: Disconnect existing wallet connections
      try {
        await disconnect(wagmiConfig)
        console.log('Disconnected existing wallet connections')
      } catch (e) {
        console.log('No existing connections to disconnect')
      }
      
      // Step 5: Clear only wallet-related storage
      const walletKeys = ['walletAddress', 'wagmi', 'walletconnect', 'zksync-sso']
      for (const key of walletKeys) {
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i)
          if (storageKey?.includes(key)) {
            console.log(`Clearing localStorage item: ${storageKey}`)
            localStorage.removeItem(storageKey)
          }
        }
      }
      
      // Step 6: Clear wallet-related cookies
      const cookiesToClear = ['zksync-sso-code-verifier', 'zksync-sso-state', 'wallet-address']
      cookiesToClear.forEach(name => {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
      })
      
      // Step 7: Restore Supabase auth state
      if (authToken) {
        localStorage.setItem('supabase.auth.token', authToken)
        console.log('Restored Supabase auth token')
      }
      if (authRefreshToken) {
        localStorage.setItem('supabase.auth.refreshToken', authRefreshToken)
        console.log('Restored Supabase refresh token')
      }
      
      // Step 8: Connect to zkSync SSO with enhanced error logging
      console.log('Connecting to zkSync SSO...')
      console.log('Using contract address:', env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS)
      console.log('Using RPC URL:', env.NEXT_PUBLIC_ZKSYNC_RPC_URL)
      
      try {
        const { accounts } = await connect(wagmiConfig, {
          connector: getZkSyncSSOConnector(),
          chainId: zksyncSepoliaTestnet.id,
        })
        
        if (!accounts?.length) {
          throw new Error('No accounts returned from zkSync SSO connection')
        }
        
        const address = accounts[0]
        console.log('Connected with address:', address)
        
        // Step 9: Store wallet address
        localStorage.setItem('walletAddress', address)
        document.cookie = `wallet-address=${address}; path=/; max-age=604800; SameSite=Lax; Secure`
        
        // Step 10: Update UI state
        setWallet({
          address,
          isConnected: true,
          isConnecting: false,
        })
        
        // Step 11: Handle Supabase authentication with retries
        let retryCount = 0
        const maxRetries = 3
        
        while (retryCount < maxRetries) {
          try {
            const email = `${address.toLowerCase()}@wallet.zksync`
            const password = `${address.toLowerCase()}-${address.slice(2, 10)}-recovery`
            
            console.log('Attempting Supabase authentication...')
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            })
            
            if (signInError) {
              console.log('Creating new account...')
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: { wallet_address: address },
                  emailRedirectTo: `${window.location.origin}/auth/callback?skip_confirmation=true`
                },
              })
              
              if (signUpError) throw signUpError
              
              // Verify session storage
              await new Promise(resolve => setTimeout(resolve, 1000))
              const session = await supabase.auth.getSession()
              if (!session.data.session) {
                throw new Error('Session not created after signup')
              }
              
              console.log('New account created, redirecting to onboarding')
              router.push('/onboarding')
              break
            } else {
              // Verify session storage
              await new Promise(resolve => setTimeout(resolve, 1000))
              const session = await supabase.auth.getSession()
              if (!session.data.session) {
                throw new Error('Session not created after signin')
              }
              
              // Update wallet address if needed
              if (!signInData.user?.user_metadata?.wallet_address || 
                  signInData.user.user_metadata.wallet_address !== address) {
                await supabase.auth.updateUser({
                  data: { wallet_address: address }
                })
              }
              
              console.log('Authentication successful, redirecting to dashboard')
              router.push('/dashboard')
              break
            }
          } catch (error) {
            console.error(`Authentication attempt ${retryCount + 1} failed:`, error)
            retryCount++
            
            if (retryCount === maxRetries) {
              toast({
                title: "Authentication Error",
                description: "Failed to authenticate. Please try again.",
                variant: "destructive"
              })
              throw error
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
          }
        }
        
        toast({
          title: "Connected Successfully",
          description: "Wallet connected and authenticated.",
        })
      } catch (connectError) {
        console.error('zkSync SSO connection error:', connectError)
        console.log('Browser details:', navigator.userAgent)
        console.log('WebAuthn support:', 'credentials' in navigator)
        console.log('Secure context:', window.isSecureContext)
        
        // Use our detailed error handler
        const errorMessage = handleZkSyncSSOError(connectError)
        throw new Error(errorMessage)
      }
      
    } catch (error) {
      console.error('Connection error:', error)
      
      // Clean up
      localStorage.removeItem('walletAddress')
      document.cookie = 'wallet-address=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
      
      setWallet({
        address: null,
        isConnected: false,
        isConnecting: false,
      })
      
      // Handle specific errors with our error handler
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive"
      })
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