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

// Create a Supabase client with session handling options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Use a different storage key to avoid conflicts with zkSync SSO
    storageKey: 'supabase.auth.session',
    flowType: 'pkce',
    debug: true,
    // Set a longer cookie lifetime
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  },
  global: {
    headers: {
      'x-application-name': 'nuonu',
    },
  },
})

// Log session status on client initialization
if (typeof window !== 'undefined') {
  // Add a small delay to ensure the client is fully initialized
  setTimeout(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Error getting session on client init:', error.message)
      } else {
        console.log('Client init - Session exists:', !!data.session)
        if (data.session) {
          console.log('Client init - User ID:', data.session.user.id)
          console.log('Client init - User email:', data.session.user.email)
          console.log('Client init - Session expires:', new Date(data.session.expires_at! * 1000).toLocaleString())
          
          // Check for wallet address in user metadata
          if (data.session.user.user_metadata?.wallet_address) {
            console.log('Client init - Wallet address from metadata:', data.session.user.user_metadata.wallet_address)
            localStorage.setItem('walletAddress', data.session.user.user_metadata.wallet_address)
          }
        }
      }
    })
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      console.log('Session exists:', !!session)
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user.id)
        // Store wallet address in localStorage if it exists in user metadata
        if (session.user.user_metadata?.wallet_address) {
          console.log('Setting wallet address in localStorage:', session.user.user_metadata.wallet_address)
          localStorage.setItem('walletAddress', session.user.user_metadata.wallet_address)
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out')
        // Clear wallet address from localStorage
        localStorage.removeItem('walletAddress')
      }
    })
  }, 100)
}

// Export the type for use in other files
export type SupabaseClient = typeof supabase 