"use client"

import { Button } from "@/components/ui/button"

interface WalletConnectionProps {
  onConnect: (wallet: string) => void
  isConnecting?: boolean
}

export function WalletConnection({ onConnect, isConnecting = false }: WalletConnectionProps) {
  const handleConnect = (wallet: string) => {
    console.log(`Connecting to ${wallet}...`)
    onConnect(wallet)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4 lowercase">connect your wallets</h2>
      <Button 
        onClick={() => handleConnect("EVM")} 
        className="w-full mb-2 lowercase"
        disabled={isConnecting}
      >
        {isConnecting ? "connecting..." : "connect evm wallet"}
      </Button>
      <Button 
        onClick={() => handleConnect("zkSync")} 
        className="w-full mb-2 lowercase"
        disabled={isConnecting}
      >
        {isConnecting ? "connecting..." : "connect zksync wallet"}
      </Button>
      <Button 
        onClick={() => handleConnect("Flow")} 
        className="w-full lowercase"
        disabled={isConnecting}
      >
        {isConnecting ? "connecting..." : "connect flow wallet"}
      </Button>
    </div>
  )
} 