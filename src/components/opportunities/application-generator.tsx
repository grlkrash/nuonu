'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Check, Copy, Download, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useUser } from '@/lib/auth-hooks'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface ApplicationGeneratorProps {
  opportunityId: string
  opportunityTitle: string
}

export function ApplicationGenerator({ opportunityId, opportunityTitle }: ApplicationGeneratorProps) {
  const { toast } = useToast()
  const { user, loading } = useUser()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingExternal, setIsSubmittingExternal] = useState(false)
  const [opportunityData, setOpportunityData] = useState<{
    external_url?: string | null
  } | null>(null)
  const [applicationContent, setApplicationContent] = useState<{
    artistStatement: string
    projectDescription: string
    budget: string
    timeline: string
    impactStatement: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState('artistStatement')
  const [editedContent, setEditedContent] = useState<{
    artistStatement: string
    projectDescription: string
    budget: string
    timeline: string
    impactStatement: string
  } | null>(null)
  const [copied, setCopied] = useState<{
    [key: string]: boolean
  }>({
    artistStatement: false,
    projectDescription: false,
    budget: false,
    timeline: false,
    impactStatement: false
  })

  const generateApplication = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to generate an application.',
        variant: 'destructive'
      })
      return
    }

    setIsGenerating(true)

    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) throw profileError

      // Fetch opportunity details
      const { data: opportunity, error: opportunityError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single()

      if (opportunityError) throw opportunityError
      
      // Store opportunity data for later use
      setOpportunityData(opportunity)

      // Call AI agent to generate application
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_application',
          profile,
          opportunity
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate application')
      }

      const data = await response.json()
      
      if (data.content) {
        setApplicationContent(data.content)
        setEditedContent(data.content)
      }
    } catch (error) {
      console.error('Error generating application:', error)
      toast({
        title: 'Generation Failed',
        description: 'We couldn\'t generate your application. Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (field: string) => {
    const content = editedContent?.[field as keyof typeof editedContent]
    navigator.clipboard.writeText(content)
    
    setCopied({
      ...copied,
      [field]: true
    })
    
    setTimeout(() => {
      setCopied({
        ...copied,
        [field]: false
      })
    }, 2000)
    
    toast({
      title: 'Copied to Clipboard',
      description: `The ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} has been copied to your clipboard.`,
      variant: 'default'
    })
  }

  const handleSubmitApplication = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to submit an application.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Combine all sections into a single proposal
      const proposal = `
# Artist Statement
${editedContent?.artistStatement}

# Project Description
${editedContent?.projectDescription}

# Budget
${editedContent?.budget}

# Timeline
${editedContent?.timeline}

# Impact Statement
${editedContent?.impactStatement}
      `.trim()

      // Create a new application in the database
      const { data, error } = await supabase
        .from('applications')
        .insert({
          opportunity_id: opportunityId,
          user_id: user.id,
          message: 'Application generated with AI assistance',
          proposal,
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Application Saved',
        description: 'Your application has been saved as a draft.',
        variant: 'default'
      })
    } catch (error) {
      console.error('Error submitting application:', error)
      toast({
        title: 'Submission Failed',
        description: 'We couldn\'t save your application. Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = () => {
    // Combine all sections into a single document
    const content = `
# Application for ${opportunityTitle}

## Artist Statement
${editedContent?.artistStatement}

## Project Description
${editedContent?.projectDescription}

## Budget
${editedContent?.budget}

## Timeline
${editedContent?.timeline}

## Impact Statement
${editedContent?.impactStatement}
    `.trim()
    
    // Create a blob and download link
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `application-${opportunityId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: 'Application Downloaded',
      description: 'Your application has been downloaded as a text file.',
      variant: 'default'
    })
  }

  const handleSubmitExternalApplication = async () => {
    if (!user || !applicationContent) {
      toast({
        title: 'Error',
        description: 'Please generate an application first.',
        variant: 'destructive'
      })
      return
    }

    if (!opportunityData?.external_url) {
      toast({
        title: 'Error',
        description: 'This opportunity does not have an external URL.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmittingExternal(true)

    try {
      // Combine all sections into a single proposal
      const proposal = `
# Artist Statement
${editedContent?.artistStatement}

# Project Description
${editedContent?.projectDescription}

# Budget
${editedContent?.budget}

# Timeline
${editedContent?.timeline}

# Impact Statement
${editedContent?.impactStatement}
      `.trim()

      // Call the API to submit the external application using Browser Base
      const response = await fetch('/api/agent/external-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId: user.id,
          opportunityId,
          applicationData: {
            text: proposal,
            formFields: {
              artistStatement: editedContent?.artistStatement,
              projectDescription: editedContent?.projectDescription,
              budget: editedContent?.budget,
              timeline: editedContent?.timeline,
              impactStatement: editedContent?.impactStatement
            }
          }
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to submit external application')
      }

      toast({
        title: 'External Application Submitted',
        description: 'Your application has been submitted to the external website.',
        variant: 'default'
      })
    } catch (error) {
      console.error('Error submitting external application:', error)
      toast({
        title: 'External Submission Failed',
        description: error instanceof Error ? error.message : 'We couldn\'t submit your application to the external website. Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmittingExternal(false)
    }
  }

  // If user is not authenticated, show a message prompting them to sign in
  if (!loading && !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
            AI Application Generator
          </CardTitle>
          <CardDescription>
            Generate a customized application for this opportunity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300 mb-2">
              Create an account to use the AI Application Generator
            </h3>
            <p className="text-amber-600 dark:text-amber-400 mb-4">
              Sign up or sign in to generate a customized application for this opportunity using AI.
            </p>
            <div className="flex gap-4">
              <Link href="/signup">
                <Button>Create Account</Button>
              </Link>
              <Link href="/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
          AI Application Generator
        </CardTitle>
        <CardDescription>
          Generate a complete grant application using AI, then edit and refine it to match your voice.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!applicationContent ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-center text-gray-500 dark:text-gray-400 mb-4">
              Our AI can generate a complete application for this opportunity based on your profile.
            </p>
            <Button 
              onClick={generateApplication} 
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Application...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Application
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="artistStatement">Artist Statement</TabsTrigger>
                <TabsTrigger value="projectDescription">Project</TabsTrigger>
                <TabsTrigger value="budget">Budget</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="impactStatement">Impact</TabsTrigger>
              </TabsList>
              
              <TabsContent value="artistStatement" className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Artist Statement</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy('artistStatement')}
                  >
                    {copied.artistStatement ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Textarea 
                  value={editedContent?.artistStatement} 
                  onChange={(e) => setEditedContent({...editedContent, artistStatement: e.target.value})}
                  className="min-h-[200px]"
                />
              </TabsContent>
              
              <TabsContent value="projectDescription" className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Project Description</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy('projectDescription')}
                  >
                    {copied.projectDescription ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Textarea 
                  value={editedContent?.projectDescription} 
                  onChange={(e) => setEditedContent({...editedContent, projectDescription: e.target.value})}
                  className="min-h-[200px]"
                />
              </TabsContent>
              
              <TabsContent value="budget" className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Budget</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy('budget')}
                  >
                    {copied.budget ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Textarea 
                  value={editedContent?.budget} 
                  onChange={(e) => setEditedContent({...editedContent, budget: e.target.value})}
                  className="min-h-[200px]"
                />
              </TabsContent>
              
              <TabsContent value="timeline" className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Timeline</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy('timeline')}
                  >
                    {copied.timeline ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Textarea 
                  value={editedContent?.timeline} 
                  onChange={(e) => setEditedContent({...editedContent, timeline: e.target.value})}
                  className="min-h-[200px]"
                />
              </TabsContent>
              
              <TabsContent value="impactStatement" className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Impact Statement</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy('impactStatement')}
                  >
                    {copied.impactStatement ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Textarea 
                  value={editedContent?.impactStatement} 
                  onChange={(e) => setEditedContent({...editedContent, impactStatement: e.target.value})}
                  className="min-h-[200px]"
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
      
      {applicationContent && (
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
          <div className="flex gap-2">
            {opportunityData?.external_url && (
              <Button
                onClick={handleSubmitExternalApplication}
                disabled={isSubmittingExternal}
                variant="outline"
                className="flex items-center"
              >
                {isSubmittingExternal ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting to External Site...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Submit to External Site
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={handleSubmitApplication}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Application'
              )}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
} 