'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/supabase/auth'
import { User } from '@supabase/supabase-js'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  
  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser()
      setUser(user)
    }
    
    loadUser()
  }, [])
  
  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  
  return (
    <nav className="border-b border-gray-800">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white">Nuonu</span>
          </Link>
          <div className="hidden md:flex gap-6">
            <Link 
              href="/opportunities"
              className={`text-sm font-medium transition-colors hover:text-white ${
                pathname === '/opportunities' 
                  ? 'text-white' 
                  : 'text-gray-400'
              }`}
            >
              Opportunities
            </Link>
            {user && (
              <>
                <Link 
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === '/dashboard' 
                      ? 'text-foreground' 
                      : 'text-muted-foreground'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/profile"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === '/profile' 
                      ? 'text-foreground' 
                      : 'text-muted-foreground'
                  }`}
                >
                  Profile
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign Out
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground md:hidden"
        >
          <span className="sr-only">Toggle menu</span>
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="container md:hidden py-4 pb-6">
          <div className="flex flex-col space-y-3">
            <Link
              href="/opportunities"
              className={`text-sm font-medium ${
                pathname === '/opportunities'
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Opportunities
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium ${
                    pathname === '/dashboard'
                      ? 'text-foreground' 
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className={`text-sm font-medium ${
                    pathname === '/profile'
                      ? 'text-foreground' 
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
              </>
            )}
          </div>
          <div className="mt-6 pt-6 border-t">
            {user ? (
              <button
                onClick={() => {
                  handleSignOut()
                  setIsMenuOpen(false)
                }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Sign Out
              </button>
            ) : (
              <div className="flex flex-col space-y-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
} 