import { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { getSession } from "@/lib/auth"
import { FixedHeader } from "@/components/layout/fixed-header"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
}

export default async function SignInPage() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <>
      <FixedHeader />
      <div className="flex flex-col min-h-screen bg-black">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md mx-auto space-y-6 bg-black border border-gray-800 p-6 rounded-lg">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold text-white">Sign In</h1>
              <p className="text-gray-400">Enter your credentials to access your account</p>
            </div>
            <AuthForm type="signin" />
          </div>
        </div>
      </div>
    </>
  )
} 