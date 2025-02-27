"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { FixedHeader } from "@/components/layout/fixed-header"

interface Fund {
  id: number
  source: string
  amount: string
  date: string
  status: string
  txHash?: string
}

export default function FundsPage() {
  const [funds, setFunds] = useState<Fund[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    
    window.addEventListener("scroll", handleScroll)
    handleScroll() // Check initial position
    
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const fetchFunds = async () => {
      setIsLoading(true)
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/signin')
          return
        }
        
        // For now, we'll use mock data
        // In a real app, you would fetch this from your database
        setFunds([
          {
            id: 1,
            source: "Creative Expression Fund",
            amount: "1.5 ETH",
            date: "2026-03-15",
            status: "Received",
            txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
          },
          {
            id: 2,
            source: "Digital Innovation Grant",
            amount: "2000 USDC",
            date: "2026-04-30",
            status: "Pending",
          },
          {
            id: 3,
            source: "Community Learning Initiative",
            amount: "0.5 ETH",
            date: "2026-05-20",
            status: "Received",
            txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
          },
        ])
      } catch (err) {
        console.error("Error fetching funds:", err)
        setError("Failed to load your funds. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFunds()
  }, [router])

  const handleViewTransaction = (txHash: string) => {
    window.open(`https://etherscan.io/tx/${txHash}`, '_blank')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-4 mt-16">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Funds</h1>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded mb-4"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-4 mt-16">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Funds</h1>
        <div className="bg-red-900 text-white p-4 rounded">
          <p>{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <FixedHeader />
      <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8 mt-16">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Funds</h1>
        <p className="text-left mb-8">
          Track and manage your grant funds and payments.
        </p>

        {funds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">You haven't received any funds yet.</p>
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2"
            >
              View Opportunities
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white">
                  <th className="py-2 px-4 text-left">Source</th>
                  <th className="py-2 px-4 text-left">Amount</th>
                  <th className="py-2 px-4 text-left">Date</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {funds.map((fund) => (
                  <tr key={fund.id} className="border-b border-gray-800 hover:bg-gray-900">
                    <td className="py-3 px-4">{fund.source}</td>
                    <td className="py-3 px-4 font-medium">{fund.amount}</td>
                    <td className="py-3 px-4">{new Date(fund.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        fund.status === 'Received' ? 'bg-green-900 text-green-300' :
                        fund.status === 'Pending' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {fund.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {fund.txHash ? (
                        <Button
                          onClick={() => handleViewTransaction(fund.txHash!)}
                          className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-3 py-1 text-xs"
                        >
                          View Transaction
                        </Button>
                      ) : (
                        <span className="text-gray-500">No transaction yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-12 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to receive funds directly to your account. We support multiple blockchain networks.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2">
              Connect Base Wallet
            </Button>
            <Button className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2">
              Connect zkSync Wallet
            </Button>
            <Button className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2">
              Connect Flow Wallet
            </Button>
          </div>
        </div>
      </div>
    </>
  )
} 