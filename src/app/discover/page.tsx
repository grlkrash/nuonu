import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getProfileById } from '@/lib/services/profiles'
import { getOpportunities } from '@/lib/services/opportunities'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'

export const metadata = {
  title: 'Discover Opportunities | Nuonu',
  description: 'Discover artist opportunities through various channels',
}

export default async function DiscoverPage() {
  const user = await getCurrentUser().catch(() => null)
  
  if (!user) {
    redirect('/signin?redirect=/discover')
  }
  
  // Get user profile for personalization
  const profile = await getProfileById(user.id).catch(() => null)
  
  // Get recent opportunities
  const recentOpportunities = await getOpportunities({ limit: 6 }).catch(() => [])
  
  // Discovery methods
  const discoveryMethods = [
    {
      id: 'twitter',
      title: 'Twitter Opportunities',
      description: 'Discover opportunities from Twitter using AI',
      icon: (
        <svg className="h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
        </svg>
      ),
      href: '/discover/twitter',
      color: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-300',
    },
    {
      id: 'ai-recommendations',
      title: 'AI Recommendations',
      description: 'Get personalized opportunity recommendations based on your profile',
      icon: (
        <svg className="h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      href: '/opportunities/recommended',
      color: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      textColor: 'text-purple-700 dark:text-purple-300',
    },
    {
      id: 'browse',
      title: 'Browse All Opportunities',
      description: 'Browse through all available opportunities',
      icon: (
        <svg className="h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      href: '/opportunities',
      color: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-700 dark:text-green-300',
    },
    {
      id: 'blockchain',
      title: 'Blockchain Opportunities',
      description: 'Discover opportunities with blockchain integration',
      icon: (
        <svg className="h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      href: '/discover/blockchain',
      color: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-700 dark:text-orange-300',
    },
  ]
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Discover Opportunities</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Find the perfect opportunities for your artistic career
        </p>
      </div>
      
      {/* Discovery methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {discoveryMethods.map(method => (
          <Link
            key={method.id}
            href={method.href}
            className={`p-6 ${method.color} border ${method.borderColor} rounded-lg transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {method.icon}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold">{method.title}</h2>
                <p className={`mt-1 ${method.textColor}`}>
                  {method.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Recent opportunities */}
      {recentOpportunities.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Recent Opportunities</h2>
            <Link
              href="/opportunities"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentOpportunities.map(opportunity => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </div>
      )}
      
      {/* Profile completion reminder */}
      {profile && (
        <div className="mt-12 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-300">
                Complete Your Profile
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                <p>
                  A complete profile helps us find the best opportunities for you. 
                  Make sure to add your skills, portfolio, and preferences.
                </p>
                <div className="mt-4">
                  <Link
                    href="/profile"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Update Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 