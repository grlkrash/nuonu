import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Wallet, Check, Shield, Key } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function SimulatedZkSyncSSO() {
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [showAuthPopup, setShowAuthPopup] = useState(false)
  const [authStep, setAuthStep] = useState<'initial' | 'verifying' | 'creating' | 'complete'>('initial')
  const [sessionKey, setSessionKey] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  // Simulate the connection flow
  const handleConnect = async () => {
    setIsConnecting(true)
    
    // Step 1: Show auth popup after a short delay
    setTimeout(() => {
      setShowAuthPopup(true)
      setAuthStep('initial')
    }, 500)
  }

  // Handle auth popup steps
  const handleAuthContinue = () => {
    if (authStep === 'initial') {
      setAuthStep('verifying')
      
      // Simulate verification
      setTimeout(() => {
        setAuthStep('creating')
        
        // Simulate account creation
        setTimeout(() => {
          setAuthStep('complete')
          
          // Close popup after completion
          setTimeout(() => {
            setShowAuthPopup(false)
            
            // Set connected state
            const mockAddress = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
            const mockSessionKey = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
            
            setWalletAddress(mockAddress)
            setSessionKey(mockSessionKey)
            setIsConnected(true)
            setIsConnecting(false)
            
            toast({
              title: "Successfully connected",
              description: "Your zkSync SSO wallet is now connected with a session key.",
            })
          }, 1000)
        }, 1500)
      }, 1500)
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setWalletAddress(null)
    setSessionKey(null)
    
    toast({
      title: "Wallet disconnected",
      description: "Your zkSync SSO wallet has been disconnected.",
    })
  }

  const truncateAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">zkSync Smart Sign-On Demo</CardTitle>
          <CardDescription>
            Securely connect with zkSync Smart Sign-On
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Wallet Connected</p>
                    <p className="text-xs text-gray-500">{truncateAddress(walletAddress!)}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
              
              {sessionKey && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">zkSync Smart Sign-On Enabled</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                      Your wallet is protected with zkSync SSO technology for seamless and secure transactions.
                    </p>
                    <div className="mt-2 flex items-center">
                      <Key className="h-3 w-3 text-blue-500 mr-1" />
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Session key: {sessionKey.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Connect with zkSync Smart Sign-On for a seamless and secure experience. No seed phrases required!
              </p>
              
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="w-full"
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
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Benefits of zkSync Smart Sign-On:</p>
                <ul className="mt-1 text-xs text-gray-500 dark:text-gray-400 space-y-1 list-disc pl-4">
                  <li>No seed phrases to remember</li>
                  <li>Enhanced security with session keys</li>
                  <li>Seamless transaction experience</li>
                  <li>Control what apps can do with your wallet</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auth Server Popup */}
      <Dialog open={showAuthPopup} onOpenChange={setShowAuthPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>zkSync Smart Sign-On</DialogTitle>
            <DialogDescription>
              Securely authenticate with zkSync SSO
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            {authStep === 'initial' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img 
                    src="https://zksync.io/images/logo.svg" 
                    alt="zkSync Logo" 
                    className="h-16 w-16"
                  />
                </div>
                <p className="text-center text-sm">
                  You're connecting to zkSync Smart Sign-On.
                  <br />
                  This will create a secure passkey for your device.
                </p>
                <Button 
                  onClick={handleAuthContinue}
                  className="w-full"
                >
                  Continue with Passkey
                </Button>
              </div>
            )}
            
            {authStep === 'verifying' && (
              <div className="space-y-4 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p>Verifying your device...</p>
              </div>
            )}
            
            {authStep === 'creating' && (
              <div className="space-y-4 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p>Creating your zkSync account...</p>
                <p className="text-xs text-gray-500">This will only take a moment</p>
              </div>
            )}
            
            {authStep === 'complete' && (
              <div className="space-y-4 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p>Successfully authenticated!</p>
                <p className="text-xs text-gray-500">Returning to application...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 