import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Check, ChevronRight, Code, Loader2, Wallet } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SimulatedZkSyncInteractionProps {
  artistId?: string
}

export function SimulatedZkSyncInteraction({ 
  artistId = "artist_123456"
}: SimulatedZkSyncInteractionProps) {
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
    sessionKey: "0x5A8CB69d9c0ED01923F11c829BaE4D9a4CB6c123"
  }

  const contractData = {
    name: "ZkSyncArtistManager",
    address: "0x7F8CB69d9c0ED01923F11c829BaE4D9a4CB6c456",
    network: "zkSync Era Testnet"
  }

  const steps = [
    { title: "Initialize zkSync Provider", description: "Connect to zkSync Era network" },
    { title: "Load Smart Contract", description: "Load ZkSyncArtistManager contract" },
    { title: "Prepare Transaction", description: "Prepare transaction data for contract call" },
    { title: "Sign Transaction", description: "Sign transaction with session key" },
    { title: "Submit Transaction", description: "Submit transaction to zkSync network" },
    { title: "Verify Transaction", description: "Confirm successful transaction on zkSync" }
  ]

  const dialogSteps = [
    { title: "Initializing Provider", description: "Connecting to zkSync Era Testnet..." },
    { title: "Loading Contract", description: "Loading ZkSyncArtistManager contract..." },
    { title: "Preparing Transaction", description: "Preparing updateArtistProfile transaction..." },
    { title: "Signing Transaction", description: "Signing transaction with session key..." },
    { title: "Submitting Transaction", description: "Submitting transaction to zkSync network..." },
    { title: "Verifying Transaction", description: "Confirming transaction on zkSync network..." },
    { title: "Transaction Complete", description: "Artist profile successfully updated on zkSync!" }
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
            title: "zkSync Transaction Complete",
            description: "Successfully updated artist profile on zkSync",
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
          <span>zkSync Smart Contract Interaction</span>
          {isCompleted && <Badge variant="success" className="bg-green-600">Completed</Badge>}
        </CardTitle>
        <CardDescription>
          Simulate interaction with ZkSyncArtistManager smart contract
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Contract Details</TabsTrigger>
              <TabsTrigger value="process">Process</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Artist</h3>
                  <p className="font-medium">{artistData.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Wallet: {artistData.wallet}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Session Key: {artistData.sessionKey}</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contract</h3>
                  <p className="font-medium">{contractData.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Address: {contractData.address}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Network: {contractData.network}</p>
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
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800" 
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
                          <div className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center">
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
                            ? "text-purple-700 dark:text-purple-400" 
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
              <Code className="mr-2 h-4 w-4" />
              Interact Again
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Update Profile
            </>
          )}
        </Button>
      </CardFooter>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>zkSync Contract Interaction</DialogTitle>
            <DialogDescription>
              Detailed view of the zkSync smart contract interaction process
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {dialogSteps.map((step, index) => (
              <div 
                key={index} 
                className={`flex items-start p-3 rounded-lg border ${
                  dialogStep === index 
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800" 
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
                    <div className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <Loader2 className="h-3 w-3 text-white animate-spin" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                  )}
                </div>
                <div>
                  <h3 className={`text-sm font-medium ${
                    dialogStep === index 
                      ? "text-purple-700 dark:text-purple-400" 
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
                      <span className="text-gray-500">// Load contract with ethers.js</span>
                      <br />
                      const contract = new ethers.Contract(
                      <br />
                      &nbsp;&nbsp;<span className="text-green-600 dark:text-green-400">"{contractData.address}"</span>,
                      <br />
                      &nbsp;&nbsp;ZkSyncArtistManagerABI,
                      <br />
                      &nbsp;&nbsp;provider
                      <br />
                      );
                    </div>
                  )}
                  
                  {dialogStep === index && index === 2 && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                      <span className="text-gray-500">// Prepare transaction data</span>
                      <br />
                      const data = contract.interface.encodeFunctionData(
                      <br />
                      &nbsp;&nbsp;<span className="text-green-600 dark:text-green-400">"updateArtistProfile"</span>,
                      <br />
                      &nbsp;&nbsp;[
                      <br />
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-600 dark:text-blue-400">"{artistId}"</span>,
                      <br />
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-600 dark:text-blue-400">"ipfs://Qm..."</span>, <span className="text-gray-500">// Profile metadata</span>
                      <br />
                      &nbsp;&nbsp;&nbsp;&nbsp;true <span className="text-gray-500">// isActive</span>
                      <br />
                      &nbsp;&nbsp;]
                      <br />
                      );
                    </div>
                  )}
                  
                  {dialogStep === index && index === 3 && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                      <span className="text-gray-500">// Sign transaction with session key</span>
                      <br />
                      const tx = {"{"} 
                      <br />
                      &nbsp;&nbsp;to: <span className="text-green-600 dark:text-green-400">"{contractData.address}"</span>,
                      <br />
                      &nbsp;&nbsp;data: data,
                      <br />
                      &nbsp;&nbsp;gasLimit: <span className="text-blue-600 dark:text-blue-400">"500000"</span>
                      <br />
                      {"}"};
                      <br />
                      <br />
                      const signedTx = await wallet.signTransaction(tx);
                    </div>
                  )}
                  
                  {dialogStep === index && index === 6 && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                      <span className="text-gray-500">// Transaction Hash</span>
                      <br />
                      {transactionHash || "0x3f7c8d9e1a2b5c6d7e8f9a0b1c2d3e4f5a6b7c8d"}
                      <br />
                      <br />
                      <span className="text-gray-500">// Event emitted</span>
                      <br />
                      ArtistProfileUpdated(
                      <br />
                      &nbsp;&nbsp;artistId: <span className="text-blue-600 dark:text-blue-400">"{artistId}"</span>,
                      <br />
                      &nbsp;&nbsp;updatedBy: <span className="text-green-600 dark:text-green-400">"{artistData.sessionKey}"</span>
                      <br />
                      )
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