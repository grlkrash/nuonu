'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export function ZkSyncWalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check if we have a stored wallet address on component mount
  useEffect(() => {
    const checkSession = async () => {
      // Check if we have a session
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        // If we have a session, get the wallet address from user metadata
        const walletAddress = data.session.user.user_metadata?.wallet_address
        if (walletAddress) {
          setWalletAddress(walletAddress)
          localStorage.setItem('walletAddress', walletAddress)
        }
      } else {
        // If no session, check localStorage
        const storedWalletAddress = localStorage.getItem('walletAddress')
        if (storedWalletAddress) {
          setWalletAddress(storedWalletAddress)
        }
      }
    }
    
    checkSession()
  }, [])

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)
      setError(null)
      
      // Simulate a connection process
      setTimeout(async () => {
        try {
          // For demo purposes, we'll use a mock address
          const address = '0x1234567890abcdef1234567890abcdef12345678'
          setWalletAddress(address)
          
          // Store wallet info in localStorage for persistence
          localStorage.setItem('walletAddress', address)
          
          // Create a custom token or use Supabase's custom auth
          try {
            // Generate a valid email format using a UUID
            const uuid = uuidv4()
            // Use a simple email format that will be accepted by Supabase
            const walletEmail = `wallet.${uuid.substring(0, 8)}@example.com`
            const walletPassword = `Password123!`
            
            console.log('Attempting to sign in with wallet email:', walletEmail)
            
            // Create a new account directly
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: walletEmail,
              password: walletPassword,
              options: {
                data: {
                  wallet_address: address,
                  auth_method: 'wallet'
                }
              }
            })
            
            if (signUpError) {
              console.error('Error signing up with wallet:', signUpError.message)
              throw signUpError
            }
            
            console.log('Sign up successful:', !!signUpData)
            
            // Store credentials for auto-login
            localStorage.setItem('walletEmail', walletEmail)
            localStorage.setItem('walletPassword', walletPassword)
            
            // Try to sign in immediately after signup
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: walletEmail,
              password: walletPassword,
            })
            
            if (signInError) {
              console.error('Error signing in after signup:', signInError.message)
              setError('Account created but could not sign in automatically. Please try again.')
              setWalletAddress(null)
              setIsConnecting(false)
              return
            }
            
            console.log('Sign in successful:', !!signInData)
            
            // Check if the session was created
            const { data: sessionData } = await supabase.auth.getSession()
            console.log('Session after signin:', !!sessionData.session)
            
            if (sessionData.session) {
              // Redirect to dashboard after successful sign in
              router.push('/dashboard')
              router.refresh()
            } else {
              setError('Failed to create session. Please try again.')
              setWalletAddress(null)
            }
          } catch (authError) {
            console.error('Error authenticating with wallet:', authError)
            setError('Failed to authenticate with wallet. Please try again.')
            setWalletAddress(null)
          }
        } catch (err) {
          console.error('Error connecting with wallet:', err)
          setError('Failed to connect. Please try again.')
          setWalletAddress(null)
        } finally {
          setIsConnecting(false)
        }
      }, 1500)
      
    } catch (err) {
      console.error('Error connecting wallet:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
      setIsConnecting(false)
      setWalletAddress(null)
    }
  }

  const handleDisconnect = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear local storage
      setWalletAddress(null)
      localStorage.removeItem('walletAddress')
      localStorage.removeItem('walletEmail')
      localStorage.removeItem('walletPassword')
      
      // Redirect to home page
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
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
      
      {walletAddress ? (
        <div className="space-y-4">
          <div className="p-3 bg-gray-800 rounded-md">
            <p className="text-sm text-white font-medium">Connected Wallet</p>
            <p className="text-sm text-gray-400">{walletAddress}</p>
          </div>
          
          <Button 
            onClick={handleDisconnect}
            className="w-full bg-transparent border border-white text-white hover:bg-white hover:text-black"
          >
            Disconnect Wallet
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleConnectWallet}
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
      )}
      
      <p className="mt-4 text-xs text-gray-400">
        Connect your zkSync wallet to access exclusive features and manage your blockchain assets.
      </p>
    </div>
  )
} 