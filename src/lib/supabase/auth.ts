import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { type User, type Session } from '@supabase/supabase-js'

// Create a Supabase client for authentication
const supabase = createClientComponentClient()

// Sign up a new user
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}

// Sign in a user
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}

// Sign out the current user
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return true
}

// Get the current user
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Get the current session
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Check if the user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return !!session
}

// Update user profile
export async function updateProfile(profile: { 
  username?: string
  full_name?: string
  avatar_url?: string
  bio?: string
  website?: string
  social_links?: { [key: string]: string }
}) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: (await getCurrentUser())?.id,
      updated_at: new Date().toISOString(),
      ...profile
    })
    .select()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}

// Get user profile
export async function getProfile(userId?: string) {
  const id = userId || (await getCurrentUser())?.id
  
  if (!id) {
    return null
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}

// Reset password
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return true
}

// Update password
export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password,
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return true
}

// Listen to auth changes
export function onAuthStateChange(callback: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'PASSWORD_RECOVERY', session: Session | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return subscription
} 