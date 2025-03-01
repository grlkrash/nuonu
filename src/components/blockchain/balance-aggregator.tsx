"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ChainBalance {
  chainId: string
  chainName: string
  balance: string
  symbol: string
  usdValue: number
}

interface BalanceAggregatorProps {
  balances?: ChainBalance[]
  isLoading?: boolean
  onBridgeTokens?: (fromChain: string, toChain: string, amount: string, address: string) => Promise<void>
  onWithdraw?: (chain: string, amount: string, address: string) => Promise<void>
}

export function BalanceAggregator({ 
  balances = [], 
  isLoading = false,
  onBridgeTokens,
  onWithdraw
}: BalanceAggregatorProps) {
  const { theme } = useTheme()
  const [selectedTab, setSelectedTab] = useState("balances")
  const [fromChain, setFromChain] = useState("")
  const [toChain, setToChain] = useState("")
  const [amount, setAmount] = useState("")
  const [address, setAddress] = useState("")
  const [withdrawChain, setWithdrawChain] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawAddress, setWithdrawAddress] = useState("")

  // Calculate total USD value
  const totalUsdValue = balances.reduce((sum, balance) => sum + balance.usdValue, 0)

  // Set default chains when balances load
  useEffect(() => {
    if (balances.length > 0 && !fromChain) {
      setFromChain(balances[0].chainId)
    }
    if (balances.length > 1 && !toChain) {
      setToChain(balances[1].chainId)
    }
    if (balances.length > 0 && !withdrawChain) {
      setWithdrawChain(balances[0].chainId)
    }
  }, [balances, fromChain, toChain, withdrawChain])

  const handleBridge = async () => {
    if (onBridgeTokens) {
      try {
        await onBridgeTokens(fromChain, toChain, amount, address)
        setAmount("")
        setAddress("")
      } catch (error) {
        console.error("Bridge error:", error)
      }
    }
  }

  const handleWithdraw = async () => {
    if (onWithdraw) {
      try {
        await onWithdraw(withdrawChain, withdrawAmount, withdrawAddress)
        setWithdrawAmount("")
        setWithdrawAddress("")
      } catch (error) {
        console.error("Withdrawal error:", error)
      }
    }
  }

  const cardClass = theme === "light" ? "bg-white border-black" : "bg-black border-white"
  const textClass = theme === "light" ? "text-black" : "text-white"
  const inputClass = theme === "light" ? "bg-white text-black border-black" : "bg-black text-white border-white"
  const buttonClass = theme === "light" ? "bg-black text-white hover:bg-gray-800" : "bg-white text-black hover:bg-gray-200"

  // Get selected chain balance
  const getSelectedChainBalance = (chainId: string) => {
    const chain = balances.find(b => b.chainId === chainId)
    return chain ? chain.balance : "0"
  }

  return (
    <Card className={`${cardClass} border`}>
      <CardHeader>
        <CardTitle className={`lowercase ${textClass}`}>multi-chain wallet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 text-center">
          <div className={`text-4xl font-bold ${textClass}`}>${totalUsdValue.toFixed(2)}</div>
          <div className={`text-sm ${textClass} lowercase`}>total value across all chains</div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="balances" className="lowercase">balances</TabsTrigger>
            <TabsTrigger value="transfer" className="lowercase">transfer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="balances">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={`lowercase ${textClass}`}>network</TableHead>
                  <TableHead className={`lowercase ${textClass}`}>balance</TableHead>
                  <TableHead className={`lowercase ${textClass}`}>value (usd)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className={`text-center py-4 ${textClass}`}>
                      Loading balances...
                    </TableCell>
                  </TableRow>
                ) : balances.length > 0 ? (
                  balances.map((balance) => (
                    <TableRow key={balance.chainId}>
                      <TableCell className={`lowercase ${textClass}`}>{balance.chainName}</TableCell>
                      <TableCell className={textClass}>
                        {balance.balance} {balance.symbol}
                      </TableCell>
                      <TableCell className={textClass}>${balance.usdValue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className={`text-center py-4 ${textClass}`}>
                      No balances found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="transfer">
            <Tabs defaultValue="bridge" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bridge" className="lowercase">bridge tokens</TabsTrigger>
                <TabsTrigger value="withdraw" className="lowercase">withdraw</TabsTrigger>
              </TabsList>
              
              <TabsContent value="bridge" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="fromChain" className={`lowercase ${textClass}`}>from chain</Label>
                  <Select value={fromChain} onValueChange={setFromChain}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select chain" />
                    </SelectTrigger>
                    <SelectContent>
                      {balances.map((balance) => (
                        <SelectItem key={balance.chainId} value={balance.chainId}>
                          {balance.chainName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fromChain && (
                    <p className={`text-sm ${textClass}`}>
                      Available: {getSelectedChainBalance(fromChain)} {balances.find(b => b.chainId === fromChain)?.symbol}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="toChain" className={`lowercase ${textClass}`}>to chain</Label>
                  <Select value={toChain} onValueChange={setToChain}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select chain" />
                    </SelectTrigger>
                    <SelectContent>
                      {balances
                        .filter(balance => balance.chainId !== fromChain)
                        .map((balance) => (
                          <SelectItem key={balance.chainId} value={balance.chainId}>
                            {balance.chainName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount" className={`lowercase ${textClass}`}>amount</Label>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`lowercase ${inputClass}`}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className={`lowercase ${textClass}`}>recipient address (optional)</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="0x..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`lowercase ${inputClass}`}
                  />
                </div>
                
                <Button 
                  onClick={handleBridge} 
                  className={`w-full lowercase ${buttonClass}`}
                  disabled={!fromChain || !toChain || !amount || isLoading}
                >
                  bridge tokens
                </Button>
              </TabsContent>
              
              <TabsContent value="withdraw" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawChain" className={`lowercase ${textClass}`}>from chain</Label>
                  <Select value={withdrawChain} onValueChange={setWithdrawChain}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select chain" />
                    </SelectTrigger>
                    <SelectContent>
                      {balances.map((balance) => (
                        <SelectItem key={balance.chainId} value={balance.chainId}>
                          {balance.chainName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {withdrawChain && (
                    <p className={`text-sm ${textClass}`}>
                      Available: {getSelectedChainBalance(withdrawChain)} {balances.find(b => b.chainId === withdrawChain)?.symbol}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="withdrawAmount" className={`lowercase ${textClass}`}>amount</Label>
                  <Input
                    id="withdrawAmount"
                    type="text"
                    placeholder="0.0"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className={`lowercase ${inputClass}`}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="withdrawAddress" className={`lowercase ${textClass}`}>recipient address</Label>
                  <Input
                    id="withdrawAddress"
                    type="text"
                    placeholder="0x..."
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className={`lowercase ${inputClass}`}
                  />
                </div>
                
                <Button 
                  onClick={handleWithdraw} 
                  className={`w-full lowercase ${buttonClass}`}
                  disabled={!withdrawChain || !withdrawAmount || !withdrawAddress || isLoading}
                >
                  withdraw to l1
                </Button>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 