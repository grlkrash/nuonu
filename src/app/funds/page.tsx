"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { FixedHeader } from "@/components/layout/fixed-header"
import { WalletDashboard } from "@/components/blockchain/wallet-dashboard"
import { WithdrawalInterface } from "@/components/blockchain/withdrawal-interface"
import { WalletConnection } from "@/components/blockchain/wallet-connection"
import { BalanceAggregator } from "@/components/blockchain/balance-aggregator"
import { SimulatedTokenTransfer } from "@/components/demo/SimulatedTokenTransfer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { SimulatedGrantDistribution } from "@/components/demo/SimulatedGrantDistribution"
import { SimulatedZkSyncInteraction } from "@/components/demo/SimulatedZkSyncInteraction"
import { WalletConnectionSSO } from "@/components/wallet/wallet-connection-sso"

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
  const [isConnecting, setIsConnecting] = useState(false)
  const [activeTab, setActiveTab] = useState("balances")
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const { toast } = useToast()
  const [chainBalances, setChainBalances] = useState([
    {
      chainId: "ethereum",
      chainName: "Ethereum",
      balance: "0.5",
      symbol: "ETH",
      usdValue: 1500
    },
    {
      chainId: "base",
      chainName: "Base",
      balance: "1.2",
      symbol: "ETH",
      usdValue: 3600
    },
    {
      chainId: "optimism",
      chainName: "Optimism",
      balance: "2.0",
      symbol: "ETH",
      usdValue: 6000
    },
    {
      chainId: "zksync",
      chainName: "zkSync",
      balance: "0.8",
      symbol: "ETH",
      usdValue: 2400
    }
  ])
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)

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
        // For development, skip authentication check
        // In production, you would check if the user is authenticated
        
        // Mock data for development
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

  const handleConnectWallet = (walletType: string) => {
    setIsConnecting(true)
    
    // Simulate wallet connection
    setTimeout(() => {
      setIsConnecting(false)
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${walletType} wallet`,
      })
    }, 1500)
  }

  const handleWithdraw = (amount: string, address: string) => {
    toast({
      title: "Withdrawal Initiated",
      description: `Withdrawing $${amount} to ${address}`,
    })
    
    // In a real app, you would call your API to initiate the withdrawal
  }

  const handleBridgeTokens = async (fromChain: string, toChain: string, amount: string, address: string) => {
    toast({
      title: "Bridge Transaction Initiated",
      description: `Bridging ${amount} from ${fromChain} to ${toChain}`,
    })
    
    // In a real app, you would call your API to initiate the bridge transaction
    return Promise.resolve()
  }

  const handleChainWithdraw = async (chain: string, amount: string, address: string) => {
    toast({
      title: "Chain Withdrawal Initiated",
      description: `Withdrawing ${amount} from ${chain} to ${address}`,
    })
    
    // In a real app, you would call your API to initiate the withdrawal
    return Promise.resolve()
  }

  // Mock data for the wallet dashboard
  const walletData = {
    balance: 3500.75,
    transactions: [
      {
        id: 1,
        type: "Grant",
        amount: 1500,
        from: "Creative Expression Fund",
        date: "2026-03-15"
      },
      {
        id: 2,
        type: "Withdrawal",
        amount: 500,
        to: "Coinbase Wallet",
        date: "2026-03-20"
      },
      {
        id: 3,
        type: "Grant",
        amount: 2000,
        from: "Digital Innovation Grant",
        date: "2026-04-30"
      },
    ],
    grants: [
      {
        id: 1,
        name: "Creative Expression Fund",
        amount: 1500,
        status: "Received"
      },
      {
        id: 2,
        name: "Digital Innovation Grant",
        amount: 2000,
        status: "Pending"
      },
      {
        id: 3,
        name: "Community Learning Initiative",
        amount: 500,
        status: "Received"
      },
    ]
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
          Track and manage your grant funds and payments across multiple blockchains.
        </p>

        <Tabs defaultValue="balances" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="send">Send</TabsTrigger>
            <TabsTrigger value="connect">Connect Wallets</TabsTrigger>
            <TabsTrigger value="grants">Grant Distribution</TabsTrigger>
            <TabsTrigger value="zksync">zkSync Interaction</TabsTrigger>
          </TabsList>
          
          <TabsContent value="balances">
            <BalanceAggregator 
              balances={chainBalances} 
              isLoading={isLoadingBalances}
              onBridgeTokens={handleBridgeTokens}
              onWithdraw={handleChainWithdraw}
            />
          </TabsContent>
          
          <TabsContent value="dashboard">
            <WalletDashboard data={walletData} />
          </TabsContent>
          
          <TabsContent value="withdraw">
            <WithdrawalInterface balance={walletData.balance} onWithdraw={handleWithdraw} />
          </TabsContent>
          
          <TabsContent value="send">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <SimulatedTokenTransfer defaultChain="base" />
            </div>
          </TabsContent>
          
          <TabsContent value="connect" className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <WalletConnectionSSO />
            </div>
          </TabsContent>
          
          <TabsContent value="grants" className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Grant Distribution</h2>
              <p className="text-gray-400 mb-4">
                This is a simulation of how grants are distributed to artists using Base AgentKit and the ArtistFundManager contract.
              </p>
              <SimulatedGrantDistribution />
            </div>
          </TabsContent>
          
          <TabsContent value="zksync" className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">zkSync Smart Contract Interaction</h2>
              <p className="text-gray-400 mb-4">
                This is a simulation of how artists interact with smart contracts on zkSync using session keys.
              </p>
              <SimulatedZkSyncInteraction />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Recent Funds</h2>
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
                    <tr key={fund.id} className="border-b border-gray-800">
                      <td className="py-2 px-4">{fund.source}</td>
                      <td className="py-2 px-4">{fund.amount}</td>
                      <td className="py-2 px-4">{fund.date}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded ${fund.status === 'Received' ? 'bg-green-900' : 'bg-yellow-900'}`}>
                          {fund.status}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        {fund.txHash && (
                          <Button 
                            onClick={() => handleViewTransaction(fund.txHash!)} 
                            className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-3 py-1 text-sm"
                          >
                            View Transaction
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 