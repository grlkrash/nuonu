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

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)
      setError(null)
      
      // This is a placeholder for the actual zkSync SSO implementation
      // In a real implementation, you would use the zkSync SSO SDK here
      
      // Simulate a successful connection for now
      setTimeout(async () => {
        const mockAddress = '0x1234...5678'
        setWalletAddress(mockAddress)
        
        // In a real implementation, you would get a signature from the wallet
        // and verify it on the server side
        const mockSignature = 'mock_signature'
        
        try {
          // Generate a valid email format using the wallet address and a UUID
          const walletEmail = `wallet_${mockAddress.replace(/[^a-zA-Z0-9]/g, '')}_${uuidv4().substring(0, 8)}@example.com`
          const walletPassword = `${mockSignature}_${uuidv4()}`
          
          console.log('Attempting to sign in with wallet email:', walletEmail)
          
          // Try to sign in first
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: walletEmail,
            password: walletPassword,
          })
          
          // If sign in fails, create a new account
          if (signInError) {
            console.log('Sign in failed, attempting to create account')
            
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: walletEmail,
              password: walletPassword,
              options: {
                data: {
                  wallet_address: mockAddress,
                  auth_method: 'wallet'
                }
              }
            })
            
            if (signUpError) {
              console.error('Error signing up with wallet:', signUpError)
              throw signUpError
            }
            
            // For demo purposes, auto-confirm the email
            try {
              // This would normally be done through a server-side function
              // or email confirmation flow
              console.log('Demo: Auto-confirming wallet account')
              
              // Store wallet info in localStorage for persistence
              localStorage.setItem('walletAddress', mockAddress)
              localStorage.setItem('walletEmail', walletEmail)
              
              // Redirect to dashboard after successful sign up
              router.push('/dashboard')
              router.refresh()
            } catch (confirmError) {
              console.error('Error confirming wallet account:', confirmError)
              throw confirmError
            }
          } else {
            // Store wallet info in localStorage for persistence
            localStorage.setItem('walletAddress', mockAddress)
            localStorage.setItem('walletEmail', walletEmail)
            
            // Redirect to dashboard after successful sign in
            router.push('/dashboard')
            router.refresh()
          }
        } catch (authError) {
          console.error('Error authenticating with wallet:', authError)
          setError('Failed to authenticate with wallet. Please try again.')
          setWalletAddress(null)
        }
        
        setIsConnecting(false)
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
      await supabase.auth.signOut()
      setWalletAddress(null)
      localStorage.removeItem('walletAddress')
      localStorage.removeItem('walletEmail')
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }

  // Check if we have a stored wallet address on component mount
  useEffect(() => {
    const storedWalletAddress = localStorage.getItem('walletAddress')
    if (storedWalletAddress) {
      setWalletAddress(storedWalletAddress)
    }
  }, [])

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
              Connect Wallet
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