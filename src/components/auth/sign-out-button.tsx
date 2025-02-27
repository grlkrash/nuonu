'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface SignOutButtonProps {
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

export function SignOutButton({ className, variant = 'default' }: SignOutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const handleSignOut = async () => {
    setLoading(true)
    
    try {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Button
      variant={variant}
      onClick={handleSignOut}
      disabled={loading}
      className={`bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2 ${className}`}
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </Button>
  )
} 