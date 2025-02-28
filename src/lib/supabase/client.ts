import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

// Get Supabase URL and anon key from environment variables
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// We're using default values in env.ts, so this check is no longer needed
// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Missing Supabase environment variables')
// }

console.log('Initializing Supabase client with URL:', supabaseUrl)

// Create a custom storage implementation with improved error handling
const customStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') {
      console.log('Storage access attempted server-side, returning null')
      return null
    }
    
    try {
      // Try to get from localStorage first
      const localValue = localStorage.getItem(key)
      if (localValue) {
        console.log(`Retrieved ${key} from localStorage`)
        return localValue
      }
      
      // Fallback to sessionStorage
      const sessionValue = sessionStorage.getItem(key)
      if (sessionValue) {
        console.log(`Retrieved ${key} from sessionStorage`)
        return sessionValue
      }
      
      console.log(`No value found for ${key} in any storage`)
      return null
    } catch (error) {
      console.error('Storage access error:', error)
      return null
    }
  },
  
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') {
      console.log('Storage set attempted server-side, skipping')
      return
    }
    
    try {
      // Store in localStorage
      localStorage.setItem(key, value)
      console.log(`Stored ${key} in localStorage`)
      
      // Verify localStorage
      const verifyLocal = localStorage.getItem(key)
      if (verifyLocal !== value) {
        throw new Error('localStorage verification failed')
      }
      
      // Backup to sessionStorage
      sessionStorage.setItem(key, value)
      console.log(`Stored ${key} in sessionStorage`)
      
      // Verify sessionStorage
      const verifySession = sessionStorage.getItem(key)
      if (verifySession !== value) {
        throw new Error('sessionStorage verification failed')
      }
    } catch (error) {
      console.error('Storage error:', error)
      // Attempt sessionStorage only as fallback
      try {
        sessionStorage.setItem(key, value)
        console.log(`Fallback: Stored ${key} in sessionStorage only`)
      } catch (innerError) {
        console.error('Critical: All storage attempts failed:', innerError)
      }
    }
  },
  
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') {
      console.log('Storage removal attempted server-side, skipping')
      return
    }
    
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
      console.log(`Removed ${key} from all storage`)
    } catch (error) {
      console.error('Error removing from storage:', error)
    }
  }
}

// Create a Supabase client with improved session handling options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: customStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
    debug: true,
    cookieOptions: {
      name: 'sb-auth-token',
      lifetime: 60 * 60 * 24 * 7, // 7 days
      domain: typeof window !== 'undefined' ? window.location.hostname : undefined,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    },
  },
  global: {
    headers: {
      'x-application-name': 'nuonu',
    },
  },
})

// Initialize session monitoring
if (typeof window !== 'undefined') {
  // Check initial session state
  setTimeout(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      
      console.log('Initial session state:', {
        exists: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        expires: session ? new Date(session.expires_at! * 1000).toLocaleString() : null
      })
      
      // Store wallet address if present
      if (session?.user?.user_metadata?.wallet_address) {
        localStorage.setItem('walletAddress', session.user.user_metadata.wallet_address)
        console.log('Stored wallet address:', session.user.user_metadata.wallet_address)
      }
    } catch (error) {
      console.error('Session initialization error:', error)
    }
  }, 100)
  
  // Monitor auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', { event, hasSession: !!session })
    
    if (event === 'SIGNED_IN' && session?.user) {
      const walletAddress = session.user.user_metadata?.wallet_address
      if (walletAddress) {
        localStorage.setItem('walletAddress', walletAddress)
        console.log('Updated wallet address:', walletAddress)
      }
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('walletAddress')
      console.log('Cleared wallet address')
    }
  })
}

// Export the type for use in other files
export type SupabaseClient = typeof supabase 