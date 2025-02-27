import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })
  
  // Refresh the session to ensure it's valid
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  // Add detailed logging
  console.log('Middleware - Path:', request.nextUrl.pathname)
  console.log('Middleware - Session exists:', !!session)
  console.log('Middleware - Query params:', Object.fromEntries(request.nextUrl.searchParams.entries()))
  
  if (session) {
    console.log('Middleware - User ID:', session.user.id)
    console.log('Middleware - User email:', session.user.email)
  }
  
  // Check if the request is for a protected route
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/profile') ||
                          request.nextUrl.pathname.startsWith('/applications')
  
  // Check if the user is in guest mode (for dashboard only)
  const isGuestMode = request.nextUrl.pathname.startsWith('/dashboard') && 
                     request.nextUrl.searchParams.get('guest') === 'true'
  
  console.log('Middleware - Is guest mode:', isGuestMode)
  
  // If accessing a protected route without a session and not in guest mode, redirect to sign in
  // For dashboard, we need to check if it's guest mode
  if (isProtectedRoute && !session) {
    if (request.nextUrl.pathname.startsWith('/dashboard') && isGuestMode) {
      // Allow access to dashboard in guest mode
      console.log('Middleware - Allowing access to dashboard in guest mode')
      return response
    }
    
    console.log('Middleware - Redirecting to sign in from protected route')
    const redirectUrl = new URL('/signin', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If accessing auth pages with a session, redirect to dashboard
  if ((request.nextUrl.pathname === '/signin' || request.nextUrl.pathname === '/signup') && session) {
    console.log('Middleware - Redirecting to dashboard from auth page')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return response
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