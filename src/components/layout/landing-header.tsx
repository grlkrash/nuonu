'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { SignInButton } from '@/components/auth/sign-in-button'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { SignOutButton } from '@/components/auth/sign-out-button'

interface LandingHeaderProps {
  scrolled?: boolean;
}

export function LandingHeader({ scrolled = false }: LandingHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [internalScrolled, setInternalScrolled] = useState(scrolled)
  const [scrollProgress, setScrollProgress] = useState(0)
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const windowHeight = window.innerHeight
      
      // Calculate scroll progress as a percentage (0 to 1)
      const progress = Math.min(scrollPosition / windowHeight, 1)
      setScrollProgress(progress)
      
      // Set scrolled state when we're past the threshold
      setInternalScrolled(progress > 0.1)
    }
    
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
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

  // Calculate opacity based on scroll progress
  const headerOpacity = Math.min(scrollProgress * 2, 0.9)
  
  // Calculate logo scale based on scroll progress
  const logoScale = Math.max(0.7, 1 - scrollProgress * 0.3)
  
  // Calculate header padding based on scroll progress
  const headerPadding = Math.max(0.5, 1 - scrollProgress * 0.5)

  return (
    <header 
      className={`absolute top-0 left-0 right-0 z-50 transition-all duration-300`}
      style={{ 
        backgroundColor: `rgba(0, 0, 0, ${headerOpacity})`,
        backdropFilter: internalScrolled ? 'blur(5px)' : 'none',
        paddingTop: `${headerPadding}rem`,
        paddingBottom: `${headerPadding}rem`
      }}
    >
      <div className="container mx-auto px-4 py-2 flex justify-between items-center relative">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="text-white transition-opacity duration-300"
          style={{ opacity: internalScrolled ? 1 : 0.8 }}
        >
          <Menu />
        </Button>
        <Link href="/" className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div 
            className="transition-all duration-300"
            style={{ 
              transform: `scale(${logoScale})`,
              opacity: internalScrolled ? 0.9 : 1
            }}
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/nuonu%20logomark-sYgJYMazAtVYSiirs625uXJ2QFnzqE.png"
              alt="nuonu logo"
              width={100}
              height={40}
              priority
              className="transition-all duration-300"
            />
          </div>
        </Link>
        <div className="transition-opacity duration-300" style={{ opacity: internalScrolled ? 1 : 0.8 }}>
          {isLoading ? (
            <div className="h-10 w-20 bg-gray-800 rounded animate-pulse"></div>
          ) : user ? (
            <SignOutButton variant="outline" />
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
      {isMenuOpen && (
        <nav className="container mx-auto px-4 py-2 bg-black bg-opacity-90 backdrop-blur-md border-t border-white">
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