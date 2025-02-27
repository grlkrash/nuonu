import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getApplicationsByUserId } from '@/lib/services/applications'
import { getCurrentUser } from '@/lib/auth'
import { getProfileById } from '@/lib/services/profiles'
import { getMatchedOpportunities } from '@/lib/services/ai-matching'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'
import { SimpleWalletConnect } from '@/components/blockchain/simple-wallet-connect'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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
    ? await getMatchedOpportunities(profile, 5).catch(() => ({ highMatches: [], mediumMatches: [], otherMatches: [] }))
    : { highMatches: [], mediumMatches: [] }
  
  // Calculate profile completion percentage
  const profileCompletion = profile ? calculateProfileCompletion(profile) : 0
  
  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Your Grant Matches</h1>
        
        {/* AI-matched opportunities - Now at the top and full width */}
        <div className="bg-gray-900 rounded-lg shadow-md p-6 border border-gray-800 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Recommended Opportunities</h2>
          
          {highMatches.length === 0 && mediumMatches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">
                No recommended opportunities yet. Complete your profile to get personalized recommendations.
              </p>
              <Link
                href="/opportunities"
                className="inline-block px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200"
              >
                Browse All Opportunities
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {highMatches.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3 text-green-400 border-l-4 border-green-400 pl-3">
                    High Matches
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {highMatches.map((opportunity) => (
                      <OpportunityCard 
                        key={opportunity.id} 
                        opportunity={opportunity} 
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {mediumMatches.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3 text-yellow-400 border-l-4 border-yellow-400 pl-3">
                    Good Matches
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {mediumMatches.map((opportunity) => (
                      <OpportunityCard 
                        key={opportunity.id} 
                        opportunity={opportunity} 
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-center pt-4">
                <Link
                  href="/opportunities"
                  className="inline-block px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200"
                >
                  View all opportunities
                </Link>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile completion */}
            {profile && profileCompletion < 100 && (
              <div className="bg-gray-900 rounded-lg shadow-md p-6 border border-gray-800">
                <h2 className="text-xl font-semibold mb-4">Complete Your Profile</h2>
                <div className="w-full bg-gray-800 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-white h-2.5 rounded-full" 
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
                <p className="text-gray-400 mb-4">
                  Your profile is {profileCompletion}% complete. A complete profile helps you get better opportunity matches.
                </p>
                <Link
                  href="/profile/edit"
                  className="inline-block px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200"
                >
                  Complete Profile
                </Link>
              </div>
            )}
            
            {/* Recent applications */}
            <div className="bg-gray-900 rounded-lg shadow-md p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Your Applications</h2>
              
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">
                    You haven't applied to any opportunities yet.
                  </p>
                  <Link
                    href="/opportunities"
                    className="inline-block px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200"
                  >
                    Find Opportunities
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {applications.slice(0, 5).map((application) => (
                    <div key={application.id} className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-white">
                            {application.opportunity?.title || 'Untitled Opportunity'}
                          </h3>
                          <p className="text-sm text-gray-400">
                            Submitted: {new Date(application.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          application.status === 'accepted' 
                            ? 'bg-green-900/30 text-green-400 border border-green-800' 
                            : application.status === 'rejected'
                            ? 'bg-red-900/30 text-red-400 border border-red-800'
                            : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
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
                        className="text-white hover:text-gray-300"
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
            <div className="bg-gray-900 rounded-lg shadow-md p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Your Wallets</h2>
              <SimpleWalletConnect />
            </div>
            
            {/* AI Agent Preview */}
            <div className="bg-gray-900 rounded-lg shadow-md p-6 border border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">AI Agent</h2>
                <Link
                  href="/dashboard/agent"
                  className="text-sm text-white hover:text-gray-300"
                >
                  View Dashboard
                </Link>
              </div>
              
              <p className="text-gray-400 mb-4">
                Your AI agent can autonomously discover opportunities, generate applications, and monitor your submissions.
              </p>
              
              <Link
                href="/dashboard/agent"
                className="inline-block w-full px-4 py-2 bg-white text-black text-center rounded-md hover:bg-gray-200"
              >
                Manage AI Agent
              </Link>
            </div>
            
            {/* Quick links */}
            <div className="bg-gray-900 rounded-lg shadow-md p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
              <nav className="space-y-2">
                <Link
                  href="/opportunities"
                  className="block px-4 py-2 text-white hover:bg-gray-800 rounded-md"
                >
                  Browse Opportunities
                </Link>
                <Link
                  href="/profile/edit"
                  className="block px-4 py-2 text-white hover:bg-gray-800 rounded-md"
                >
                  Edit Profile
                </Link>
                <Link
                  href="/dashboard/applications"
                  className="block px-4 py-2 text-white hover:bg-gray-800 rounded-md"
                >
                  View Applications
                </Link>
                <Link
                  href="/dashboard/agent"
                  className="block px-4 py-2 text-white hover:bg-gray-800 rounded-md"
                >
                  AI Agent Dashboard
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(profile: any): number {
  const requiredFields = [
    'full_name',
    'bio',
    'location',
    'artistic_discipline',
    'experience_level',
    'skills',
    'interests',
    'portfolio_url'
  ]
  
  const completedFields = requiredFields.filter(field => 
    profile[field] && profile[field].length > 0
  )
  
  return Math.round((completedFields.length / requiredFields.length) * 100)
} 