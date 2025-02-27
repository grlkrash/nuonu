import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'
import { getSession } from '@/lib/auth'
import { Header } from '@/components/layout/header'

export const metadata = {
  title: 'Sign In | Nuonu',
  description: 'Sign in to your Nuonu account',
}

export default async function SignInPage() {
  const session = await getSession()
  
  // Redirect to dashboard if already signed in
  if (session) {
    redirect('/dashboard')
  }
  
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-16 mt-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Sign In
            </h1>
            <p className="text-gray-300">
              Sign in to your Nuonu account to access your dashboard
            </p>
          </div>
          
          <div className="bg-black border border-gray-700 rounded-lg shadow-md p-6">
            <AuthForm mode="signin" />
          </div>
        </div>
      </div>
    </>
  )
} 