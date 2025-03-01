"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Check, ChevronRight, FileText, Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SimulatedAutoApplyProps {
  opportunityId?: string
  artistId?: string
}

export function SimulatedAutoApply({ 
  opportunityId = "opp_234567", 
  artistId = "artist_123456" 
}: SimulatedAutoApplyProps) {
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const [dialogStep, setDialogStep] = useState(0)
  const [applicationId, setApplicationId] = useState("")
  const [isCompleted, setIsCompleted] = useState(false)
  const { toast } = useToast()

  // Mock data
  const artistData = {
    name: "Sonia Artiste",
    wallet: "0x3F8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C",
    verified: true
  }

  const opportunityData = {
    title: "Creative Expression Fund",
    amount: "1.5 ETH",
    deadline: "June 30, 2026",
    requirements: [
      "Must be a verified artist",
      "Must have completed at least 2 projects",
      "Must submit a proposal with budget breakdown"
    ]
  }

  const steps = [
    { title: "Check Eligibility", description: "Verify artist meets all requirements" },
    { title: "Generate Proposal", description: "AI generates proposal based on artist profile" },
    { title: "Review Requirements", description: "Ensure proposal meets all grant requirements" },
    { title: "Prepare Application", description: "Format application for submission" },
    { title: "Submit Application", description: "Submit application to grant provider" },
    { title: "Verify Submission", description: "Confirm application was received" }
  ]

  const dialogSteps = [
    { title: "Checking Eligibility", description: "Verifying artist credentials and requirements..." },
    { title: "Generating Proposal", description: "AI creating personalized proposal based on artist profile..." },
    { title: "Reviewing Requirements", description: "Ensuring proposal meets all grant criteria..." },
    { title: "Preparing Application", description: "Formatting application for submission..." },
    { title: "Submitting Application", description: "Sending application to grant provider..." },
    { title: "Verifying Submission", description: "Confirming application was successfully received..." },
    { title: "Application Complete", description: "Your application has been successfully submitted!" }
  ]

  const handleStartSimulation = () => {
    setIsSimulating(true)
    setCurrentStep(0)
    setIsCompleted(false)
    setApplicationId("")
    
    // Simulate the process step by step
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(interval)
          setIsSimulating(false)
          setIsCompleted(true)
          setApplicationId("APP-" + Math.random().toString(16).substring(2, 8).toUpperCase())
          
          toast({
            title: "Auto-Apply Complete",
            description: "Successfully applied to Creative Expression Fund",
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
          <span>Auto-Apply for Grant Opportunity</span>
          {isCompleted && <Badge variant="success" className="bg-green-600">Completed</Badge>}
        </CardTitle>
        <CardDescription>
          Automatically apply for grant opportunities using AI-generated proposals
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Opportunity Details</TabsTrigger>
              <TabsTrigger value="process">Application Process</TabsTrigger>
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
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Opportunity</h3>
                  <p className="font-medium">{opportunityData.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Amount: {opportunityData.amount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Deadline: {opportunityData.deadline}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Requirements</h3>
                <ul className="space-y-1">
                  {opportunityData.requirements.map((req, index) => (
                    <li key={index} className="text-xs flex items-start">
                      <Check className="h-3 w-3 mr-2 mt-0.5 text-green-500" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {isCompleted && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-medium flex items-center text-green-800 dark:text-green-400">
                    <Check className="h-4 w-4 mr-2" />
                    Application Submitted
                  </h3>
                  <p className="text-xs mt-1 text-green-700 dark:text-green-500">
                    Application ID: <span className="font-mono">{applicationId}</span>
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
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800" 
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
                          <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center">
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
                            ? "text-indigo-700 dark:text-indigo-400" 
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
              <FileText className="mr-2 h-4 w-4" />
              Apply Again
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Auto-Apply
            </>
          )}
        </Button>
      </CardFooter>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Auto-Apply Process</DialogTitle>
            <DialogDescription>
              Detailed view of the AI-powered grant application process
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {dialogSteps.map((step, index) => (
              <div 
                key={index} 
                className={`flex items-start p-3 rounded-lg border ${
                  dialogStep === index 
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800" 
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
                    <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center">
                      <Loader2 className="h-3 w-3 text-white animate-spin" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                  )}
                </div>
                <div>
                  <h3 className={`text-sm font-medium ${
                    dialogStep === index 
                      ? "text-indigo-700 dark:text-indigo-400" 
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
                      <span className="text-gray-500">// AI generating proposal</span>
                      <br />
                      const proposal = await ai.generateContent({"{"}
                      <br />
                      &nbsp;&nbsp;artistId: <span className="text-blue-600 dark:text-blue-400">"{artistId}"</span>,
                      <br />
                      &nbsp;&nbsp;opportunityId: <span className="text-green-600 dark:text-green-400">"{opportunityId}"</span>,
                      <br />
                      &nbsp;&nbsp;template: <span className="text-purple-600 dark:text-purple-400">"grant_proposal"</span>
                      <br />
                      {"}"});
                    </div>
                  )}
                  
                  {dialogStep === index && index === 4 && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                      <span className="text-gray-500">// Submit application to contract</span>
                      <br />
                      const tx = await contract.submitApplication(
                      <br />
                      &nbsp;&nbsp;<span className="text-blue-600 dark:text-blue-400">"{applicationId || "APP-" + Math.random().toString(16).substring(2, 8).toUpperCase()}"</span>,
                      <br />
                      &nbsp;&nbsp;<span className="text-green-600 dark:text-green-400">"ipfs://QmProposalHash..."</span>,
                      <br />
                      &nbsp;&nbsp;<span className="text-purple-600 dark:text-purple-400">"{opportunityId}"</span>
                      <br />
                      );
                    </div>
                  )}
                  
                  {dialogStep === index && index === 6 && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                      <span className="text-gray-500">// Application submitted successfully</span>
                      <br />
                      ApplicationSubmitted(
                      <br />
                      &nbsp;&nbsp;applicationId: <span className="text-blue-600 dark:text-blue-400">"{applicationId || "APP-" + Math.random().toString(16).substring(2, 8).toUpperCase()}"</span>,
                      <br />
                      &nbsp;&nbsp;grantId: <span className="text-green-600 dark:text-green-400">"{opportunityId}"</span>,
                      <br />
                      &nbsp;&nbsp;artist: <span className="text-purple-600 dark:text-purple-400">"{artistData.wallet}"</span>
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