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
  },
  global: {
    headers: {
      'x-application-name': 'nuonu',
    },
  },
})

// Export the type for use in other files
export type SupabaseClient = typeof supabase 