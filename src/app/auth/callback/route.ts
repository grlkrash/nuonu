import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard'
  
  // Log detailed information for debugging
  console.log('Auth Callback - URL:', request.url)
  console.log('Auth Callback - Code exists:', !!code)
  console.log('Auth Callback - Redirect to:', redirectTo)
  
  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Exchange the code for a session
      console.log('Auth Callback - Exchanging code for session')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth Callback - Error exchanging code:', error.message, error)
        // Redirect to sign-in page with error message
        const errorUrl = new URL('/signin', requestUrl.origin)
        errorUrl.searchParams.set('error', `Authentication failed: ${error.message}`)
        return NextResponse.redirect(errorUrl)
      }
      
      // Verify that we have a session
      console.log('Auth Callback - Session created:', !!data.session)
      
      if (data.session) {
        console.log('Auth Callback - User authenticated:', data.session.user.id)
        console.log('Auth Callback - User email:', data.session.user.email)
        console.log('Auth Callback - User metadata:', JSON.stringify(data.session.user.user_metadata))
        
        // Add a small delay to ensure cookies are properly set
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verify the session was created
        const { data: sessionCheck } = await supabase.auth.getSession()
        console.log('Auth Callback - Session verification:', !!sessionCheck.session)
        
        // Check if the user has a profile, create one if not
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.session.user.id)
          .single()
        
        if (profileError || !profileData) {
          console.log('Auth Callback - Creating user profile')
          // Create a profile for the user
          await supabase.from('profiles').insert({
            id: data.session.user.id,
            email: data.session.user.email,
            created_at: new Date().toISOString()
          })
        }
        
        // Redirect to the intended destination
        console.log('Auth Callback - Redirecting to:', redirectTo)
        return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
      } else {
        console.error('Auth Callback - No session created after exchange')
        // Redirect to sign-in page with error message
        const errorUrl = new URL('/signin', requestUrl.origin)
        errorUrl.searchParams.set('error', 'Failed to create session. Please try again.')
        return NextResponse.redirect(errorUrl)
      }
    } catch (error) {
      console.error('Auth Callback - Unexpected error:', error)
      // Redirect to sign-in page with error message
      const errorUrl = new URL('/signin', requestUrl.origin)
      errorUrl.searchParams.set('error', 'An unexpected error occurred. Please try again.')
      return NextResponse.redirect(errorUrl)
    }
  }
  
  console.error('Auth Callback - No code provided')
  // Redirect to sign-in page with error message
  const errorUrl = new URL('/signin', requestUrl.origin)
  errorUrl.searchParams.set('error', 'Authentication failed. Please try again.')
  return NextResponse.redirect(errorUrl)
} 