import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getApplicationsByUserId } from '@/lib/services/applications'
import { getCurrentUser } from '@/lib/auth'
import { getProfileById } from '@/lib/services/profiles'
import { getMatchedOpportunities } from '@/lib/services/ai-matching'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'
import { SimpleWalletConnect } from '@/components/blockchain/simple-wallet-connect'

export const metadata = {
  title: 'Artist Grant AI - Dashboard',
  description: 'Manage your artist profile, applications, and blockchain wallets',
}

export default async function DashboardPage() {
  const user = await getCurrentUser().catch(() => null)
  
  if (!user) {
    redirect('/signin?redirect=/dashboard')
  }
  
  // Get user profile
  const profile = await getProfileById(user.id).catch(() => null)
  
  // Get user applications
  const applications = await getApplicationsByUserId(user.id).catch(() => [])
  
  // Get AI-matched opportunities if profile exists
  const { highMatches = [], mediumMatches = [] } = profile 
    ? await getMatchedOpportunities(profile, 3).catch(() => ({ highMatches: [], mediumMatches: [], otherMatches: [] }))
    : { highMatches: [], mediumMatches: [] }
  
  // Calculate profile completion percentage
  const profileCompletion = profile ? calculateProfileCompletion(profile) : 0
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Artist Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile completion */}
          {profile && profileCompletion < 100 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Complete Your Profile</h2>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Your profile is {profileCompletion}% complete. A complete profile helps you get better opportunity matches.
              </p>
              <Link
                href="/profile/edit"
                className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Complete Profile
              </Link>
            </div>
          )}
          
          {/* AI-matched opportunities */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Recommended Opportunities</h2>
            
            {highMatches.length === 0 && mediumMatches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  No recommended opportunities yet. Complete your profile to get personalized recommendations.
                </p>
                <Link
                  href="/opportunities"
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Browse All Opportunities
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {highMatches.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-green-700 dark:text-green-400">
                      High Matches
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {highMatches.map((opportunity) => (
                        <OpportunityCard 
                          key={opportunity.id} 
                          opportunity={opportunity} 
                          compact
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {mediumMatches.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-yellow-700 dark:text-yellow-400">
                      Good Matches
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {mediumMatches.map((opportunity) => (
                        <OpportunityCard 
                          key={opportunity.id} 
                          opportunity={opportunity} 
                          compact
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-center pt-4">
                  <Link
                    href="/opportunities"
                    className="text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    View all opportunities
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Recent applications */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Your Applications</h2>
            
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You haven't applied to any opportunities yet.
                </p>
                <Link
                  href="/opportunities"
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Find Opportunities
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {applications.slice(0, 5).map((application) => (
                  <div key={application.id} className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {application.opportunity?.title || 'Untitled Opportunity'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Submitted: {new Date(application.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        application.status === 'accepted' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : application.status === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
                
                {applications.length > 5 && (
                  <div className="text-center pt-4">
                    <Link
                      href="/dashboard/applications"
                      className="text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      View all applications
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-8">
          {/* Wallet Connect */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Your Wallets</h2>
            <SimpleWalletConnect />
          </div>
          
          {/* Quick links */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
            <nav className="space-y-2">
              <Link
                href="/opportunities"
                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Browse Opportunities
              </Link>
              <Link
                href="/profile/edit"
                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Edit Profile
              </Link>
              <Link
                href="/dashboard/applications"
                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                View Applications
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(profile: any): number {
  if (!profile) return 0
  
  const fields = [
    'full_name',
    'bio',
    'artistic_discipline',
    'experience_level',
    'location',
    'portfolio_url',
    'skills',
    'social_links'
  ]
  
  const completedFields = fields.filter(field => {
    const value = profile[field]
    if (value === null || value === undefined) return false
    if (typeof value === 'string' && value.trim() === '') return false
    if (Array.isArray(value) && value.length === 0) return false
    if (typeof value === 'object' && Object.keys(value).length === 0) return false
    return true
  })
  
  return Math.round((completedFields.length / fields.length) * 100)
} 