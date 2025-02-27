import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const path = requestUrl.pathname
  
  // Create a Supabase client configured to use cookies
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })
  
  // Refresh session if expired - required for Server Components
  const { data: { session }, error } = await supabase.auth.getSession()
  
  // Log detailed information for debugging
  console.log('Middleware - Path:', path)
  console.log('Middleware - Session exists:', !!session)
  console.log('Middleware - Query params:', Object.fromEntries(requestUrl.searchParams.entries()))
  
  if (error) {
    console.error('Middleware - Session error:', error.message)
  }
  
  // Check if the request is for a protected route
  const isProtectedRoute = path.startsWith('/dashboard') || 
                          path.startsWith('/profile') || 
                          path.startsWith('/applications')
  
  // Check if user is in guest mode
  const isGuestMode = requestUrl.searchParams.get('guest') === 'true'
  console.log('Middleware - Is guest mode:', isGuestMode)
  
  // If the request is for a protected route and the user is not authenticated
  if (isProtectedRoute) {
    if (!session) {
      // Allow access in guest mode, otherwise redirect to sign-in
      if (isGuestMode) {
        console.log('Middleware - Allowing guest access to protected route:', path)
        return response
      } else {
        console.log('Middleware - No session, redirecting to sign-in')
        // Redirect to sign-in page with a return URL
        const redirectUrl = new URL('/signin', requestUrl.origin)
        redirectUrl.searchParams.set('returnUrl', path)
        return NextResponse.redirect(redirectUrl)
      }
    }
    
    console.log('Middleware - Session found, allowing access to protected route:', path)
    return response
  }
  
  // If the request is for an auth page and the user is authenticated
  if ((path === '/signin' || path === '/signup') && session) {
    console.log('Middleware - Session exists, redirecting from auth page to dashboard')
    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
  }
  
  // For all other routes, proceed normally
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