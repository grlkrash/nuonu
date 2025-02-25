import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'
import { getSession } from '@/lib/auth'

export const metadata = {
  title: 'Sign Up | Nuonu',
  description: 'Create a new Nuonu account',
}

export default async function SignUpPage() {
  const session = await getSession()
  
  // Redirect to dashboard if already signed in
  if (session) {
    redirect('/dashboard')
  }
  
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create an Account
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sign up for Nuonu to discover funding opportunities for your art
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <AuthForm mode="signup" />
        </div>
      </div>
    </div>
  )
} 