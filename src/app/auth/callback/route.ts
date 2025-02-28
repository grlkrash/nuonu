import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect_to = requestUrl.searchParams.get('redirect_to') || '/dashboard'
  const skip_confirmation = requestUrl.searchParams.get('skip_confirmation') === 'true'
  
  console.log('Auth callback received:', {
    hasCode: !!code,
    redirectTo: redirect_to,
    skipConfirmation: skip_confirmation
  })
  
  // Create a Supabase client with cookies for server-side session handling
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  if (code) {
    try {
      console.log('Exchanging code for session')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(
          `${requestUrl.origin}/signin?error=auth_callback_error&message=${encodeURIComponent(error.message)}`
        )
      }
      
      if (!data.session) {
        console.error('No session created after code exchange')
        return NextResponse.redirect(
          `${requestUrl.origin}/signin?error=no_session`
        )
      }
      
      console.log('Session created successfully:', {
        userId: data.user?.id,
        email: data.user?.email,
        isConfirmed: data.user?.confirmed_at ? 'Yes' : 'No'
      })
      
      // Check if this is a wallet-based user
      const isWalletUser = data.user?.email?.endsWith('@wallet.zksync')
      
      if (isWalletUser) {
        console.log('Wallet-based user detected')
        
        // Extract wallet address from email
        const walletAddress = data.user?.email?.split('@')[0]
        console.log('Extracted wallet address:', walletAddress)
        
        // Auto-confirm wallet users if they're not already confirmed
        if (!data.user?.confirmed_at && skip_confirmation) {
          console.log('Auto-confirming wallet user')
          try {
            // Use updateUser instead of admin.updateUserById for better compatibility
            await supabase.auth.updateUser({
              data: { confirmed: true }
            })
            console.log('User auto-confirmed successfully')
          } catch (confirmError) {
            console.error('Error auto-confirming user:', confirmError)
            // Continue anyway, as this is not critical
          }
        }
        
        // Update user metadata with wallet address if needed
        if (walletAddress && (!data.user?.user_metadata?.wallet_address || 
            data.user.user_metadata.wallet_address !== walletAddress)) {
          console.log('Updating user metadata with wallet address')
          try {
            await supabase.auth.updateUser({
              data: { wallet_address: walletAddress }
            })
            console.log('User metadata updated successfully')
          } catch (updateError) {
            console.error('Error updating user metadata:', updateError)
            // Continue anyway, as this is not critical
          }
        }
        
        // Force session persistence in cookies with explicit cookie setting
        // This ensures the session is available for server-side rendering
        try {
          // Refresh the session to ensure it's up-to-date
          const { data: refreshData } = await supabase.auth.refreshSession()
          const sessionStr = JSON.stringify({
            access_token: refreshData.session?.access_token || data.session.access_token,
            refresh_token: refreshData.session?.refresh_token || data.session.refresh_token,
            expires_at: refreshData.session?.expires_at || data.session.expires_at
          })
          
          // Set the session cookie with a longer expiry
          cookieStore.set('supabase-auth-token', sessionStr, {
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
          
          // Also set a separate session cookie as a fallback
          cookieStore.set('sb-auth-token', sessionStr, {
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
          
          console.log('Session cookies set successfully')
        } catch (cookieError) {
          console.error('Error setting session cookies:', cookieError)
        }
        
        // Check if user has a profile, create one if not
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          if (profileError || !profileData) {
            console.log('Creating profile for wallet user')
            await supabase.from('profiles').insert({
              id: data.user.id,
              wallet_address: walletAddress,
              updated_at: new Date().toISOString(),
            })
            console.log('Profile created successfully')
            
            // Redirect new users to onboarding
            if (!profileData) {
              console.log('New user detected, redirecting to onboarding')
              redirect_to = '/onboarding'
            }
          } else if (walletAddress && (!profileData.wallet_address || 
                     profileData.wallet_address !== walletAddress)) {
            console.log('Updating wallet address in profile')
            await supabase
              .from('profiles')
              .update({ 
                wallet_address: walletAddress,
                updated_at: new Date().toISOString() 
              })
              .eq('id', data.user.id)
            console.log('Profile updated successfully')
          }
        } catch (profileError) {
          console.error('Error handling user profile:', profileError)
          // Continue anyway, as this is not critical
        }
        
        // Add special response headers to help client-side session recovery
        const response = NextResponse.redirect(requestUrl.origin + redirect_to)
        response.headers.set('X-Wallet-Address', walletAddress)
        response.headers.set('X-Auth-Method', 'wallet')
        
        // Set a cookie with the wallet address for client-side access
        // This is a fallback in case localStorage fails
        response.cookies.set('wallet-address', walletAddress, {
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
        
        // Set a session status cookie to help with recovery
        response.cookies.set('session-status', 'active', {
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
        
        console.log('Redirecting wallet user to:', redirect_to)
        return response
      }
      
      // For non-wallet users, just redirect to the specified URL
      console.log('Redirecting non-wallet user to:', redirect_to)
      return NextResponse.redirect(requestUrl.origin + redirect_to)
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=auth_callback_error&message=${encodeURIComponent('An unexpected error occurred')}`
      )
    }
  }
  
  console.error('No code provided in auth callback')
  return NextResponse.redirect(
    `${requestUrl.origin}/signin?error=no_code`
  )
} 