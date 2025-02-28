import { supabase } from '@/lib/supabase/client'

/**
 * Checks the health of the current session and attempts recovery if needed
 * @returns An object with session status information
 */
export async function checkSessionHealth() {
  console.log('SessionHealth: Checking session health')
  
  try {
    // Check if there's an active Supabase session
    const { data: sessionData } = await supabase.auth.getSession()
    const hasSession = !!sessionData.session
    
    // Get wallet address from various sources
    const storedAddress = typeof window !== 'undefined' ? localStorage.getItem('walletAddress') : null
    
    // Get cookie value helper
    const getCookieValue = (name: string) => {
      if (typeof document === 'undefined') return null
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }
    
    const cookieAddress = getCookieValue('wallet-address')
    const walletAddress = storedAddress || cookieAddress
    
    console.log('SessionHealth: Session exists:', hasSession)
    console.log('SessionHealth: Wallet address found:', !!walletAddress)
    
    // If we have a session, check if it's valid
    if (hasSession) {
      // Check if the session is about to expire
      const expiresAt = sessionData.session.expires_at
      const now = Math.floor(Date.now() / 1000)
      const timeUntilExpiry = expiresAt - now
      
      console.log('SessionHealth: Session expires in', timeUntilExpiry, 'seconds')
      
      // If session is about to expire (less than 1 hour), refresh it
      if (timeUntilExpiry < 3600) {
        console.log('SessionHealth: Session about to expire, refreshing')
        await supabase.auth.refreshSession()
        console.log('SessionHealth: Session refreshed')
      }
      
      // If we have a wallet address, make sure it's in the user metadata
      if (walletAddress && sessionData.session.user) {
        const userWalletAddress = sessionData.session.user.user_metadata?.wallet_address
        
        if (!userWalletAddress || userWalletAddress !== walletAddress) {
          console.log('SessionHealth: Updating user metadata with wallet address')
          await supabase.auth.updateUser({
            data: { wallet_address: walletAddress }
          })
        }
      }
      
      return {
        hasSession: true,
        walletAddress: walletAddress || sessionData.session.user?.user_metadata?.wallet_address,
        sessionExpiry: expiresAt,
        isWalletUser: sessionData.session.user?.email?.endsWith('@wallet.zksync') || false,
        needsRecovery: false
      }
    } 
    
    // If we have a wallet address but no session, we need recovery
    if (walletAddress && !hasSession) {
      return {
        hasSession: false,
        walletAddress,
        sessionExpiry: null,
        isWalletUser: true,
        needsRecovery: true
      }
    }
    
    // No session and no wallet address
    return {
      hasSession: false,
      walletAddress: null,
      sessionExpiry: null,
      isWalletUser: false,
      needsRecovery: false
    }
  } catch (error) {
    console.error('SessionHealth: Error checking session health', error)
    return {
      hasSession: false,
      walletAddress: null,
      sessionExpiry: null,
      isWalletUser: false,
      needsRecovery: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Attempts to recover a session using the wallet address
 * @param walletAddress The wallet address to use for recovery
 * @returns Success status and any error message
 */
export async function recoverWalletSession(walletAddress: string) {
  console.log('SessionHealth: Attempting to recover session for wallet', walletAddress)
  
  try {
    if (!walletAddress) {
      throw new Error('No wallet address provided for recovery')
    }
    
    // Create email from wallet address
    const email = `${walletAddress.toLowerCase()}@wallet.zksync`
    // Generate a deterministic password based on the wallet address
    // This is safe because authentication is primarily through the wallet
    const password = `${walletAddress.toLowerCase()}-${walletAddress.slice(2, 10)}-recovery`
    
    console.log('SessionHealth: Attempting to sign in with wallet-based email')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (signInError) {
      console.error('SessionHealth: Sign-in failed:', signInError.message)
      return { 
        success: false, 
        error: signInError.message 
      }
    }
    
    console.log('SessionHealth: Sign-in successful')
    
    // Update localStorage with wallet address
    if (typeof window !== 'undefined') {
      localStorage.setItem('walletAddress', walletAddress)
    }
    
    // Set wallet address cookie for server-side access
    document.cookie = `wallet-address=${walletAddress}; path=/; max-age=604800; SameSite=Lax`
    
    // Force session persistence
    await supabase.auth.refreshSession()
    
    return { 
      success: true,
      session: signInData.session
    }
  } catch (error) {
    console.error('SessionHealth: Error recovering session', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
} 