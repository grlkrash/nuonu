"use client"

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase/client'

interface UseUserReturn {
  user: User | null
  loading: boolean
  error: Error | null
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Get the current session
    const getUser = async () => {
      try {
        setLoading(true)
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }
        
        setUser(session?.user || null)
        
        // Set up auth state listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          (_event, session) => {
            setUser(session?.user || null)
          }
        )
        
        return () => {
          subscription.unsubscribe()
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'))
      } finally {
        setLoading(false)
      }
    }
    
    const unsubscribe = getUser()
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  return { user, loading, error }
} 