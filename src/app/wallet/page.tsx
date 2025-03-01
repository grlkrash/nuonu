"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/hooks/use-wallet"
import { BalanceAggregator } from "@/components/blockchain/balance-aggregator"
import { WalletDashboard } from "@/components/blockchain/wallet-dashboard"
import { WithdrawalInterface } from "@/components/blockchain/withdrawal-interface"
import { WalletConnection } from "@/components/blockchain/wallet-connection"
import { OptimismBlockchainService, ChainBalance } from "@/lib/services/optimism-blockchain"
import { ethers } from "ethers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function WalletPage() {
  const router = useRouter()
  const { address, isConnected, connect, disconnect } = useWallet()
  const [isLoading, setIsLoading] = useState(true)
  const [balances, setBalances] = useState<ChainBalance[]>([])
  const [dashboardData, setDashboardData] = useState({
    balance: 0,
    transactions: [],
    grants: []
  })
  const [activeTab, setActiveTab] = useState("balances")

  // Initialize the Optimism blockchain service
  const optimismService = new OptimismBlockchainService()

  // Load balances when the wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      loadBalances(address)
      loadDashboardData(address)
    } else {
      setBalances([])
      setDashboardData({
        balance: 0,
        transactions: [],
        grants: []
      })
    }
  }, [isConnected, address])

  // Load balances from multiple chains
  const loadBalances = async (walletAddress: string) => {
    setIsLoading(true)
    try {
      const chainBalances = await optimismService.getAggregatedBalances(walletAddress)
      setBalances(chainBalances)
    } catch (error) {
      console.error("Error loading balances:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load dashboard data
  const loadDashboardData = async (walletAddress: string) => {
    try {
      // This would typically come from an API or blockchain service
      // For now, we'll use mock data
      setDashboardData({
        balance: balances.reduce((sum, balance) => sum + parseFloat(balance.balance) * 2000, 0), // Convert ETH to USD at $2000/ETH
        transactions: [
          {
            id: 1,
            type: "Deposit",
            amount: 500,
            from: "0x1234...5678",
            date: "2023-02-15"
          },
          {
            id: 2,
            type: "Withdrawal",
            amount: 200,
            to: "0x8765...4321",
            date: "2023-02-10"
          }
        ],
        grants: [
          {
            id: 1,
            name: "Artist Grant #1",
            amount: 1000,
            status: "Approved"
          },
          {
            id: 2,
            name: "Community Fund",
            amount: 500,
            status: "Pending"
          }
        ]
      })
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    }
  }

  // Handle wallet connection
  const handleConnect = async (walletType: string) => {
    try {
      await connect()
    } catch (error) {
      console.error(`Error connecting ${walletType} wallet:`, error)
    }
  }

  // Handle token bridging
  const handleBridgeTokens = async (fromChain: string, toChain: string, amount: string, address: string) => {
    try {
      // Call the appropriate bridge function based on the chains
      if (fromChain === "optimism" && toChain === "base") {
        await optimismService.bridgeETH(address, amount)
      } else {
        console.log(`Bridging ${amount} from ${fromChain} to ${toChain} at address ${address}`)
      }
    } catch (error) {
      console.error("Error bridging tokens:", error)
      throw error
    }
  }

  // Handle withdrawal
  const handleWithdraw = async (amount: string, address: string) => {
    try {
      await optimismService.initiateWithdrawal(address, amount)
    } catch (error) {
      console.error("Error withdrawing:", error)
      throw error
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 lowercase">multi-chain wallet</h1>

      {!isConnected ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <WalletConnection onConnect={handleConnect} />
          </div>
          <div>
            <img 
              src="/images/wallet-illustration.svg" 
              alt="Wallet Illustration" 
              className="w-full h-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>
          
          <TabsContent value="balances" className="mt-6">
            <BalanceAggregator 
              balances={balances} 
              isLoading={isLoading} 
              onBridgeTokens={handleBridgeTokens}
              onWithdraw={handleWithdraw}
            />
          </TabsContent>
          
          <TabsContent value="dashboard" className="mt-6">
            <WalletDashboard data={dashboardData} />
          </TabsContent>
          
          <TabsContent value="withdraw" className="mt-6">
            <WithdrawalInterface 
              balance={dashboardData.balance} 
              onWithdraw={handleWithdraw}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
} 