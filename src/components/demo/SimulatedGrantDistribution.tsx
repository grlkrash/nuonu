import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Check, ChevronRight, Coins, Loader2, Wallet } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SimulatedGrantDistributionProps {
  artistId?: string
  grantId?: string
}

export function SimulatedGrantDistribution({ 
  artistId = "artist_123456", 
  grantId = "grant_789012" 
}: SimulatedGrantDistributionProps) {
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const [dialogStep, setDialogStep] = useState(0)
  const [transactionHash, setTransactionHash] = useState("")
  const [isCompleted, setIsCompleted] = useState(false)
  const { toast } = useToast()

  // Mock data
  const artistData = {
    name: "Sonia Artiste",
    wallet: "0x3F8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C",
    verified: true
  }

  const grantData = {
    title: "Creative Expression Fund",
    amount: "1.5 ETH",
    funder: "0x7F8CB69d9c0ED01923F11c829BaE4D9a4CB6c456",
    amountUsd: "$4,500"
  }

  const steps = [
    { title: "Initialize AgentKit", description: "Connect to Base network and initialize CDP wallet" },
    { title: "Verify Artist Eligibility", description: "Check artist verification status on ArtistFundManager" },
    { title: "Prepare Grant Award", description: "Prepare transaction to award grant to artist" },
    { title: "Execute Contract Call", description: "Call awardGrant function on ArtistFundManager contract" },
    { title: "Distribute Funds", description: "Transfer funds to artist wallet" },
    { title: "Verify Transaction", description: "Confirm successful transaction on Base network" }
  ]

  const dialogSteps = [
    { title: "Initializing AgentKit", description: "Connecting to Base Sepolia testnet..." },
    { title: "Verifying Artist", description: "Checking artist verification status..." },
    { title: "Preparing Grant Award", description: "Preparing transaction data..." },
    { title: "Executing Contract Call", description: "Calling awardGrant function..." },
    { title: "Distributing Funds", description: "Transferring 1.5 ETH to artist wallet..." },
    { title: "Verifying Transaction", description: "Confirming transaction on Base network..." },
    { title: "Transaction Complete", description: "Grant successfully awarded and funds distributed!" }
  ]

  const handleStartSimulation = () => {
    setIsSimulating(true)
    setCurrentStep(0)
    setIsCompleted(false)
    setTransactionHash("")
    
    // Simulate the process step by step
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(interval)
          setIsSimulating(false)
          setIsCompleted(true)
          setTransactionHash("0x" + Math.random().toString(16).substring(2, 42))
          
          toast({
            title: "Grant Distribution Complete",
            description: "Successfully awarded grant and distributed funds to artist",
          })
          
          return prev
        }
        return prev + 1
      })
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Base AgentKit Grant Distribution</span>
          {isCompleted && <Badge variant="success" className="bg-green-600">Completed</Badge>}
        </CardTitle>
        <CardDescription>
          Simulate grant award distribution using Base AgentKit and ArtistFundManager contract
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Grant Details</TabsTrigger>
              <TabsTrigger value="process">Process</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Artist</h3>
                  <p className="font-medium">{artistData.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{artistData.wallet}</p>
                  <Badge variant="outline" className="mt-1">
                    {artistData.verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Grant</h3>
                  <p className="font-medium">{grantData.title}</p>
                  <p className="text-sm">
                    <span className="font-medium">{grantData.amount}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">({grantData.amountUsd})</span>
                  </p>
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
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800" 
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
                          <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
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
                            ? "text-blue-700 dark:text-blue-400" 
                            : currentStep > index 
                              ? "text-green-700 dark:text-green-400" 
                              : "text-gray-700 dark:text-gray-300"
                        }`}>
                          {step.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {step.description}
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
          View Detailed Process
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
              Distribute Again
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Distribute Grant
            </>
          )}
        </Button>
      </CardFooter>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Distribution Process</DialogTitle>
            <DialogDescription>
              Detailed view of the grant distribution process using Base AgentKit
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {dialogSteps.map((step, index) => (
              <div 
                key={index} 
                className={`flex items-start p-3 rounded-lg border ${
                  dialogStep === index 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800" 
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
                    <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <Loader2 className="h-3 w-3 text-white animate-spin" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                  )}
                </div>
                <div>
                  <h3 className={`text-sm font-medium ${
                    dialogStep === index 
                      ? "text-blue-700 dark:text-blue-400" 
                      : dialogStep > index 
                        ? "text-green-700 dark:text-green-400" 
                        : "text-gray-700 dark:text-gray-300"
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {step.description}
                  </p>
                  
                  {dialogStep === index && index === 3 && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                      contract.awardGrant(
                        <span className="text-green-600 dark:text-green-400">"{grantId}"</span>, 
                        <span className="text-blue-600 dark:text-blue-400">"{artistId}"</span>
                      )
                    </div>
                  )}
                  
                  {dialogStep === index && index === 4 && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                      agentKit.walletProvider.sendTransaction({"{"}
                        <br />
                        &nbsp;&nbsp;to: <span className="text-green-600 dark:text-green-400">"{artistData.wallet}"</span>,
                        <br />
                        &nbsp;&nbsp;value: <span className="text-blue-600 dark:text-blue-400">"1500000000000000000"</span> <span className="text-gray-500">// 1.5 ETH</span>
                        <br />
                      {"}"})
                    </div>
                  )}
                  
                  {dialogStep === index && index === 6 && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                      <span className="text-gray-500">// Transaction Hash</span>
                      <br />
                      {transactionHash || "0x3f7c8d9e1a2b5c6d7e8f9a0b1c2d3e4f5a6b7c8d"}
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