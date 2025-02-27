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

export function FixedHeader({ scrolled = true }: HeaderProps) {
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
      try {
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Header - User:', user ? 'Authenticated' : 'Not authenticated')
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    getUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('Header - Auth state changed:', session ? 'Authenticated' : 'Not authenticated')
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
      console.log('Header - Redirecting to sign in with redirect:', redirectUrl)
      router.push(redirectUrl)
    } else {
      // Otherwise, proceed with navigation
      console.log('Header - Navigating to:', href)
      router.push(href)
      
      // Force a refresh to ensure the page gets the latest session state
      setTimeout(() => {
        console.log('Header - Refreshing router')
        router.refresh()
      }, 100)
    }
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${internalScrolled ? "bg-black" : "bg-transparent"}`}>
      <div className="container mx-auto px-4 py-2 flex justify-between items-center relative">
        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
          <Menu />
        </Button>
        <Link href="/" className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className={internalScrolled ? "animate-pulse" : ""}>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/nuonu%20logomark-sYgJYMazAtVYSiirs625uXJ2QFnzqE.png"
              alt="nuonu logo"
              width={100}
              height={40}
              priority
            />
          </div>
        </Link>
        {isLoading ? (
          <div className="h-10 w-20 bg-gray-800 rounded animate-pulse"></div>
        ) : user ? (
          <SignOutButton variant="outline" />
        ) : (
          <SignInButton />
        )}
      </div>
      {isMenuOpen && (
        <nav className="container mx-auto px-4 py-2 bg-black border-t border-white">
          <ul className="space-y-2">
            <li>
              <button onClick={() => handleLinkClick("/")} className="text-white hover:underline">
                Home
              </button>
            </li>
            <li>
              <button onClick={() => handleLinkClick("/about")} className="text-white hover:underline">
                About nuonu
              </button>
            </li>
            {user && (
              <>
                <li>
                  <button onClick={() => handleLinkClick("/dashboard")} className="text-white hover:underline">
                    Dashboard
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick("/profile")} className="text-white hover:underline">
                    My Profile
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick("/funds")} className="text-white hover:underline">
                    My Funds
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  )
} 