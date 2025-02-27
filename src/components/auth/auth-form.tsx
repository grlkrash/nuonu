'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

// Icons component for loading spinner
const Icons = {
  spinner: (props: any) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  google: (props: any) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  )
}

interface AuthFormProps {
  type: 'signin' | 'signup'
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Check if there's an email in localStorage from the onboarding process
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('onboardingEmail')
      if (savedEmail) {
        setEmail(savedEmail)
        // Clear the email from localStorage after using it
        localStorage.removeItem('onboardingEmail')
      }
    }
    
    // Check for error parameters in the URL
    const errorParam = searchParams.get('error')
    const errorMessage = searchParams.get('message')
    
    if (errorParam) {
      console.log('Auth form - Error param:', errorParam)
      console.log('Auth form - Error message:', errorMessage)
      
      let displayMessage = 'An error occurred during authentication.'
      
      // Set appropriate error message based on the error type
      switch (errorParam) {
        case 'auth_callback_error':
          displayMessage = errorMessage || 'Error during authentication callback. Please try again.'
          break
        case 'no_session':
          displayMessage = 'No session was created. Please try signing in again.'
          break
        case 'auth_callback_exception':
          displayMessage = 'An unexpected error occurred. Please try again later.'
          break
        case 'no_code':
          displayMessage = 'No authentication code was provided. Please try signing in again.'
          break
        default:
          displayMessage = errorMessage || 'An error occurred during authentication.'
      }
      
      setError('email', { message: displayMessage })
    }
  }, [searchParams, setError])
  
  const isSignIn = type === 'signin'
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsLoading(true)
    
    try {
      if (isSignIn) {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        
        // Redirect to dashboard after successful sign in
        router.push('/dashboard')
      } else {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })
        
        if (error) throw error
        
        setMessage('Check your email for a confirmation link')
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleOAuthSignIn = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
          {error && (
            <div className="bg-gray-900 border border-red-500 text-red-400 p-3 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}
          {message && (
            <div className="bg-gray-900 border border-green-500 text-green-400 p-3 rounded-md">
              <p className="text-sm">{message}</p>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800 text-white border-gray-700 focus:border-white"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Link
                href="/reset-password"
                className="text-sm text-white hover:text-gray-300 underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect="off"
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-800 text-white border-gray-700 focus:border-white"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="bg-transparent border border-white text-white hover:bg-white hover:text-black rounded-xl">
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            {type === "signin" ? "Sign In" : "Sign Up"}
          </Button>
        </div>
      </form>
      <div className="text-center text-sm text-white">
        {type === "signin" ? "Don't have an account? " : "Already have an account? "}
        <Link
          href={type === "signin" ? "/signup" : "/signin"}
          className="underline underline-offset-4 hover:text-gray-300"
        >
          {type === "signin" ? "Sign Up" : "Sign In"}
        </Link>
      </div>
    </div>
  )
} 