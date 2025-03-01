"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Check, ChevronRight, ChevronsUpDown, Coins, Loader2, Send, AlertCircle, ArrowRight, Wallet } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SimulatedTokenTransferProps {
  defaultChain?: string
}

export function SimulatedTokenTransfer({ 
  defaultChain = "base" 
}: SimulatedTokenTransferProps) {
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const [dialogStep, setDialogStep] = useState(0)
  const [transactionHash, setTransactionHash] = useState("")
  const [isCompleted, setIsCompleted] = useState(false)
  const [selectedChain, setSelectedChain] = useState(defaultChain)
  const [selectedToken, setSelectedToken] = useState("eth")
  const [amount, setAmount] = useState("0.1")
  const [recipientAddress, setRecipientAddress] = useState("0x742d35Cc6634C0532925a3b844Bc454e4438f44e")
  const { toast } = useToast()
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Mock data
  const chains = [
    { id: "base", name: "Base", icon: "🔵", balance: "1.2 ETH", usdValue: "$3,600" },
    { id: "optimism", name: "Optimism", icon: "🔴", balance: "2.0 ETH", usdValue: "$6,000" },
    { id: "zksync", name: "zkSync", icon: "💜", balance: "0.8 ETH", usdValue: "$2,400" },
    { id: "ethereum", name: "Ethereum", icon: "⚪", balance: "0.5 ETH", usdValue: "$1,500" }
  ]

  const tokens = [
    { id: "eth", name: "ETH", icon: "Ξ", balance: getChainBalance(), usdValue: getChainUsdValue() },
    { id: "op", name: "OP", icon: "🔴", balance: "50 OP", usdValue: "$125" },
    { id: "usdc", name: "USDC", icon: "💲", balance: "500 USDC", usdValue: "$500" },
    { id: "dai", name: "DAI", icon: "◈", balance: "300 DAI", usdValue: "$300" }
  ]

  function getChainBalance() {
    return chains.find(chain => chain.id === selectedChain)?.balance || "0 ETH"
  }

  function getChainUsdValue() {
    return chains.find(chain => chain.id === selectedChain)?.usdValue || "$0"
  }

  const steps = [
    "Validating input data",
    "Connecting to wallet",
    "Preparing transaction",
    "Signing transaction",
    "Submitting transaction",
    "Confirming transaction"
  ]

  const dialogSteps = [
    {
      title: "Validating Input Data",
      description: "Checking recipient address format and ensuring sufficient balance for the transfer.",
      details: [
        "Validating recipient address: 0x...",
        "Checking balance for selected token",
        "Validating transaction amount"
      ]
    },
    {
      title: "Connecting to Wallet",
      description: "Establishing secure connection to your wallet for transaction authorization.",
      details: [
        "Initializing wallet connection",
        "Requesting account access",
        "Connection established"
      ]
    },
    {
      title: "Preparing Transaction",
      description: "Building transaction payload with recipient address, amount, and gas parameters.",
      details: [
        "Setting recipient address",
        "Setting transfer amount",
        `Calculating gas fees for ${selectedToken.toUpperCase()} transfer`,
        "Building transaction payload"
      ]
    },
    {
      title: "Signing Transaction",
      description: "Requesting signature from your wallet to authorize the transaction.",
      details: [
        "Generating transaction hash",
        "Requesting wallet signature",
        "Transaction signed successfully"
      ]
    },
    {
      title: "Submitting Transaction",
      description: "Sending signed transaction to the blockchain network.",
      details: [
        "Connecting to network provider",
        "Submitting signed transaction",
        "Transaction submitted to mempool"
      ]
    },
    {
      title: "Confirming Transaction",
      description: "Waiting for transaction confirmation on the blockchain.",
      details: [
        "Transaction in pending state",
        "Waiting for block confirmation",
        "Transaction confirmed"
      ]
    }
  ]

  function getChainName() {
    return chains.find(chain => chain.id === selectedChain)?.name || "Unknown Chain"
  }

  function getTokenName() {
    return tokens.find(token => token.id === selectedToken)?.name || "Unknown Token"
  }

  function handleStartSimulation() {
    // Validate recipient address
    if (!recipientAddress || !recipientAddress.startsWith("0x") || recipientAddress.length !== 42) {
      toast({
        title: "Invalid recipient address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive"
      })
      return
    }

    setIsSimulating(true)
    setCurrentStep(1)
    setIsCompleted(false)

    // Simulate the process with delays
    timerRef.current = setTimeout(() => {
      setCurrentStep(2)
      timerRef.current = setTimeout(() => {
        setCurrentStep(3)
        timerRef.current = setTimeout(() => {
          setCurrentStep(4)
          timerRef.current = setTimeout(() => {
            setCurrentStep(5)
            timerRef.current = setTimeout(() => {
              setCurrentStep(6)
              setShowDialog(true)
              setDialogStep(1)
              // Generate a fake transaction hash
              setTransactionHash("0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""))
            }, 1500)
          }, 1500)
        }, 1500)
      }, 1500)
    }, 1500)
  }

  const handleShowDetailedProcess = () => {
    setShowDialog(true)
    setDialogStep(0)
    
    // Simulate the detailed process step by step
    const interval = setInterval(() => {
      setDialogStep(prev => {
        if (prev >= dialogSteps.length - 1) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 2000)
  }

  const handleReset = () => {
    setIsSimulating(false)
    setCurrentStep(0)
    setIsCompleted(false)
    setTransactionHash("")
    setRecipientAddress("")
    setAmount("0.1")
    setSelectedToken("eth")
    setSelectedChain("base")
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Send Tokens</span>
          {isCompleted && <Badge variant="success" className="bg-green-600">Completed</Badge>}
        </CardTitle>
        <CardDescription>
          Send ETH or SuperchainERC20 tokens to any address
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <Tabs defaultValue="send" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="send">Send Tokens</TabsTrigger>
              <TabsTrigger value="process">Process</TabsTrigger>
            </TabsList>
            
            <TabsContent value="send" className="space-y-4">
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="chain">Network</Label>
                  <Select 
                    value={selectedChain} 
                    onValueChange={setSelectedChain}
                    disabled={isSimulating}
                  >
                    <SelectTrigger id="chain" className="w-full">
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent>
                      {chains.map(chain => (
                        <SelectItem key={chain.id} value={chain.id}>
                          <div className="flex items-center">
                            <span className="mr-2">{chain.icon}</span>
                            <span>{chain.name}</span>
                            <span className="ml-auto text-xs text-gray-500">{chain.balance}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="token">Token</Label>
                  <Select 
                    value={selectedToken} 
                    onValueChange={setSelectedToken}
                    disabled={isSimulating}
                  >
                    <SelectTrigger id="token" className="w-full">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens.map(token => (
                        <SelectItem key={token.id} value={token.id}>
                          <div className="flex items-center">
                            <span className="mr-2">{token.icon}</span>
                            <span>{token.name}</span>
                            <span className="ml-auto text-xs text-gray-500">{token.balance}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pr-16"
                      disabled={isSimulating}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-sm text-gray-500">
                        {selectedToken.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Available: {tokens.find(t => t.id === selectedToken)?.balance}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address</Label>
                  <Input
                    id="recipient"
                    placeholder="0x..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    disabled={isSimulating}
                  />
                </div>
              </div>
              
              {isCompleted && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-medium flex items-center text-green-800 dark:text-green-400">
                    <Check className="h-4 w-4 mr-2" />
                    Transaction Successful
                  </h3>
                  <p className="text-xs mt-1 text-green-700 dark:text-green-500">
                    Transaction Hash: <span className="font-mono">{transactionHash}</span>
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="process" className="space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start p-3 rounded-lg border ${
                        currentStep === index 
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800" 
                          : currentStep > index 
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-800" 
                            : "border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      <div className="mr-3 mt-0.5">
                        {currentStep > index ? (
                          <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        ) : currentStep === index ? (
                          <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center">
                            {isSimulating ? (
                              <Loader2 className="h-3 w-3 text-white animate-spin" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-white" />
                            )}
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                        )}
                      </div>
                      <div>
                        <h3 className={`text-sm font-medium ${
                          currentStep === index 
                            ? "text-orange-700 dark:text-orange-400" 
                            : currentStep > index 
                              ? "text-green-700 dark:text-green-400" 
                              : "text-gray-700 dark:text-gray-300"
                        }`}>
                          {step}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {dialogSteps[index].description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleShowDetailedProcess}
          disabled={isSimulating || !isCompleted}
        >
          View Transaction Details
        </Button>
        
        <Button 
          onClick={handleStartSimulation} 
          disabled={isSimulating}
          className="flex items-center"
        >
          {isSimulating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isCompleted ? (
            <>
              <Coins className="mr-2 h-4 w-4" />
              Send Again
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send {amount} {selectedToken.toUpperCase()}
            </>
          )}
        </Button>
      </CardFooter>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Token Transfer Process</DialogTitle>
            <DialogDescription>
              Detailed view of the token transfer process on {getChainName()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {dialogSteps.map((step, index) => (
              <div 
                key={index} 
                className={`flex items-start p-3 rounded-lg border ${
                  dialogStep === index 
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800" 
                    : dialogStep > index 
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-800" 
                      : "border-gray-200 dark:border-gray-800 opacity-50"
                }`}
              >
                <div className="mr-3 mt-0.5">
                  {dialogStep > index ? (
                    <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : dialogStep === index ? (
                    <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center">
                      <Loader2 className="h-3 w-3 text-white animate-spin" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                  )}
                </div>
                <div>
                  <h3 className={`text-sm font-medium ${
                    dialogStep === index 
                      ? "text-orange-700 dark:text-orange-400" 
                      : dialogStep > index 
                        ? "text-green-700 dark:text-green-400" 
                        : "text-gray-700 dark:text-gray-300"
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {step.description}
                  </p>
                  
                  {dialogStep === index && index === 1 && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                      <span className="text-gray-500">// Prepare transaction data</span>
                      <br />
                      const tx = {"{"} 
                      <br />
                      &nbsp;&nbsp;to: <span className="text-green-600 dark:text-green-400">"{recipientAddress}"</span>,
                      <br />
                      &nbsp;&nbsp;value: <span className="text-blue-600 dark:text-blue-400">ethers.utils.parseEther("{amount}")</span>,
                      <br />
                      &nbsp;&nbsp;chainId: <span className="text-purple-600 dark:text-purple-400">getChainId("{selectedChain}")</span>
                      <br />
                      {"}"};
                    </div>
                  )}
                  
                  {dialogStep === index && index === 2 && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                      <span className="text-gray-500">// Check balance</span>
                      <br />
                      const balance = await provider.getBalance(wallet.address);
                      <br />
                      <br />
                      <span className="text-gray-500">// Validate sufficient funds</span>
                      <br />
                      if (balance.lt(ethers.utils.parseEther(<span className="text-blue-600 dark:text-blue-400">"{amount}"</span>))) {"{"} 
                      <br />
                      &nbsp;&nbsp;throw new Error(<span className="text-green-600 dark:text-green-400">"Insufficient funds"</span>);
                      <br />
                      {"}"}
                    </div>
                  )}
                  
                  {dialogStep === index && index === 6 && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                      <span className="text-gray-500">// Transaction Hash</span>
                      <br />
                      {transactionHash || "0x3f7c8d9e1a2b5c6d7e8f9a0b1c2d3e4f5a6b7c8d"}
                      <br />
                      <br />
                      <span className="text-gray-500">// Transaction Details</span>
                      <br />
                      {"{"} 
                      <br />
                      &nbsp;&nbsp;from: <span className="text-green-600 dark:text-green-400">"0x3F8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C"</span>,
                      <br />
                      &nbsp;&nbsp;to: <span className="text-green-600 dark:text-green-400">"{recipientAddress}"</span>,
                      <br />
                      &nbsp;&nbsp;value: <span className="text-blue-600 dark:text-blue-400">"{amount} {selectedToken.toUpperCase()}"</span>,
                      <br />
                      &nbsp;&nbsp;network: <span className="text-purple-600 dark:text-purple-400">"{getChainName()}"</span>,
                      <br />
                      &nbsp;&nbsp;status: <span className="text-green-600 dark:text-green-400">"Success"</span>
                      <br />
                      {"}"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 