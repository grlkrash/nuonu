'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { SignInButton } from '@/components/auth/sign-in-button'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { getCurrentUser } from '@/lib/supabase/auth'
import { User } from '@supabase/supabase-js'

interface HeaderProps {
  scrolled?: boolean;
}

export function FixedHeader({ scrolled = true }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [internalScrolled, setInternalScrolled] = useState(scrolled)
  const router = useRouter()
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
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUser()
  }, [])

  const handleLinkClick = (href: string) => {
    setIsMenuOpen(false)
    router.push(href)
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${internalScrolled ? "bg-black" : "bg-transparent"}`}>
      <div className="container mx-auto px-4 py-2 flex justify-between items-center relative">
        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
          <Menu />
        </Button>
        <div 
          onClick={() => user ? handleLinkClick("/dashboard") : handleLinkClick("/")} 
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        >
          <div className={internalScrolled ? "animate-pulse" : ""}>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/nuonu%20logomark-sYgJYMazAtVYSiirs625uXJ2QFnzqE.png"
              alt="nuonu logo"
              width={100}
              height={40}
              priority
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
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
                <li>
                  <button onClick={() => handleLinkClick("/opportunities")} className="text-white hover:underline">
                    Opportunities
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