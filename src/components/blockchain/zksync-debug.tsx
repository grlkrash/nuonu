'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { connect, disconnect } from '@wagmi/core'
import { ssoConnector, wagmiConfig } from '@/lib/zksync-sso-config'
import { zksyncSepoliaTestnet } from 'viem/chains'

interface DebugInfo {
  walletAddress: string | null
  supabaseSession: boolean
  supabaseUser: any | null
  zkSyncConnected: boolean
  zkSyncAccounts: string[]
  localStorage: Record<string, string>
  cookies: Record<string, string>
}

export function ZkSyncDebug() {
  const [isOpen, setIsOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    walletAddress: null,
    supabaseSession: false,
    supabaseUser: null,
    zkSyncConnected: false,
    zkSyncAccounts: [],
    localStorage: {},
    cookies: {},
  })
  const [isLoading, setIsLoading] = useState(false)

  const refreshDebugInfo = async () => {
    setIsLoading(true)
    try {
      // Get wallet address from localStorage
      const storedAddress = localStorage.getItem('walletAddress')
      
      // Get cookies
      const cookies: Record<string, string> = {}
      document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=')
        if (name && value) {
          cookies[name] = value
        }
      })
      
      // Get localStorage items related to auth
      const localStorageItems: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('wallet') || key.includes('zksync'))) {
          localStorageItems[key] = localStorage.getItem(key) || ''
        }
      }
      
      // Check Supabase session
      const { data: sessionData } = await supabase.auth.getSession()
      
      // Try to get zkSync connection status
      let zkSyncConnected = false
      let zkSyncAccounts: string[] = []
      
      try {
        // This is a simple check - it will throw if not connected
        const result = await connect(wagmiConfig, {
          connector: ssoConnector,
          chainId: zksyncSepoliaTestnet.id,
        })
        
        zkSyncConnected = true
        zkSyncAccounts = result.accounts || []
      } catch (error: any) {
        console.log('zkSync connection check error:', error.message)
        // If the error indicates we're already connected, update the status
        if (error.message?.includes('already connected')) {
          zkSyncConnected = true
        }
      }
      
      setDebugInfo({
        walletAddress: storedAddress,
        supabaseSession: !!sessionData.session,
        supabaseUser: sessionData.session?.user || null,
        zkSyncConnected,
        zkSyncAccounts,
        localStorage: localStorageItems,
        cookies,
      })
    } catch (error) {
      console.error('Error refreshing debug info:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    if (isOpen) {
      refreshDebugInfo()
    }
  }, [isOpen])
  
  const handleClearStorage = () => {
    // Clear localStorage items related to auth
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('supabase') || key.includes('wallet') || key.includes('zksync'))) {
        localStorage.removeItem(key)
      }
    }
    
    // Clear cookies related to auth
    document.cookie = 'wallet-address=; path=/; max-age=0; SameSite=Lax'
    document.cookie = 'supabase-auth-token=; path=/; max-age=0; SameSite=Lax'
    document.cookie = 'sb-auth-token=; path=/; max-age=0; SameSite=Lax'
    document.cookie = 'session-status=; path=/; max-age=0; SameSite=Lax'
    
    refreshDebugInfo()
  }
  
  const handleDisconnect = async () => {
    try {
      await disconnect(wagmiConfig)
      await supabase.auth.signOut()
      handleClearStorage()
    } catch (error) {
      console.error('Error disconnecting:', error)
    }
  }
  
  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white"
      >
        Debug zkSync
      </Button>
    )
  }
  
  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-auto">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">zkSync SSO Debug</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
        <CardDescription>
          Diagnose zkSync SSO connection issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshDebugInfo} 
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearStorage}
            className="text-red-500"
          >
            Clear Storage
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDisconnect}
            className="text-red-500"
          >
            Disconnect All
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Wallet Address:</span>
            {debugInfo.walletAddress ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                {`${debugInfo.walletAddress.slice(0, 6)}...${debugInfo.walletAddress.slice(-4)}`}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-500/10 text-red-500">
                Not Found
              </Badge>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Supabase Session:</span>
            {debugInfo.supabaseSession ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-500/10 text-red-500">
                None
              </Badge>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">zkSync Connected:</span>
            {debugInfo.zkSyncConnected ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-500/10 text-red-500">
                Disconnected
              </Badge>
            )}
          </div>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="user">
            <AccordionTrigger>Supabase User</AccordionTrigger>
            <AccordionContent>
              <pre className="text-xs bg-gray-900 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(debugInfo.supabaseUser, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="accounts">
            <AccordionTrigger>zkSync Accounts</AccordionTrigger>
            <AccordionContent>
              {debugInfo.zkSyncAccounts.length > 0 ? (
                <ul className="space-y-1">
                  {debugInfo.zkSyncAccounts.map((account, index) => (
                    <li key={index} className="text-sm">
                      {account}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No accounts found</p>
              )}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="localStorage">
            <AccordionTrigger>Local Storage</AccordionTrigger>
            <AccordionContent>
              <pre className="text-xs bg-gray-900 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(debugInfo.localStorage, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="cookies">
            <AccordionTrigger>Cookies</AccordionTrigger>
            <AccordionContent>
              <pre className="text-xs bg-gray-900 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(debugInfo.cookies, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
} 