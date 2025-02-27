import { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { getSession } from "@/lib/auth"
import { FixedHeader } from "@/components/layout/fixed-header"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Sign up for an account",
}

export default async function SignUpPage() {
  console.log('SignUpPage - Rendering sign-up page')
  
  try {
    const session = await getSession()
    console.log('SignUpPage - Session exists:', !!session)

    if (session) {
      console.log('SignUpPage - User already logged in, redirecting to dashboard')
      redirect("/dashboard")
    }

    return (
      <>
        <FixedHeader />
        <div className="flex flex-col min-h-screen bg-black">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto space-y-6 bg-black border border-gray-800 p-6 rounded-lg">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold text-white">Sign Up</h1>
                <p className="text-gray-400">Create an account to get started</p>
              </div>
              <AuthForm type="signup" />
            </div>
          </div>
        </div>
      </>
    )
  } catch (error) {
    console.error('SignUpPage - Error rendering sign-up page:', error)
    
    // Return a fallback UI instead of throwing an error
    return (
      <>
        <FixedHeader />
        <div className="flex flex-col min-h-screen bg-black">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto space-y-6 bg-black border border-gray-800 p-6 rounded-lg">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold text-white">Sign Up</h1>
                <p className="text-gray-400">Create an account to get started</p>
                <p className="text-red-400 mt-4">
                  There was an issue loading the sign-up page. Please try again later.
                </p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
} 