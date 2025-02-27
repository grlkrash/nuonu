"use client"

import { useState } from "react"
import Link from "next/link"
import { SignInButton } from "@/components/auth/sign-in-button"
import { supabase } from "@/lib/supabase/client"
import { useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { SignOutButton } from "@/components/auth/sign-out-button"

interface HeaderProps {
  scrolled: boolean
}

export function Header({ scrolled }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black" : "bg-transparent"}`}>
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <Link href="/" className="text-white font-bold text-xl">
          nuonu
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/about" className="text-white hover:text-gray-300">
            About
          </Link>
          {user && (
            <Link href="/dashboard" className="text-white hover:text-gray-300">
              Dashboard
            </Link>
          )}
          {isLoading ? (
            <div className="h-10 w-20 bg-gray-800 rounded animate-pulse"></div>
          ) : user ? (
            <SignOutButton variant="outline" />
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </header>
  )
} 