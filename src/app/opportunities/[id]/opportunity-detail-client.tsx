"use client"

import Link from 'next/link'
import { format } from 'date-fns'
import { ApplicationGenerator } from '@/components/opportunities/application-generator'
import { BlockchainApplicationForm } from '@/components/blockchain/blockchain-application-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'

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
  
  // Format amount with currency symbol
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(opportunity.amount || 0)
  
  // Check if opportunity is open
  const isOpen = opportunity.status !== 'closed' && 
    (!deadline || new Date() < deadline)
  
  return (
    <div className="container max-w-4xl py-8 bg-black text-white">
      <div className="mb-6">
        <Link 
          href={user ? "/opportunities" : "/dashboard?guest=true"}
          className="text-blue-400 hover:underline mb-4 inline-block"
        >
          ← {user ? "Back to Opportunities" : "Back to Dashboard"}
        </Link>
        
        <h1 className="text-3xl font-bold mb-2 text-white">{opportunity.title}</h1>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-800">
            {opportunity.opportunity_type === 'grant' ? 'Grant' : 
             opportunity.opportunity_type === 'job' ? 'Job' : 'Gig'}
          </span>
          
          {opportunity.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900/30 text-indigo-400 border border-indigo-800">
              {opportunity.category}
            </span>
          )}
          
          {opportunity.is_remote && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-900/30 text-teal-400 border border-teal-800">
              Remote
            </span>
          )}
          
          {opportunity.location && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-800">
              {opportunity.location}
            </span>
          )}
          
          {isOpen ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800">
              Open
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-800">
              Closed
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-400 mb-6">
          <div>
            Posted {timeAgo} by {opportunity.organization}
          </div>
          
          <div className="flex items-center gap-4">
            {opportunity.amount && (
              <span className="font-medium text-white">
                {typeof opportunity.amount === 'string' ? opportunity.amount : formattedAmount}
              </span>
            )}
            
            {deadline && (
              <span>
                Deadline: {format(deadline, 'PPP')}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-gray-900 rounded-lg shadow p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-white">Description</h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p>{opportunity.description}</p>
            </div>
          </div>
          
          {opportunity.requirements && (
            <div className="bg-gray-900 rounded-lg shadow p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4 text-white">Requirements</h2>
              <div className="prose prose-invert max-w-none text-gray-300">
                <p>{opportunity.requirements}</p>
              </div>
            </div>
          )}
          
          {opportunity.eligibility && (
            <div className="bg-gray-900 rounded-lg shadow p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4 text-white">Eligibility</h2>
              <div className="prose prose-invert max-w-none text-gray-300">
                <p>{opportunity.eligibility}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg shadow p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-white">Organization</h2>
            <p className="mb-4 text-gray-300">{opportunity.organization}</p>
            
            {opportunity.application_url && (
              <div className="mt-4">
                <a 
                  href={opportunity.application_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full"
                >
                  Apply on Website
                </a>
              </div>
            )}
          </div>
          
          {user && (
            <div className="bg-gray-900 rounded-lg shadow p-6 border border-gray-800">
              <div className="flex items-center mb-4">
                <Sparkles className="h-5 w-5 text-blue-500 mr-2" />
                <h2 className="text-xl font-semibold text-white">AI Insights</h2>
              </div>
              
              {isLoadingInsights ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
                  <span className="text-sm text-gray-400">
                    Generating insights...
                  </span>
                </div>
              ) : profileInsights ? (
                <div className="prose prose-invert max-w-none text-gray-300 text-sm">
                  <p>{profileInsights}</p>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  <p>Complete your profile to get personalized insights for this opportunity.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
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
            href={user ? "/opportunities" : "/dashboard?guest=true"}
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
  )
} 