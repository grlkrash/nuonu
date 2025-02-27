'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Wallet } from 'lucide-react'

export function ZkSyncWalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)
      setError(null)
      
      // This is a placeholder for the actual zkSync SSO implementation
      // In a real implementation, you would use the zkSync SSO SDK here
      
      // Simulate a successful connection for now
      setTimeout(() => {
        setWalletAddress('0x1234...5678')
        setIsConnecting(false)
      }, 1500)
      
    } catch (err) {
      console.error('Error connecting wallet:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    setWalletAddress(null)
  }

  return (
    <div className="p-4 bg-black border border-gray-700 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Connect Your Wallet</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {walletAddress ? (
        <div className="space-y-4">
          <div className="p-3 bg-gray-800 rounded-md">
            <p className="text-sm text-white font-medium">Connected Wallet</p>
            <p className="text-xs text-gray-400 mt-1">{walletAddress}</p>
          </div>
          
          <Button
            onClick={handleDisconnect}
            className="w-full bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl"
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Connect with zkSync Smart Sign-On for a seamless and secure experience.
          </p>
          
          <Button
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className="w-full bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect with zkSync SSO
              </>
            )}
          </Button>
          
          <div className="p-3 bg-gray-800 rounded-md">
            <p className="text-xs text-gray-300 font-medium">Benefits of zkSync Smart Sign-On:</p>
            <ul className="mt-1 text-xs text-gray-400 space-y-1 list-disc pl-4">
              <li>No seed phrases to remember</li>
              <li>Enhanced security with session keys</li>
              <li>Seamless transaction experience</li>
              <li>Control what apps can do with your wallet</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
} 