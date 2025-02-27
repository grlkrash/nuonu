import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard'
  
  console.log('Auth callback - Processing request URL:', request.url)
  console.log('Auth callback - Code present:', !!code)
  console.log('Auth callback - Redirect destination:', redirectTo)
  
  if (code) {
    const supabase = createServerSupabaseClient()
    try {
      console.log('Auth callback - Exchanging code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback - Error exchanging code for session:', error.message)
        return NextResponse.redirect(new URL(`/signin?error=auth_callback_error&message=${encodeURIComponent(error.message)}`, request.url))
      }
      
      console.log('Auth callback - Successfully exchanged code for session:', !!data.session)
      
      if (data.session) {
        console.log('Auth callback - User authenticated:', data.session.user.email)
        
        // Verify the session was properly set
        const { data: sessionCheck } = await supabase.auth.getSession()
        console.log('Auth callback - Session verification:', !!sessionCheck.session)
        
        // Redirect to the dashboard or the specified redirect URL
        return NextResponse.redirect(new URL(redirectTo, request.url))
      } else {
        console.error('Auth callback - No session after code exchange')
        return NextResponse.redirect(new URL('/signin?error=no_session', request.url))
      }
    } catch (error) {
      console.error('Auth callback - Exception exchanging code for session:', error)
      return NextResponse.redirect(new URL('/signin?error=auth_callback_exception', request.url))
    }
  }
  
  console.log('Auth callback - No code provided')
  // If no code or session, redirect to sign-in
  return NextResponse.redirect(new URL('/signin?error=no_code', request.url))
} 