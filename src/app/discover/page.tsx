import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getProfileById } from '@/lib/services/profiles'
import { getOpportunities } from '@/lib/services/opportunities'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'

export const metadata = {
  title: 'Discover Opportunities | Nuonu',
  description: 'AI-powered opportunity discovery for artists',
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const user = await getCurrentUser().catch(() => null)
  
  if (!user) {
    redirect('/signin?redirect=/discover')
  }
  
  // Get user profile for personalization
  const profile = await getProfileById(user.id).catch(() => null)
  
  // In a real application, this would use AI to match opportunities to the user's profile
  // For now, we'll simulate this by filtering opportunities
  const userInterests = profile?.interests?.split(',').map(i => i.trim()) || []
  const userSkills = profile?.skills?.split(',').map(s => s.trim()) || []
  
  // Get all open opportunities
  const { opportunities } = await getOpportunities({
    status: 'open',
    limit: 50,
  }).catch(() => ({ opportunities: [], count: 0 }))
  
  // Simulate AI matching by categorizing opportunities
  const highMatchOpportunities: typeof opportunities = []
  const mediumMatchOpportunities: typeof opportunities = []
  const otherOpportunities: typeof opportunities = []
  
  // Simple matching algorithm (in a real app, this would be done with AI)
  opportunities.forEach(opportunity => {
    const description = opportunity.description?.toLowerCase() || ''
    const title = opportunity.title?.toLowerCase() || ''
    const category = opportunity.category?.toLowerCase() || ''
    
    // Check for high matches (multiple interests/skills match)
    const interestMatches = userInterests.filter(interest => 
      description.includes(interest.toLowerCase()) || 
      title.includes(interest.toLowerCase()) ||
      category.includes(interest.toLowerCase())
    )
    
    const skillMatches = userSkills.filter(skill => 
      description.includes(skill.toLowerCase()) || 
      title.includes(skill.toLowerCase())
    )
    
    if (interestMatches.length >= 2 || skillMatches.length >= 2) {
      highMatchOpportunities.push(opportunity)
    } else if (interestMatches.length > 0 || skillMatches.length > 0) {
      mediumMatchOpportunities.push(opportunity)
    } else {
      otherOpportunities.push(opportunity)
    }
  })
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Discover Opportunities</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            AI-powered opportunity matching based on your profile
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link
            href="/profile"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Update your profile to improve matches →
          </Link>
        </div>
      </div>
      
      {(!profile?.interests && !profile?.skills) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Improve your matches
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                <p>Add your interests and skills to your profile to get better opportunity matches.</p>
              </div>
              <div className="mt-4">
                <Link
                  href="/profile"
                  className="text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300"
                >
                  Update your profile →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* High match opportunities */}
      {highMatchOpportunities.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <h2 className="text-xl font-semibold">High Matches</h2>
            <span className="ml-3 px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              {highMatchOpportunities.length} opportunities
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highMatchOpportunities.map(opportunity => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </div>
      )}
      
      {/* Medium match opportunities */}
      {mediumMatchOpportunities.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <h2 className="text-xl font-semibold">Good Matches</h2>
            <span className="ml-3 px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              {mediumMatchOpportunities.length} opportunities
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mediumMatchOpportunities.map(opportunity => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </div>
      )}
      
      {/* Other opportunities */}
      {otherOpportunities.length > 0 && (
        <div>
          <div className="flex items-center mb-6">
            <h2 className="text-xl font-semibold">Other Opportunities</h2>
            <span className="ml-3 px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              {otherOpportunities.length} opportunities
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherOpportunities.map(opportunity => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </div>
      )}
      
      {opportunities.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No opportunities available</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            There are currently no open opportunities available. Check back later or browse all opportunities.
          </p>
          <Link
            href="/opportunities"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Browse All Opportunities
          </Link>
        </div>
      )}
    </div>
  )
} 