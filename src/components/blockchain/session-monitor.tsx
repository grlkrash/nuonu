'use client'

import { useEffect, useRef } from 'react'
import { checkSessionHealth } from '@/lib/auth/session-health'
import { supabase } from '@/lib/supabase/client'

/**
 * SessionMonitor component
 * 
 * This component runs in the background and periodically checks the health of the user's session.
 * It proactively refreshes sessions before they expire to ensure continuous authentication.
 * 
 * Features:
 * - Checks session health every 10 minutes
 * - Refreshes sessions that are close to expiring (less than 30 minutes remaining)
 * - Logs detailed information about session status for debugging
 * - No visible UI - works silently in the background
 */
export function SessionMonitor() {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Function to check and refresh session if needed
    const monitorSession = async () => {
      try {
        console.log('SessionMonitor: Checking session health')
        const healthStatus = await checkSessionHealth()
        
        // If we have a session, check if it needs refreshing
        if (healthStatus.hasSession && healthStatus.sessionExpiry) {
          const now = Math.floor(Date.now() / 1000)
          const timeUntilExpiry = healthStatus.sessionExpiry - now
          
          console.log(`SessionMonitor: Session expires in ${timeUntilExpiry} seconds`)
          
          // If session expires in less than 30 minutes, refresh it
          if (timeUntilExpiry < 1800) {
            console.log('SessionMonitor: Session expiring soon, refreshing')
            await supabase.auth.refreshSession()
            console.log('SessionMonitor: Session refreshed successfully')
          }
        } else if (healthStatus.walletAddress && !healthStatus.hasSession) {
          console.log('SessionMonitor: Wallet address found but no session')
          // We don't attempt recovery here - that's handled by SessionRecovery component
        }
      } catch (error) {
        console.error('SessionMonitor: Error monitoring session', error)
      }
    }
    
    // Run immediately on mount
    monitorSession()
    
    // Set up interval to check every 10 minutes
    checkIntervalRef.current = setInterval(monitorSession, 10 * 60 * 1000)
    
    // Clean up interval on unmount
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [])
  
  // This component doesn't render anything visible
  return null
} 