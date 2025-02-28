import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const path = requestUrl.pathname
  
  console.log('Middleware - Processing request for path:', path)
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() })
  
  // Refresh session if it exists
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Middleware - Error getting session:', error.message)
  }
  
  console.log('Middleware - Session exists:', !!session)
  
  // Check if this is a protected route
  const isProtectedRoute = path.startsWith('/dashboard') || 
                           path.startsWith('/profile') || 
                           path.startsWith('/applications')
  
  // Check if this is an auth route
  const isAuthRoute = path.startsWith('/signin') || path.startsWith('/signup')
  
  // Check if user is in guest mode
  const isGuestMode = requestUrl.searchParams.get('guest') === 'true'
  console.log('Middleware - Guest mode:', isGuestMode)
  
  // Check for wallet address in cookies as a fallback for wallet-based authentication
  const walletAddressCookie = request.cookies.get('wallet-address')
  const hasWalletCookie = !!walletAddressCookie
  console.log('Middleware - Wallet cookie exists:', hasWalletCookie)
  
  // Allow access to protected routes in guest mode or if a wallet cookie is present
  if (isProtectedRoute && !session) {
    console.log('Middleware - Protected route without session')
    
    if (isGuestMode) {
      console.log('Middleware - Allowing access in guest mode')
      return NextResponse.next()
    }
    
    if (hasWalletCookie) {
      console.log('Middleware - Wallet cookie found but no session')
      
      // Special handling for wallet-based users
      // We'll let them through but the client-side SessionRecovery component
      // will attempt to recover their session
      const response = NextResponse.next()
      
      // Add a header to indicate that session recovery is needed
      response.headers.set('X-Needs-Session-Recovery', 'true')
      response.headers.set('X-Wallet-Address', walletAddressCookie.value)
      
      console.log('Middleware - Allowing access with wallet cookie, recovery needed')
      return response
    }
    
    // Redirect to sign in page with the original URL as redirect target
    const redirectUrl = new URL('/signin', requestUrl.origin)
    redirectUrl.searchParams.set('redirect', path)
    
    console.log('Middleware - Redirecting to sign in:', redirectUrl.toString())
    return NextResponse.redirect(redirectUrl)
  }
  
  // For authenticated users, check if they're trying to access auth pages
  if (session && isAuthRoute) {
    console.log('Middleware - Authenticated user trying to access auth page, redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
  }
  
  // Check if this is a wallet-based user
  if (session && session.user?.email?.endsWith('@wallet.zksync')) {
    console.log('Middleware - Wallet-based user detected')
    
    // Extract wallet address from email
    const walletAddress = session.user.email.split('@')[0]
    
    // Set wallet address cookie for client-side access if it doesn't exist
    if (!hasWalletCookie) {
      console.log('Middleware - Setting wallet address cookie')
      const response = NextResponse.next()
      response.cookies.set('wallet-address', walletAddress, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
      return response
    }
  }
  
  // Allow the request to continue
  return NextResponse.next()
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/applications/:path*',
    '/signin',
    '/signup',
  ],
} 