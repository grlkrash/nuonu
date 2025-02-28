'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface AgentKitPanelProps {
  artistId: string
}

export function AgentKitPanel({ artistId }: AgentKitPanelProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<{ balance: string; symbol: string } | null>(null)
  const [instructions, setInstructions] = useState('')
  const [amount, setAmount] = useState('')
  const [token, setToken] = useState('ETH')
  const [agentResponse, setAgentResponse] = useState<string | null>(null)

  const createWallet = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/agent/agentkit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId,
          action: 'create_wallet',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create wallet')
      }

      setWalletAddress(data.data)
      toast({
        title: 'Wallet Created',
        description: `Wallet address: ${data.data}`,
      })
      router.refresh()
    } catch (error) {
      console.error('Error creating wallet:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create wallet',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getBalance = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/agent/agentkit?artistId=${artistId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get wallet balance')
      }

      setWalletBalance(data.data)
      toast({
        title: 'Wallet Balance',
        description: `${data.data.balance} ${data.data.symbol}`,
      })
    } catch (error) {
      console.error('Error getting wallet balance:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get wallet balance',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const runAgent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/agent/agentkit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId,
          action: 'run_agent',
          instructions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run agent')
      }

      setAgentResponse(data.data)
      toast({
        title: 'Agent Run Completed',
        description: 'The agent has completed its task',
      })
      router.refresh()
    } catch (error) {
      console.error('Error running agent:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to run agent',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const distributeFunds = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/agent/agentkit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId,
          action: 'distribute_funds',
          amount,
          token,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to distribute funds')
      }

      toast({
        title: 'Funds Distributed',
        description: `Transaction hash: ${data.data.transaction_hash}`,
      })
      router.refresh()
    } catch (error) {
      console.error('Error distributing funds:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to distribute funds',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AgentKit Integration</CardTitle>
          <CardDescription>
            Manage blockchain interactions for your AI agent using AgentKit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Wallet Management</h3>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
              <Button 
                onClick={createWallet} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Wallet
              </Button>
              <Button 
                onClick={getBalance} 
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Check Balance
              </Button>
            </div>
            {walletAddress && (
              <div className="mt-2 rounded-md bg-muted p-2 text-sm">
                <p><strong>Wallet Address:</strong> {walletAddress}</p>
              </div>
            )}
            {walletBalance && (
              <div className="mt-2 rounded-md bg-muted p-2 text-sm">
                <p><strong>Balance:</strong> {walletBalance.balance} {walletBalance.symbol}</p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4">
            <h3 className="text-lg font-medium">Run Agent with AgentKit</h3>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Enter instructions for the agent..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="min-h-[100px]"
              />
              <Button 
                onClick={runAgent} 
                disabled={loading || !instructions}
                className="w-full"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Run Agent
              </Button>
            </div>
            {agentResponse && (
              <div className="mt-2 rounded-md bg-muted p-2 text-sm">
                <p><strong>Agent Response:</strong></p>
                <p className="whitespace-pre-wrap">{agentResponse}</p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4">
            <h3 className="text-lg font-medium">Distribute Funds</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <Select value={token} onValueChange={setToken}>
                  <SelectTrigger id="token">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="DAI">DAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={distributeFunds} 
              disabled={loading || !amount}
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Distribute Funds
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <p className="text-sm text-muted-foreground">
            Note: This is a simulation of AgentKit integration. In a production environment, 
            these actions would interact with real blockchain networks.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
} 