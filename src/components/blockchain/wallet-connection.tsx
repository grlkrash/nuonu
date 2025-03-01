"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface WalletConnectionProps {
  onConnect: (wallet: string) => void
  isConnecting?: boolean
  isConnected?: boolean
}

export function WalletConnection({ onConnect, isConnecting: externalIsConnecting, isConnected = false }: WalletConnectionProps) {
  const [internalIsConnecting, setInternalIsConnecting] = useState<string | null>(null)
  
  // Use external isConnecting state if provided, otherwise use internal state
  const isConnecting = externalIsConnecting ? true : internalIsConnecting !== null

  const handleConnect = async (wallet: string) => {
    setInternalIsConnecting(wallet)
    try {
      console.log(`Connecting to ${wallet}...`)
      await onConnect(wallet)
    } catch (error) {
      console.error(`Error connecting to ${wallet}:`, error)
    } finally {
      setInternalIsConnecting(null)
    }
  }

  if (isConnected) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4 lowercase">wallet connected</h2>
        <p className="text-sm">Your wallet is connected. You can now use the wallet features.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4 lowercase">connect your wallets</h2>
      <Button 
        onClick={() => handleConnect("EVM")} 
        className="w-full mb-2 lowercase"
        disabled={isConnecting}
      >
        {internalIsConnecting === "EVM" ? "connecting..." : "connect evm wallet"}
      </Button>
      <Button 
        onClick={() => handleConnect("zkSync")} 
        className="w-full mb-2 lowercase"
        disabled={isConnecting}
      >
        {internalIsConnecting === "zkSync" ? "connecting..." : "connect zksync wallet"}
      </Button>
      <Button 
        onClick={() => handleConnect("Flow")} 
        className="w-full lowercase"
        disabled={isConnecting}
      >
        {internalIsConnecting === "Flow" ? "connecting..." : "connect flow wallet"}
      </Button>
    </div>
  )
} 