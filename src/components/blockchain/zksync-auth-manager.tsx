'use client'

import { useEffect, useState } from 'react'
import { connect, disconnect } from '@wagmi/core'
import { ssoConnector, wagmiConfig } from '@/lib/zksync-sso-config'
import { zksyncSepoliaTestnet } from 'viem/chains'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'

/**
 * ZkSyncAuthManager
 * 
 * This component manages the zkSync SSO authentication flow separately from Supabase.
 * It handles connecting to zkSync SSO, creating sessions, and synchronizing with Supabase.
 * 
 * The component doesn't render anything visible - it works in the background.
 */
export function ZkSyncAuthManager() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasAttempted, setHasAttempted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Function to handle zkSync SSO authentication
    const handleZkSyncAuth = async () => {
      // Only attempt once per component mount
      if (hasAttempted) return
      setHasAttempted(true)
      
      try {
        // Check if we have a wallet address stored
        const storedAddress = localStorage.getItem('walletAddress')
        const getCookieValue = (name: string) => {
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop()?.split(';').shift()
          return null
        }
        const cookieAddress = getCookieValue('wallet-address')
        
        // If we have a wallet address but no active session, try to connect
        if ((storedAddress || cookieAddress) && !isConnecting) {
          console.log('ZkSyncAuthManager: Wallet address found, attempting to connect')
          setIsConnecting(true)
          
          // First, check if we have a Supabase session
          const { data: { session } } = await supabase.auth.getSession()
          
          // If we don't have a Supabase session, don't try to connect to zkSync
          // This prevents conflicts between authentication systems
          if (!session) {
            console.log('ZkSyncAuthManager: No Supabase session, skipping zkSync connection')
            setIsConnecting(false)
            return
          }
          
          // Clear any existing zkSync SSO state to prevent conflicts
          try {
            await disconnect(wagmiConfig)
            console.log('ZkSyncAuthManager: Disconnected any existing zkSync connections')
            
            // Wait a moment before reconnecting
            await new Promise(resolve => setTimeout(resolve, 500))
          } catch (disconnectError) {
            console.error('ZkSyncAuthManager: Error disconnecting:', disconnectError)
            // Continue anyway
          }
          
          // Connect to zkSync SSO
          try {
            console.log('ZkSyncAuthManager: Connecting to zkSync SSO')
            const result = await connect(wagmiConfig, {
              connector: ssoConnector,
              chainId: zksyncSepoliaTestnet.id,
            })
            
            if (result && result.accounts && result.accounts.length > 0) {
              const address = result.accounts[0]
              console.log('ZkSyncAuthManager: Connected successfully to address:', address)
              
              // Store the address in localStorage and cookies for redundancy
              localStorage.setItem('walletAddress', address)
              document.cookie = `wallet-address=${address}; path=/; max-age=604800; SameSite=Lax`
              
              toast({
                title: "Wallet Connected",
                description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
                duration: 3000,
              })
            } else {
              console.error('ZkSyncAuthManager: Connection result missing accounts')
            }
          } catch (connectError: any) {
            console.error('ZkSyncAuthManager: Error connecting:', connectError)
            
            // Show a more user-friendly error message
            toast({
              title: "Connection Failed",
              description: connectError?.message || "Failed to connect wallet. Please try again.",
              variant: "destructive",
              duration: 5000,
            })
          }
        }
      } catch (error) {
        console.error('ZkSyncAuthManager: Unexpected error:', error)
      } finally {
        setIsConnecting(false)
      }
    }
    
    // Run on component mount
    handleZkSyncAuth()
  }, [hasAttempted, isConnecting, toast])
  
  // This component doesn't render anything visible
  return null
} 