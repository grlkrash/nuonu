'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { formatEther } from 'viem'

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
  status: 'success' | 'failed' | 'pending'
}

interface WalletTransactionsProps {
  walletAddress?: string
  limit?: number
}

export function WalletTransactions({ walletAddress, limit = 5 }: WalletTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      let addressToUse = walletAddress
      
      if (!addressToUse) {
        // Try to get wallet address from localStorage or cookies
        const storedAddress = typeof window !== 'undefined' ? localStorage.getItem('walletAddress') : null
        
        // Get cookie value helper
        const getCookieValue = (name: string) => {
          if (typeof document === 'undefined') return null
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop()?.split(';').shift()
          return null
        }
        
        const cookieAddress = getCookieValue('wallet-address')
        
        if (!storedAddress && !cookieAddress) {
          setIsLoading(false)
          setError('No wallet address found')
          return
        }
        
        addressToUse = storedAddress || cookieAddress || ''
      }
      
      try {
        setIsLoading(true)
        
        // Use zkSync API to fetch transactions
        const apiUrl = `https://explorer.sepolia.era.zksync.dev/api?module=account&action=txlist&address=${addressToUse}&sort=desc`
        
        const response = await fetch(apiUrl)
        if (!response.ok) {
          throw new Error('Failed to fetch transactions')
        }
        
        const data = await response.json()
        
        if (data.status === '1' && Array.isArray(data.result)) {
          // Transform the API response into our transaction format
          const formattedTransactions = data.result
            .slice(0, limit)
            .map((tx: any) => ({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: tx.value,
              timestamp: parseInt(tx.timeStamp) * 1000,
              status: tx.isError === '0' ? 'success' : 'failed',
            }))
          
          setTransactions(formattedTransactions)
        } else {
          // If no transactions or error, set empty array
          setTransactions([])
        }
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError('Failed to load transactions')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTransactions()
  }, [walletAddress, limit])
  
  // Format wallet address for display
  const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  // If no wallet address and no transactions, don't render anything
  if (!walletAddress && transactions.length === 0 && !isLoading) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          {walletAddress ? `Transactions for ${formatAddress(walletAddress)}` : 'Your recent transactions'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="text-center py-4">
            <p className="text-red-500 mb-2">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setError(null)
                setIsLoading(true)
                // Re-trigger the effect
                const address = walletAddress || (typeof window !== 'undefined' ? localStorage.getItem('walletAddress') : null) || ''
                if (address) {
                  setTransactions([])
                }
              }}
            >
              Retry
            </Button>
          </div>
        ) : transactions.length === 0 ? (
          // Empty state
          <div className="text-center py-4">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          // Transactions list
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.hash} className="border-b border-gray-200 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {tx.from.toLowerCase() === walletAddress?.toLowerCase() ? 'Sent' : 'Received'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tx.from.toLowerCase() === walletAddress?.toLowerCase() 
                        ? `To: ${formatAddress(tx.to)}`
                        : `From: ${formatAddress(tx.from)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${tx.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.from.toLowerCase() === walletAddress?.toLowerCase() ? '-' : '+'}{formatEther(BigInt(tx.value))} ETH
                    </p>
                    <p className="text-xs text-gray-500">
                      {tx.timestamp ? formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true }) : 'Unknown time'}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <a 
                    href={`https://explorer.sepolia.era.zksync.dev/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    View on Explorer
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 