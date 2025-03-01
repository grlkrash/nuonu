"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"

interface WithdrawalInterfaceProps {
  balance: number
  onWithdraw?: (amount: string, address: string) => Promise<void>
}

export function WithdrawalInterface({ balance, onWithdraw }: WithdrawalInterfaceProps) {
  const [amount, setAmount] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { theme } = useTheme()

  const handleWithdraw = async () => {
    if (!amount || !address) return
    
    setIsLoading(true)
    try {
      if (onWithdraw) {
        await onWithdraw(amount, address)
      } else {
        console.log(`Withdrawing $${amount} to wallet: ${address}`)
      }
    } catch (error) {
      console.error("Withdrawal failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const cardClass = theme === "light" ? "bg-white border-black" : "bg-black border-white"
  const textClass = theme === "light" ? "text-black" : "text-white"
  const inputClass = theme === "light" ? "bg-white text-black border-black" : "bg-black text-white border-white"
  const buttonClass =
    theme === "light" ? "bg-black text-white hover:bg-gray-800" : "bg-white text-black hover:bg-gray-200"

  return (
    <Card className={`mt-8 ${cardClass} border`}>
      <CardHeader>
        <CardTitle className={`lowercase ${textClass}`}>withdraw</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleWithdraw(); }}>
          <div className="space-y-2">
            <Label htmlFor="amount" className={`lowercase ${textClass}`}>
              amount
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`lowercase ${inputClass}`}
            />
            <p className={`text-sm ${textClass}`}>Available balance: ${balance.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className={`lowercase ${textClass}`}>
              wallet address
            </Label>
            <Input
              id="address"
              type="text"
              placeholder="enter wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`lowercase ${inputClass}`}
            />
          </div>
          <Button 
            type="submit" 
            className={`w-full lowercase ${buttonClass}`}
            disabled={isLoading || !amount || !address}
          >
            {isLoading ? "processing..." : "withdraw to wallet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 