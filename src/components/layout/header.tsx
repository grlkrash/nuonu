'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { SignInButton } from '@/components/auth/sign-in-button'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { SignOutButton } from '@/components/auth/sign-out-button'

interface HeaderProps {
  scrolled?: boolean;
}

export function Header({ scrolled = true }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [internalScrolled, setInternalScrolled] = useState(scrolled)
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // If scrolled is provided as a prop, use it
    // Otherwise, detect scroll position internally
    if (scrolled !== undefined) {
      setInternalScrolled(scrolled)
    } else {
      const handleScroll = () => {
        const scrollPosition = window.scrollY
        setInternalScrolled(scrollPosition > 50)
      }
      
      window.addEventListener('scroll', handleScroll)
      handleScroll() // Check initial position
      
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [scrolled])
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    
    getUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLinkClick = (href: string) => {
    setIsMenuOpen(false)
    
    // Check if this is a protected route and we have a user
    const isProtectedRoute = href.startsWith('/dashboard') || 
                            href.startsWith('/profile') || 
                            href.startsWith('/applications')
    
    if (isProtectedRoute && !user) {
      // If trying to access a protected route without being logged in,
      // redirect to sign in with the intended destination
      const redirectUrl = `/signin?redirect=${encodeURIComponent(href)}`
      router.push(redirectUrl)
    } else {
      // Otherwise, proceed with navigation
      router.push(href)
      
      // Force a refresh to ensure the page gets the latest session state
      setTimeout(() => {
        router.refresh()
      }, 100)
    }
  }

  return (
    <header className={`