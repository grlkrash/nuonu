import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getProfileById } from '@/lib/services/profiles'
import { searchTwitterForOpportunities, convertTwitterToOpportunities } from '@/lib/services/twitter-search'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'

export const metadata = {
  title: 'Twitter Opportunities | Nuonu',
  description: 'Discover artist opportunities from Twitter',
}

interface TwitterOpportunityPageProps {
  searchParams: {
    q?: string
    limit?: string
  }
}

export default async function TwitterOpportunityPage({ searchParams }: TwitterOpportunityPageProps) {
  const user = await getCurrentUser().catch(() => null)
  
  if (!user) {
    redirect('/signin?redirect=/discover/twitter')
  }
  
  // Get user profile for personalization
  const profile = await getProfileById(user.id).catch(() => null)
  
  // Get search parameters
  const query = searchParams.q || 'artist grant OR opportunity OR job OR commission'
  const limit = parseInt(searchParams.limit || '10', 10)
  
  // Search Twitter for opportunities
  const twitterOpportunities = await searchTwitterForOpportunities(query, limit)
  
  // Convert Twitter opportunities to the application's opportunity format
  const opportunities = convertTwitterToOpportunities(twitterOpportunities)
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Twitter Opportunities</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Discover artist opportunities from Twitter using AI
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link
            href="/discover"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Discover
          </Link>
        </div>
      </div>
      
      {/* Search form */}
      <div className="mb-8">
        <form
          action="/discover/twitter"
          method="get"
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search Twitter for opportunities..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
          </div>
          <div>
            <select
              name="limit"
              defaultValue={limit.toString()}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            >
              <option value="5">5 results</option>
              <option value="10">10 results</option>
              <option value="20">20 results</option>
            </select>
          </div>
          <div>
            <button
              type="submit"
              className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>
      
      {/* Twitter opportunities */}
      {opportunities.length > 0 ? (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Results from Twitter</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Found {opportunities.length} opportunities matching your search
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map(opportunity => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            No opportunities matching your search were found on Twitter. Try a different search query.
          </p>
          <Link
            href="/discover/twitter"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Reset Search
          </Link>
        </div>
      )}
      
      <div className="mt-12 p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-purple-800 dark:text-purple-300">
              AI-Powered Twitter Search
            </h3>
            <div className="mt-2 text-sm text-purple-700 dark:text-purple-400">
              <p>
                Our AI agent continuously scans Twitter for artist opportunities, grants, jobs, and commissions. 
                The results are processed and categorized to help you find relevant opportunities more easily.
              </p>
              <p className="mt-2">
                For the best results, try searching for specific keywords related to your artistic discipline, 
                such as "digital art", "illustration", "music production", or "photography".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 