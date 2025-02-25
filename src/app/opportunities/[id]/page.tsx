import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { getOpportunityById } from '@/lib/services/opportunities'
import { getCurrentUser } from '@/lib/auth'
import { AIApplicationForm } from '@/components/applications/ai-application-form'
import { generateProfileInsights } from '@/lib/services/openai'
import { getProfileById } from '@/lib/services/profiles'

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
  
  // Get AI insights for the user if they're logged in
  let profileInsights = null
  if (user) {
    const profile = await getProfileById(user.id).catch(() => null)
    if (profile && process.env.OPENAI_API_KEY) {
      profileInsights = await generateProfileInsights(profile).catch(() => null)
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/opportunities" 
          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Opportunities
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
            <div>
              <div className="flex items-center mb-2">
                <h1 className="text-2xl md:text-3xl font-bold mr-3">{opportunity.title}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  opportunity.status === 'open'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : opportunity.status === 'closed'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
                </span>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300">
                Posted {timeAgo}
                {opportunity.profiles?.full_name && (
                  <span> by <span className="font-medium">{opportunity.profiles.full_name}</span></span>
                )}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <div className="whitespace-pre-line">{opportunity.description}</div>
                
                {opportunity.requirements && (
                  <>
                    <h2 className="text-xl font-semibold mt-8 mb-4">Requirements</h2>
                    <div className="whitespace-pre-line">{opportunity.requirements}</div>
                  </>
                )}
              </div>
              
              {profileInsights && (
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold mb-4">AI Match Insights</h2>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M13 10V3L4 14h7v7l9-11h-7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">
                          AI-Generated Profile Match
                        </h3>
                        <div className="mt-2 text-sm text-purple-700 dark:text-purple-400">
                          <p className="whitespace-pre-line">{profileInsights}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {user && isOpen && (
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700" id="apply">
                  <h2 className="text-xl font-semibold mb-6">Apply for this Opportunity</h2>
                  <AIApplicationForm opportunityId={opportunity.id} userId={user.id} />
                </div>
              )}
            </div>
            
            <div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Opportunity Details</h2>
                
                <div className="space-y-4">
                  {opportunity.category && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                      <p className="font-medium">{opportunity.category}</p>
                    </div>
                  )}
                  
                  {opportunity.budget && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
                      <p className="font-medium">${opportunity.budget.toLocaleString()}</p>
                    </div>
                  )}
                  
                  {deadline && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Deadline</p>
                      <p className="font-medium">
                        {format(deadline, 'MMMM d, yyyy')}
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                          ({formatDistanceToNow(deadline, { addSuffix: true })})
                        </span>
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="font-medium">
                      {opportunity.location || 'Not specified'}
                      {opportunity.is_remote && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          Remote
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                {opportunity.profiles && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-md font-semibold mb-3">About the Creator</h3>
                    
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 mr-3">
                        {opportunity.profiles.avatar_url ? (
                          <img 
                            src={opportunity.profiles.avatar_url} 
                            alt={opportunity.profiles.full_name || 'Profile'} 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-6 w-6" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                            />
                          </svg>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium">{opportunity.profiles.full_name || 'Anonymous'}</p>
                        {opportunity.profiles.website && (
                          <a 
                            href={opportunity.profiles.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {opportunity.profiles.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {opportunity.profiles.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {opportunity.profiles.bio}
                      </p>
                    )}
                  </div>
                )}
                
                {user && isOpen && (
                  <div className="mt-6">
                    <a 
                      href="#apply" 
                      className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-center"
                    >
                      Apply Now
                    </a>
                  </div>
                )}
                
                {!user && isOpen && (
                  <div className="mt-6">
                    <Link 
                      href={`/signin?redirect=/opportunities/${opportunity.id}`}
                      className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-center"
                    >
                      Sign in to Apply
                    </Link>
                  </div>
                )}
                
                {!isOpen && (
                  <div className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-center">
                    This opportunity is no longer accepting applications
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 