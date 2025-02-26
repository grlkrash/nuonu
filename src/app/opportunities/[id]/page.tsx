import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { getOpportunityById } from '@/lib/services/opportunities'
import { getCurrentUser } from '@/lib/auth'
import { ApplicationGenerator } from '@/components/opportunities/application-generator'
import { BlockchainApplicationForm } from '@/components/blockchain/blockchain-application-form'
import { generateProfileInsights } from '@/lib/services/openai'
import { getProfileById } from '@/lib/services/profiles'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles } from 'lucide-react'

interface OpportunityPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: OpportunityPageProps) {
  try {
    const opportunity = await getOpportunityById(params.id)
    
    return {
      title: `${opportunity.title} | Nuonu`,
      description: opportunity.description.substring(0, 160),
    }
  } catch (error) {
    return {
      title: 'Opportunity | Nuonu',
      description: 'View opportunity details',
    }
  }
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  const user = await getCurrentUser().catch(() => null)
  
  let opportunity
  try {
    opportunity = await getOpportunityById(params.id)
  } catch (error) {
    notFound()
  }
  
  const createdAt = new Date(opportunity.created_at)
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })
  
  const deadline = opportunity.deadline 
    ? new Date(opportunity.deadline)
    : null
  
  const isOpen = opportunity.status === 'open'
  
  // Format the amount as currency
  const formattedAmount = opportunity.amount 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(opportunity.amount)
    : 'Amount not specified'
  
  // Get user profile insights if user is logged in
  let profileInsights = null
  if (user) {
    try {
      const profile = await getProfileById(user.id)
      if (profile) {
        profileInsights = await generateProfileInsights(profile)
      }
    } catch (error) {
      console.error('Error fetching profile insights:', error)
    }
  }
  
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Link 
          href="/opportunities"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← Back to Opportunities
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">{opportunity.title}</h1>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            {opportunity.opportunity_type === 'grant' ? 'Grant' : 
             opportunity.opportunity_type === 'job' ? 'Job' : 'Gig'}
          </span>
          
          {opportunity.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
              {opportunity.category}
            </span>
          )}
          
          {opportunity.is_remote && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400">
              Remote
            </span>
          )}
          
          {opportunity.location && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              {opportunity.location}
            </span>
          )}
          
          {isOpen ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Open
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
              Closed
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          <div>
            Posted {timeAgo} by {opportunity.organization}
          </div>
          
          <div className="flex items-center gap-4">
            {opportunity.amount > 0 && (
              <span className="font-medium text-gray-900 dark:text-white">
                {formattedAmount}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p>{opportunity.description}</p>
            </div>
          </div>
          
          {opportunity.requirements && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Requirements</h2>
              <div className="prose dark:prose-invert max-w-none">
                <p>{opportunity.requirements}</p>
              </div>
            </div>
          )}
          
          {opportunity.eligibility && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Eligibility</h2>
              <div className="prose dark:prose-invert max-w-none">
                <p>{opportunity.eligibility}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Organization</h2>
            <p className="mb-4">{opportunity.organization}</p>
            
            {opportunity.application_url && (
              <div className="mt-4">
                <a 
                  href={opportunity.application_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
                >
                  Apply on Website
                </a>
              </div>
            )}
          </div>
          
          {profileInsights && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Sparkles className="h-5 w-5 text-blue-500 mr-2" />
                <h2 className="text-xl font-semibold">AI Insights</h2>
              </div>
              <div className="prose dark:prose-invert max-w-none text-sm">
                <p>{profileInsights}</p>
              </div>
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
                opportunityId={params.id} 
                opportunityTitle={opportunity.title} 
              />
            </TabsContent>
            <TabsContent value="blockchain" className="mt-4">
              <BlockchainApplicationForm 
                opportunityId={params.id} 
                opportunityTitle={opportunity.title}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {!user && (
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">
            Sign in to apply
          </h3>
          <p className="text-blue-600 dark:text-blue-400 mb-4">
            Create an account or sign in to apply for this opportunity and access AI-powered application tools.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/signin"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Sign In
            </Link>
            <Link 
              href="/signup"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </div>
  )
} 