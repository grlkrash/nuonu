"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  method: "email" | "wallet" | null
}

export function SignInModal({ isOpen, onClose, method }: SignInModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [step, setStep] = useState<"email" | "password" | "verify">("email")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (method === "email") {
        if (step === "email") {
          // Check if user exists
          const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: false,
            },
          })

          if (error) {
            if (error.message.includes("User not found")) {
              setStep("verify")
            } else {
              throw error
            }
          } else {
            setStep("verify")
          }
        } else if (step === "password") {
          // Attempt to sign in
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) throw error
          onClose()
        } else if (step === "verify") {
          // Send verification email
          const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: true,
            },
          })

          if (error) throw error
          alert("Verification email sent. Please check your inbox.")
          onClose()
        }
      } else if (method === "wallet") {
        // Implement zksync flow here
        console.log("Implement zksync flow")
      }
    } catch (err) {
      console.error("Authentication error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border border-white text-white">
        <DialogHeader>
          <DialogTitle>{method === "email" ? "Sign in with Email" : "Connect Wallet"}</DialogTitle>
        </DialogHeader>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {method === "email" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === "email" && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white text-black"
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-400">Use the same email you used in the intake form</p>
              </div>
            )}
            {step === "password" && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white text-black"
                  disabled={isLoading}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? "Loading..."
                : step === "email"
                ? "Continue"
                : step === "password"
                ? "Sign In"
                : "Send Verification Email"}
            </Button>
          </form>
        )}
        {method === "wallet" && (
          <div>
            <p>Connect your wallet to sign in</p>
            <Button onClick={handleSubmit} className="w-full mt-4" disabled={isLoading}>
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 