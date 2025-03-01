"use client"

import Link from 'next/link'
import { format } from 'date-fns'
import { ApplicationGenerator } from '@/components/opportunities/application-generator'
import { BlockchainApplicationForm } from '@/components/blockchain/blockchain-application-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { SimulatedAutoApply } from '@/components/demo/SimulatedAutoApply'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Globe, Clock, DollarSign, Tag } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

interface OpportunityDetailClientProps {
  opportunity: any
  timeAgo: string
  deadline: Date | null
  user: any | null
}

export default function OpportunityDetailClient({ 
  opportunity, 
  timeAgo, 
  deadline,
  user 
}: OpportunityDetailClientProps) {
  const [profileInsights, setProfileInsights] = useState<string | null>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [isApplying, setIsApplying] = useState(false)
  const [showAutoApplyDemo, setShowAutoApplyDemo] = useState(false)
  
  // Fetch profile insights when component mounts if user is logged in
  useEffect(() => {
    if (user) {
      fetchProfileInsights()
    }
  }, [user, opportunity.id])
  
  // Fetch profile insights from the agent API
  async function fetchProfileInsights() {
    try {
      setIsLoadingInsights(true)
      
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_insights',
          opportunityId: opportunity.id
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to generate insights')
      }
      
      const data = await response.json()
      
      if (data.success && data.insights) {
        setProfileInsights(data.insights)
      } else {
        throw new Error(data.message || 'Failed to generate insights')
      }
    } catch (error) {
      console.error('Error generating insights:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate profile insights',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingInsights(false)
    }
  }
  
  // Format the amount with commas if it exists
  const formattedAmount = opportunity.amount 
    ? opportunity.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : null

  // Check if opportunity is open based on status and deadline
  const isOpen = opportunity.status === 'open' && (!deadline || new Date() < deadline)
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href={user ? "/opportunities" : "/dashboard"} 
            className="text-primary hover:text-primary/80 flex items-center"
          >
            ← Back to {user ? "Opportunities" : "Dashboard"}
          </Link>
        </div>

        <div className="bg-card text-card-foreground rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between mb-6">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold mb-2">{opportunity.title}</h1>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                  {opportunity.opportunity_type === 'grant' ? 'Grant' : 
                   opportunity.opportunity_type === 'job' ? 'Job' : 'Gig'}
                </span>
                {opportunity.category && (
                  <span className="bg-secondary/10 text-secondary-foreground px-3 py-1 rounded-full text-sm">
                    {opportunity.category}
                  </span>
                )}
                {opportunity.is_remote && (
                  <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
                    Remote
                  </span>
                )}
                {opportunity.location && (
                  <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
                    {opportunity.location}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm ${
                  isOpen 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                }`}>
                  {isOpen ? "Open" : "Closed"}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Posted {timeAgo} by {opportunity.organization}
              </p>
            </div>
            
            {formattedAmount && (
              <div className="bg-accent/10 text-accent-foreground p-4 rounded-lg flex flex-col items-center justify-center">
                <span className="text-sm">Reward</span>
                <span className="text-2xl font-bold">${formattedAmount}</span>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-line">{opportunity.description}</p>
            </div>
          </div>

          {opportunity.requirements && (
            <div className="border-t border-border pt-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Requirements</h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-line">{opportunity.requirements}</p>
              </div>
            </div>
          )}

          {opportunity.eligibility && (
            <div className="border-t border-border pt-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Eligibility</h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-line">{opportunity.eligibility}</p>
              </div>
            </div>
          )}

          <div className="border-t border-border pt-6">
            <h2 className="text-xl font-semibold mb-4">About {opportunity.organization}</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-line">{opportunity.organization_description}</p>
            </div>
          </div>
        </div>

        {/* Application Actions */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Apply for this Opportunity</h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            <Button
              onClick={() => router.push(`/opportunities/${opportunity.id}/apply`)}
              className="bg-white text-black hover:bg-gray-200 rounded-xl px-6 py-3"
              disabled={isApplying}
            >
              Apply Manually
            </Button>
            
            <Button
              onClick={() => setShowAutoApplyDemo(true)}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black rounded-xl px-6 py-3"
              disabled={isApplying}
            >
              Auto-Apply with AI
            </Button>
          </div>
          
          {showAutoApplyDemo && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Auto-Apply Demonstration</h3>
              <p className="text-gray-400 mb-4">
                This is a simulation of how the AI-powered auto-apply feature works to automatically generate and submit grant applications.
              </p>
              <SimulatedAutoApply opportunityId={opportunity.id} artistId={user?.id || "artist_demo"} />
            </div>
          )}
        </div>

        {!user && opportunity.application_url && (
          <div className="bg-card text-card-foreground rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Apply for this Opportunity</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href={opportunity.application_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Apply on Website
              </a>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/90 h-10 px-4 py-2"
              >
                Sign in for AI assistance
              </Link>
            </div>
          </div>
        )}

        {user && (
          <div className="bg-card text-card-foreground rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">AI-Generated Insights</h2>
            </div>
            
            {isLoadingInsights ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Generating insights...</span>
              </div>
            ) : profileInsights ? (
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-line">{profileInsights}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Click the "Generate Insights" tab below to get personalized insights about this opportunity.
              </p>
            )}
          </div>
        )}

        {isOpen && user && (
          <div className="mt-8">
            <Tabs defaultValue="ai" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ai" className="flex items-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Application Generator
                </TabsTrigger>
                <TabsTrigger value="blockchain">Blockchain Application</TabsTrigger>
              </TabsList>
              <TabsContent value="ai" className="mt-4">
                <ApplicationGenerator 
                  opportunityId={opportunity.id} 
                  opportunityTitle={opportunity.title} 
                />
              </TabsContent>
              <TabsContent value="blockchain" className="mt-4">
                <BlockchainApplicationForm 
                  opportunityId={opportunity.id} 
                  opportunityTitle={opportunity.title}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {!isOpen && (
          <div className="mt-8 bg-amber-900/20 border border-amber-800 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-amber-300 mb-2">
              This opportunity is closed
            </h3>
            <p className="text-amber-400 mb-4">
              Applications are no longer being accepted for this opportunity.
            </p>
            <Link 
              href={user ? "/opportunities" : "/dashboard"}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
            >
              View More Opportunities
            </Link>
          </div>
        )}
        
        {isOpen && !user && opportunity.url && (
          <div className="mt-8 bg-blue-900/20 border border-blue-800 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-blue-300 mb-2">
              Apply for this opportunity
            </h3>
            <p className="text-blue-400 mb-4">
              You can apply for this opportunity directly on the provider's website.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href={opportunity.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
              >
                Apply on Website
              </a>
              <Link 
                href="/signin?redirect=/opportunities"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-transparent border border-blue-600 text-blue-400 hover:bg-blue-900/20 h-10 px-4 py-2"
              >
                Sign In for AI Assistance
              </Link>
            </div>
          </div>
        )}
        
        {isOpen && !user && !opportunity.url && (
          <div className="mt-8 bg-blue-900/20 border border-blue-800 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-blue-300 mb-2">
              Sign in to apply
            </h3>
            <p className="text-blue-400 mb-4">
              You need to be signed in to apply for this opportunity with our AI assistance.
            </p>
            <Link 
              href="/signin?redirect=/opportunities"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 