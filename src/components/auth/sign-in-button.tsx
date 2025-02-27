"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SignInModal } from "@/components/auth/sign-in-modal"

export function SignInButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [signInMethod, setSignInMethod] = useState<"email" | "wallet" | null>(null)

  const handleSignIn = (method: "email" | "wallet") => {
    setSignInMethod(method)
    setIsModalOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2">
            Sign In
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => handleSignIn("email")}>Email</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleSignIn("wallet")}>Wallet</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} method={signInMethod} />
    </>
  )
} 