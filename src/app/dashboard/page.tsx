import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getApplicationsByUserId } from '@/lib/services/applications'
import { getCurrentUser } from '@/lib/auth'
import { getProfileById } from '@/lib/services/profiles'
import { getMatchedOpportunities } from '@/lib/services/ai-matching'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'
import { SimpleWalletConnect } from '@/components/blockchain/simple-wallet-connect'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'

export const metadata = {
  title: 'nuonu - Dashboard',
  description: 'View your matched grants and manage your applications',
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
    ? await getMatchedOpportunities(profile, 10).catch(() => ({ highMatches: [], mediumMatches: [], otherMatches: [] }))
    : { highMatches: [], mediumMatches: [] }
  
  // Calculate profile completion percentage
  const profileCompletion = profile ? calculateProfileCompletion(profile) : 0
  
  return (
    <>
      <Header />
      <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Your Grant Matches</h1>
            <div className="flex space-x-4">
              <Link href="/profile">
                <Button className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2">
                  View Profile
                </Button>
              </Link>
              <Link href="/funds">
                <Button className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2">
                  Manage Funds
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Profile completion card */}
          {profileCompletion < 100 && (
            <div className="bg-gray-900 rounded-lg shadow-md p-6 border border-gray-800 mb-8">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Complete Your Profile</h2>
                <span className="text-sm text-gray-400">{profileCompletion}% complete</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-white h-2.5 rounded-full" 
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
              <p className="text-gray-400 mb-4">
                Complete your profile to get better grant matches and improve your chances of success.
              </p>
              <Link href="/profile">
                <Button className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2">
                  Complete Profile
                </Button>
              </Link>
            </div>
          )}
          
          {/* AI-matched opportunities */}
          <div className="bg-gray-900 rounded-lg shadow-md p-6 border border-gray-800 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Recommended Opportunities</h2>
            
            {highMatches.length === 0 && mediumMatches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">
                  No recommended opportunities yet. Complete your profile to get personalized recommendations.
                </p>
                <Link href="/profile">
                  <Button className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                {highMatches.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-medium mb-4 border-b border-gray-800 pb-2">High Matches</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {highMatches.map((opportunity) => (
                        <OpportunityCard 
                          key={opportunity.id} 
                          opportunity={opportunity} 
                          matchScore={opportunity.matchScore}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {mediumMatches.length > 0 && (
                  <div>
                    <h3 className="text-xl font-medium mb-4 border-b border-gray-800 pb-2">Medium Matches</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {mediumMatches.map((opportunity) => (
                        <OpportunityCard 
                          key={opportunity.id} 
                          opportunity={opportunity} 
                          matchScore={opportunity.matchScore}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-6 text-center">
                  <Link href="/grants">
                    <Button className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2">
                      View All Matches
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Recent applications */}
          {applications.length > 0 && (
            <div className="bg-gray-900 rounded-lg shadow-md p-6 border border-gray-800">
              <h2 className="text-2xl font-semibold mb-6">Your Recent Applications</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="py-2 px-4 text-left">Opportunity</th>
                      <th className="py-2 px-4 text-left">Submitted</th>
                      <th className="py-2 px-4 text-left">Status</th>
                      <th className="py-2 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((application) => (
                      <tr key={application.id} className="border-b border-gray-800 hover:bg-gray-800">
                        <td className="py-3 px-4 font-medium">{application.opportunity.title}</td>
                        <td className="py-3 px-4">{new Date(application.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            application.status === 'submitted' ? 'bg-green-900 text-green-300' :
                            application.status === 'draft' ? 'bg-gray-700 text-gray-300' :
                            application.status === 'rejected' ? 'bg-red-900 text-red-300' :
                            'bg-blue-900 text-blue-300'
                          }`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/dashboard/applications/${application.id}`}>
                            <Button className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-3 py-1 text-xs">
                              View Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 text-center">
                <Link href="/dashboard/applications">
                  <Button className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2">
                    View All Applications
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(profile) {
  const requiredFields = ['name', 'bio', 'location', 'interests', 'skills']
  const completedFields = requiredFields.filter(field => 
    profile[field] && 
    (typeof profile[field] === 'string' ? profile[field].trim() !== '' : true)
  )
  
  return Math.round((completedFields.length / requiredFields.length) * 100)
} 