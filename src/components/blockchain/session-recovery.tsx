'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ssoConnector, wagmiConfig } from '@/lib/zksync-sso-config'
import { connect } from '@wagmi/core'
import { zksyncSepoliaTestnet } from 'viem/chains'
import { useToast } from '@/components/ui/use-toast'
import { checkSessionHealth, recoverWalletSession } from '@/lib/auth/session-health'

export function SessionRecovery() {
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryAttempted, setRecoveryAttempted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const recoverSession = async () => {
      // Only attempt recovery once
      if (recoveryAttempted) return
      setRecoveryAttempted(true)

      try {
        console.log('SessionRecovery: Starting session health check')
        setIsRecovering(true)

        // Check session health
        const healthStatus = await checkSessionHealth()
        console.log('SessionRecovery: Health status:', healthStatus)

        // If we need recovery, attempt it
        if (healthStatus.needsRecovery && healthStatus.walletAddress) {
          console.log('SessionRecovery: Recovery needed, attempting wallet reconnection')
          
          // First try to reconnect the wallet
          try {
            const result = await connect(wagmiConfig, {
              connector: ssoConnector,
              chainId: zksyncSepoliaTestnet.id,
            })
            
            if (result && result.accounts && result.accounts.length > 0) {
              const address = result.accounts[0]
              console.log('SessionRecovery: Wallet reconnected successfully:', address)
              
              // Check if the reconnected address matches the stored one
              if (address.toLowerCase() !== healthStatus.walletAddress.toLowerCase()) {
                console.warn('SessionRecovery: Reconnected wallet address differs from stored address')
                console.log('SessionRecovery: Stored address:', healthStatus.walletAddress)
                console.log('SessionRecovery: Reconnected address:', address)
                
                // Update the stored address
                localStorage.setItem('walletAddress', address)
                
                // Attempt recovery with the new address
                const recoveryResult = await recoverWalletSession(address)
                
                if (recoveryResult.success) {
                  console.log('SessionRecovery: Session recovered successfully with new address')
                  toast({
                    title: "Session Recovered",
                    description: "Your wallet session has been restored.",
                    duration: 3000,
                  })
                } else {
                  console.error('SessionRecovery: Recovery failed with new address:', recoveryResult.error)
                }
              } else {
                // Attempt recovery with the existing address
                const recoveryResult = await recoverWalletSession(healthStatus.walletAddress)
                
                if (recoveryResult.success) {
                  console.log('SessionRecovery: Session recovered successfully')
                  toast({
                    title: "Session Recovered",
                    description: "Your wallet session has been restored.",
                    duration: 3000,
                  })
                } else {
                  console.error('SessionRecovery: Recovery failed:', recoveryResult.error)
                }
              }
            } else {
              console.error('SessionRecovery: Failed to reconnect wallet during recovery')
              
              // Try direct recovery without wallet reconnection as fallback
              const recoveryResult = await recoverWalletSession(healthStatus.walletAddress)
              
              if (recoveryResult.success) {
                console.log('SessionRecovery: Session recovered successfully via fallback')
                toast({
                  title: "Session Recovered",
                  description: "Your wallet session has been restored.",
                  duration: 3000,
                })
              } else {
                console.error('SessionRecovery: Fallback recovery failed:', recoveryResult.error)
              }
            }
          } catch (reconnectError) {
            console.error('SessionRecovery: Error during wallet reconnection:', reconnectError)
            
            // Try direct recovery without wallet reconnection as fallback
            const recoveryResult = await recoverWalletSession(healthStatus.walletAddress)
            
            if (recoveryResult.success) {
              console.log('SessionRecovery: Session recovered successfully after reconnection error')
              toast({
                title: "Session Recovered",
                description: "Your wallet session has been restored.",
                duration: 3000,
              })
            } else {
              console.error('SessionRecovery: Recovery failed after reconnection error:', recoveryResult.error)
            }
          }
        } else if (healthStatus.hasSession) {
          console.log('SessionRecovery: Session is healthy, no recovery needed')
        } else {
          console.log('SessionRecovery: No session and no wallet address, nothing to recover')
        }
      } catch (err) {
        console.error('SessionRecovery: Error during session recovery:', err)
      } finally {
        setIsRecovering(false)
      }
    }
    
    // Run recovery on component mount
    recoverSession()
  }, [recoveryAttempted, toast])

  // This component doesn't render anything visible
  return null
} 