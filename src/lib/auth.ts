import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from './supabase/database.types'
import { createClient } from '@supabase/supabase-js'
import { env } from './env'

/**
 * Create a Supabase client for server components
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerComponentClient<Database>(
    {
      cookies: () => cookieStore,
    },
    {
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  )
}

/**
 * Create a Supabase admin client for server-side operations
 * This client has admin privileges and should only be used in server contexts
 */
export function createAdminClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Get the current session from the server
 */
export async function getSession() {
  const supabase = createServerSupabaseClient()
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Get the current user from the server
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user || null
} 