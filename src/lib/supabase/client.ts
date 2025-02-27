import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

// Get Supabase URL and anon key from environment variables
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// We're using default values in env.ts, so this check is no longer needed
// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Missing Supabase environment variables')
// }

// Create a Supabase client with session handling options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
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
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Error getting session on client init:', error.message)
    } else {
      console.log('Client init - Session exists:', !!data.session)
      if (data.session) {
        console.log('Client init - User ID:', data.session.user.id)
        console.log('Client init - User email:', data.session.user.email)
      }
    }
  })
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event)
    console.log('Session exists:', !!session)
  })
}

// Export the type for use in other files
export type SupabaseClient = typeof supabase 