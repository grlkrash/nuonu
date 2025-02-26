"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Sparkles, ChevronRight, ChevronLeft, Check, AlertCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

// Form schema
const proposalSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(50, "Description must be at least 50 characters").max(1000, "Description must be less than 1000 characters"),
  category: z.string().min(1, "Please select a category"),
  fundingAmount: z.string().min(1, "Please enter a funding amount"),
  timeline: z.string().min(1, "Please enter a timeline"),
  deliverables: z.string().min(20, "Deliverables must be at least 20 characters"),
  tags: z.string().optional(),
  daoName: z.string().min(1, "Please select a DAO"),
})

type ProposalFormValues = z.infer<typeof proposalSchema>

function ProposalGenerator() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null)
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
  
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      fundingAmount: "",
      timeline: "",
      deliverables: "",
      tags: "",
      daoName: "",
    },
  })

  const onSubmit = async (data: ProposalFormValues) => {
    setIsSubmitting(true)
    
    try {
      // In a real implementation, this would submit to an API
      console.log("Submitting proposal:", data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIsSuccess(true)
    } catch (error) {
      console.error("Error submitting proposal:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateAiSuggestions = async () => {
    setIsGeneratingSuggestions(true)
    setAiSuggestions(null)
    
    try {
      // In a real implementation, this would call an AI service
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const formData = form.getValues()
      
      if (!formData.title || !formData.description) {
        return
      }
      
      setAiSuggestions(
        `Based on your proposal, here are some suggestions:
        
1. Consider adding more specific milestones to your timeline
2. Your funding request of ${formData.fundingAmount || "$X,XXX"} seems appropriate for this scope
3. You might want to add tags like "Music", "Community", and "Education"
4. MusicDAO and ArtistCollective would be good matches for this proposal
        
Would you like me to help refine your proposal description?`
      )
    } catch (error) {
      console.error("Error generating AI suggestions:", error)
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }

  const nextStep = () => {
    if (step === 1) {
      const { title, description, category } = form.getValues()
      if (!title || !description || !category) {
        form.trigger(["title", "description", "category"])
        return
      }
    }
    
    if (step === 2) {
      const { fundingAmount, timeline, deliverables } = form.getValues()
      if (!fundingAmount || !timeline || !deliverables) {
        form.trigger(["fundingAmount", "timeline", "deliverables"])
        return
      }
    }
    
    setStep(prev => Math.min(prev + 1, 3))
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  const applyAiSuggestion = (suggestion: string) => {
    // This is a simplified example - in a real app, you'd have more sophisticated suggestion handling
    form.setValue("tags", "Music, Community, Education")
    form.setValue("daoName", "MusicDAO")
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Proposal Submitted!</CardTitle>
          <CardDescription className="text-center">
            Your proposal has been successfully submitted to the DAO
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="rounded-full bg-green-100 p-3 mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-medium mb-2">{form.getValues().title}</h3>
          <p className="text-gray-500 text-center mb-6">
            Your proposal has been submitted to {form.getValues().daoName} and is now pending review.
            You'll receive notifications about its status.
          </p>
          <div className="flex gap-2 mb-6">
            <Badge>{form.getValues().category}</Badge>
            {form.getValues().tags?.split(",").map((tag, i) => (
              <Badge key={i} variant="outline">{tag.trim()}</Badge>
            ))}
          </div>
          <Button onClick={() => window.location.reload()}>Create Another Proposal</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Create a DAO Proposal</h2>
        <p className="text-gray-600">
          Submit your ideas for funding and collaboration with DAOs
        </p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          {[1, 2, 3].map((stepNumber) => (
            <div 
              key={stepNumber}
              className={`flex items-center ${step >= stepNumber ? "text-primary" : "text-gray-400"}`}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                  ${step >= stepNumber ? "border-primary bg-primary text-white" : "border-gray-300"}`}
              >
                {stepNumber}
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">
                {stepNumber === 1 ? "Basic Info" : stepNumber === 2 ? "Details" : "Review & Submit"}
              </span>
              {stepNumber < 3 && (
                <div className={`w-12 sm:w-24 h-1 mx-2 ${step > stepNumber ? "bg-primary" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Start by providing the core details of your proposal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposal Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a clear, concise title" {...field} />
                      </FormControl>
                      <FormDescription>
                        A good title clearly communicates the purpose of your proposal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your proposal in detail" 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Explain what you want to achieve and why it matters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Events">Events</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Production">Production</SelectItem>
                          <SelectItem value="Exhibition">Exhibition</SelectItem>
                          <SelectItem value="Community">Community</SelectItem>
                          <SelectItem value="Research">Research</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the category that best fits your proposal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="button" onClick={nextStep}>
                  Next Step <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Proposal Details</CardTitle>
                <CardDescription>
                  Provide specific details about funding, timeline, and deliverables
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="fundingAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funding Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 5,000 USDC" {...field} />
                      </FormControl>
                      <FormDescription>
                        Specify the amount of funding you're requesting
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="timeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeline</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 3 months (June - August 2023)" {...field} />
                      </FormControl>
                      <FormDescription>
                        When will the project start and end?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="deliverables"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deliverables</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List the specific outcomes and deliverables" 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        What specific outcomes will you produce?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button type="button" onClick={nextStep}>
                  Next Step <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review & Submit</CardTitle>
                  <CardDescription>
                    Review your proposal and make any final adjustments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Title</h4>
                      <p className="text-base">{form.getValues().title || "Not provided"}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
                      <p className="text-base">{form.getValues().category || "Not selected"}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Funding Amount</h4>
                      <p className="text-base">{form.getValues().fundingAmount || "Not provided"}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Timeline</h4>
                      <p className="text-base">{form.getValues().timeline || "Not provided"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                    <p className="text-base whitespace-pre-line">{form.getValues().description || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Deliverables</h4>
                    <p className="text-base whitespace-pre-line">{form.getValues().deliverables || "Not provided"}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-medium">AI Assistance</h4>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={generateAiSuggestions}
                        disabled={isGeneratingSuggestions}
                      >
                        {isGeneratingSuggestions ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Get AI Suggestions
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {aiSuggestions && (
                      <Alert>
                        <Sparkles className="h-4 w-4" />
                        <AlertTitle>AI Suggestions</AlertTitle>
                        <AlertDescription className="whitespace-pre-line">
                          {aiSuggestions}
                          <div className="mt-4">
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline"
                              onClick={() => applyAiSuggestion(aiSuggestions)}
                            >
                              Apply Suggestions
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags (comma separated)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Music, Community, Education" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="daoName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select DAO</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a DAO" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MusicDAO">MusicDAO</SelectItem>
                                <SelectItem value="ArtistCollective">ArtistCollective</SelectItem>
                                <SelectItem value="NFTCreators">NFTCreators</SelectItem>
                                <SelectItem value="VideoCollective">VideoCollective</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Proposal"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}

export { ProposalGenerator } 