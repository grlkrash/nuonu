'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ZkSyncWalletConnect } from '@/components/blockchain/zksync-wallet-connect'
import { useToast } from '@/components/ui/use-toast'

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

export function AuthForm({ type = 'signin' }: { type?: 'signin' | 'signup' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams?.get('redirect') || '/dashboard'
  const { toast } = useToast()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [authMethod, setAuthMethod] = useState<'password' | 'magic' | 'wallet'>('password')
  
  // Check for wallet address on component mount
  useEffect(() => {
    const checkForWalletAddress = () => {
      try {
        // Check if wallet address is stored in localStorage or cookies
        const storedAddress = localStorage.getItem('walletAddress')
        
        // Also check for wallet address in cookies as a fallback
        const getCookieValue = (name: string) => {
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop()?.split(';').shift()
          return null
        }
        
        const cookieAddress = getCookieValue('wallet-address')
        const walletAddress = storedAddress || cookieAddress
        
        console.log('AuthForm: Wallet address found:', !!walletAddress)
        
        // If wallet address is found, switch to wallet tab
        if (walletAddress) {
          console.log('AuthForm: Switching to wallet tab')
          setAuthMethod('wallet')
        }
      } catch (err) {
        console.error('AuthForm: Error checking for wallet address:', err)
      }
    }
    
    checkForWalletAddress()
  }, [])
  
  // Check for error parameters in the URL and wallet address in localStorage
  useEffect(() => {
    const errorType = searchParams.get('error')
    const errorMessage = searchParams.get('message')
    
    if (errorType) {
      console.log('Auth error detected:', errorType, errorMessage)
      
      switch (errorType) {
        case 'auth_callback_error':
          setError(errorMessage || 'Authentication failed. Please try again.')
          break
        case 'no_session':
          setError('Failed to create session. Please try again.')
          break
        case 'no_code':
          setError('Authentication code missing. Please try again.')
          break
        default:
          setError(errorMessage || 'An error occurred. Please try again.')
      }
    }
    
    // Check if we have an email from onboarding
    const onboardingEmail = localStorage.getItem('onboardingEmail')
    if (onboardingEmail) {
      console.log('Email found from onboarding:', onboardingEmail)
      setEmail(onboardingEmail)
      // Remove it from localStorage to avoid using it again
      localStorage.removeItem('onboardingEmail')
    }
  }, [searchParams])
  
  const isSignIn = type === 'signin'
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    try {
      if (authMethod === 'magic') {
        console.log('Signing in with magic link:', email)
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        
        if (error) {
          console.error('Magic link error:', error)
          throw error
        }
        
        // Show success message and redirect
        toast({
          title: 'Check your email',
          description: 'We sent you a login link. Be sure to check your spam too.',
        })
        
        router.push('/check-email')
      } else if (authMethod === 'password' && type === 'signin') {
        console.log('Signing in with password:', email)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) {
          console.error('Sign in error:', error)
          throw error
        }
        
        console.log('Sign in successful, session created:', !!data.session)
        
        // Verify session was created
        if (!data.session) {
          console.error('No session created after sign in')
          
          // Try to get the session directly
          const { data: sessionData } = await supabase.auth.getSession()
          console.log('Session check after sign in:', !!sessionData.session)
          
          if (!sessionData.session) {
            throw new Error('Failed to create session')
          }
        }
        
        // Force session persistence
        localStorage.setItem('supabase.auth.session', JSON.stringify(data.session))
        sessionStorage.setItem('supabase.auth.session', JSON.stringify(data.session))
        
        // Redirect to dashboard
        router.push('/dashboard')
      } else if (authMethod === 'password' && type === 'signup') {
        console.log('Signing up with password:', email)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        
        if (error) {
          console.error('Sign up error:', error)
          throw error
        }
        
        console.log('Sign up successful, user created:', !!data.user)
        console.log('User confirmation status:', data.user?.confirmed_at ? 'Confirmed' : 'Not confirmed')
        
        // Check if user needs confirmation
        if (data.user && !data.user.confirmed_at) {
          // Store email for onboarding
          localStorage.setItem('onboardingEmail', email)
          
          // Show success message and redirect
          toast({
            title: 'Check your email',
            description: 'We sent you a confirmation link. Be sure to check your spam too.',
          })
          
          router.push('/check-email')
        } else {
          // User is already confirmed, redirect to dashboard
          router.push('/dashboard')
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error)
      setError(error?.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleOAuthSignIn = async () => {
    try {
      setLoading(true)
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
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <Tabs defaultValue="password" value={authMethod} onValueChange={(value) => setAuthMethod(value as 'password' | 'magic' | 'wallet')}>
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="magic">Magic Link</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
        </TabsList>
        <TabsContent value="password">
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
                  disabled={loading}
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
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-800 text-white border-gray-700 focus:border-white"
                />
              </div>
              <Button type="submit" disabled={loading} className="bg-transparent border border-white text-white hover:bg-white hover:text-black rounded-xl">
                {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                {type === "signin" ? "Sign In" : "Sign Up"}
              </Button>
            </div>
          </form>
        </TabsContent>
        <TabsContent value="magic">
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
                <Label htmlFor="magic-email" className="text-white">
                  Email
                </Label>
                <Input
                  id="magic-email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 text-white border-gray-700 focus:border-white"
                />
              </div>
              <Button type="submit" disabled={loading} className="bg-transparent border border-white text-white hover:bg-white hover:text-black rounded-xl">
                {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Send Magic Link
              </Button>
            </div>
          </form>
        </TabsContent>
        <TabsContent value="wallet">
          <div className="grid gap-4">
            {error && (
              <div className="bg-gray-900 border border-red-500 text-red-400 p-3 rounded-md">
                <p className="text-sm">{error}</p>
              </div>
            )}
            <div className="p-3 bg-gray-900 rounded-md">
              <p className="text-sm text-white mb-2">Connect your wallet to sign in securely without a password</p>
              <ZkSyncWalletConnect />
            </div>
          </div>
        </TabsContent>
      </Tabs>
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