'use client'

import { useState, useEffect } from 'react'
import { useWalletAbstraction } from '@/lib/blockchain/wallet-abstraction'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Wallet, Check, AlertCircle, Shield, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export function SimpleWalletConnect() {
  const {
    baseWallet,
    zkSyncWallet,
    flowWallet,
    isConnecting,
    error,
    connectBaseWallet,
    connectZkSyncWallet,
    createZkSyncSessionKey,
    connectFlowWallet,
    disconnectAll,
    isAnyWalletConnected
  } = useWalletAbstraction()

  const [activeTab, setActiveTab] = useState<string>('zksync')
  const [sessionKeyCreated, setSessionKeyCreated] = useState(false)
  const [isCreatingSessionKey, setIsCreatingSessionKey] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Auto-create session key when zkSync wallet is connected
  useEffect(() => {
    const createSessionKey = async () => {
      if (zkSyncWallet && !zkSyncWallet.sessionKey && !sessionKeyCreated && !isCreatingSessionKey) {
        try {
          setIsCreatingSessionKey(true)
          await createZkSyncSessionKey()
          setSessionKeyCreated(true)
        } catch (err) {
          console.error('Error creating session key:', err)
        } finally {
          setIsCreatingSessionKey(false)
        }
      }
    }
    
    createSessionKey()
  }, [zkSyncWallet, sessionKeyCreated, isCreatingSessionKey, createZkSyncSessionKey])

  const handleConnectWallet = async () => {
    try {
      if (!showAdvanced) {
        // Default to zkSync for best user experience
        await connectZkSyncWallet()
      } else {
        // In advanced mode, use the selected tab
        if (activeTab === 'base') {
          await connectBaseWallet()
        } else if (activeTab === 'zksync') {
          await connectZkSyncWallet()
        } else if (activeTab === 'flow') {
          await connectFlowWallet()
        }
      }
    } catch (err) {
      console.error('Error connecting wallet:', err)
    }
  }

  const truncateAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Get the primary wallet (prioritize zkSync)
  const primaryWallet = zkSyncWallet || baseWallet || flowWallet

  return (
    <div className="w-full">
      {!showAdvanced ? (
        // Simple mode - user-friendly interface
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base">Connect Your Wallet</CardTitle>
                <CardDescription>
                  Securely connect your wallet to receive grant payments
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAdvanced(true)}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Advanced options</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {primaryWallet ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Wallet Connected</p>
                      <p className="text-xs text-gray-500">{truncateAddress(primaryWallet.address)}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={disconnectAll}>
                    Disconnect
                  </Button>
                </div>
                
                {zkSyncWallet && zkSyncWallet.sessionKey && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Enhanced Security Enabled</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        Your wallet is protected with Smart Sign On technology for seamless and secure transactions.
                      </p>
                    </div>
                  </div>
                )}
                
                {zkSyncWallet && !zkSyncWallet.sessionKey && isCreatingSessionKey && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">Setting up enhanced security...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Connect your wallet to receive grant payments directly. No blockchain experience required - we'll handle the technical details for you.
                </p>
                
                <Button 
                  onClick={handleConnectWallet} 
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
                      Connect Wallet
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  Don't have a wallet? We'll help you create one when you receive your first grant.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Advanced mode - full blockchain options
        <Collapsible>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">Advanced Wallet Settings</CardTitle>
                  <CardDescription>
                    Connect to specific blockchain networks
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAdvanced(false)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only">Simple mode</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="zksync" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="zksync">zkSync</TabsTrigger>
                  <TabsTrigger value="base">Base</TabsTrigger>
                  <TabsTrigger value="flow">Flow</TabsTrigger>
                </TabsList>
                
                <TabsContent value="zksync" className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Connect to zkSync for enhanced privacy, scalability, and Smart Sign On capabilities.
                    </p>
                    
                    {zkSyncWallet ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <Check className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Connected</p>
                              <p className="text-xs text-gray-500">{truncateAddress(zkSyncWallet.address)}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={disconnectAll}>
                            Disconnect
                          </Button>
                        </div>
                        
                        {!zkSyncWallet.sessionKey && !isCreatingSessionKey && (
                          <Button
                            onClick={async () => {
                              try {
                                setIsCreatingSessionKey(true)
                                await createZkSyncSessionKey()
                                setSessionKeyCreated(true)
                              } catch (err) {
                                console.error('Error creating session key:', err)
                              } finally {
                                setIsCreatingSessionKey(false)
                              }
                            }}
                            disabled={isCreatingSessionKey}
                            variant="secondary"
                            size="sm"
                            className="w-full"
                          >
                            {isCreatingSessionKey ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Session Key...
                              </>
                            ) : (
                              'Create Session Key'
                            )}
                          </Button>
                        )}
                        
                        {zkSyncWallet.sessionKey && (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Session Key Created: {zkSyncWallet.sessionKey.slice(0, 6)}...{zkSyncWallet.sessionKey.slice(-4)}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleConnectWallet()} 
                        disabled={isConnecting}
                        className="w-full"
                      >
                        {isConnecting && activeTab === 'zksync' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Wallet className="mr-2 h-4 w-4" />
                            Connect zkSync Wallet
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="base" className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Connect to Base for fast and low-cost transactions on Coinbase's L2 network.
                    </p>
                    
                    {baseWallet ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Connected</p>
                            <p className="text-xs text-gray-500">{truncateAddress(baseWallet.address)}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={disconnectAll}>
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleConnectWallet()} 
                        disabled={isConnecting}
                        className="w-full"
                      >
                        {isConnecting && activeTab === 'base' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Wallet className="mr-2 h-4 w-4" />
                            Connect Base Wallet
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="flow" className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Connect to Flow for NFTs and digital collectibles with Eliza OS integration.
                    </p>
                    
                    {flowWallet ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Connected</p>
                            <p className="text-xs text-gray-500">{flowWallet.address}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={disconnectAll}>
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleConnectWallet()} 
                        disabled={isConnecting}
                        className="w-full"
                      >
                        {isConnecting && activeTab === 'flow' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Wallet className="mr-2 h-4 w-4" />
                            Connect Flow Wallet
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </Collapsible>
      )}
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isAnyWalletConnected() && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-2">Connected Wallets</h3>
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            {baseWallet && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-2 w-2 text-green-600" />
                </div>
                <p>Base: {truncateAddress(baseWallet.address)}</p>
              </div>
            )}
            {zkSyncWallet && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-2 w-2 text-green-600" />
                </div>
                <p>zkSync: {truncateAddress(zkSyncWallet.address)}</p>
              </div>
            )}
            {flowWallet && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-2 w-2 text-green-600" />
                </div>
                <p>Flow: {flowWallet.address}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 