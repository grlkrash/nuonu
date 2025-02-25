import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getApplicationsByUserId } from '@/lib/services/applications'
import { getCurrentUser } from '@/lib/auth'
import { getProfileById } from '@/lib/services/profiles'
import { getMatchedOpportunities } from '@/lib/services/ai-matching'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'

export const metadata = {
  title: 'Dashboard | Nuonu',
  description: 'Manage your artist profile and applications',
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
  
  // Combine high and medium matches for recommendations
  const recommendedOpportunities = [...highMatches, ...mediumMatches].slice(0, 3)
  
  // Calculate profile completion percentage
  const profileCompletion = profile ? calculateProfileCompletion(profile) : 0
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Welcome back, {profile?.full_name || user.email}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile completion alert */}
          {profileCompletion < 100 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Complete your profile
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                    <p>Your profile is {profileCompletion}% complete. A complete profile increases your chances of being matched with relevant opportunities.</p>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${profileCompletion}%` }}></div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/profile"
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                    >
                      Complete your profile →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Recent applications */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Applications</h2>
              <Link
                href="/dashboard/applications"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all
              </Link>
            </div>
            
            {applications.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You haven't applied to any opportunities yet. Browse available opportunities to get started.
                </p>
                <Link
                  href="/opportunities"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                  Browse Opportunities
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 3).map((application) => (
                  <div
                    key={application.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          <Link
                            href={`/opportunities/${application.opportunity_id}`}
                            className="hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {application.opportunities?.title || 'Untitled Opportunity'}
                          </Link>
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Applied on {new Date(application.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        application.status === 'accepted'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : application.status === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : application.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
                
                {applications.length > 3 && (
                  <div className="text-center mt-4">
                    <Link
                      href="/dashboard/applications"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View all {applications.length} applications
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Recommended opportunities */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recommended For You</h2>
              <Link
                href="/discover"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all
              </Link>
            </div>
            
            <div className="space-y-4">
              {recommendedOpportunities.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
              
              {recommendedOpportunities.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-300">
                    {profile ? 
                      'No recommended opportunities available at this time. Check back later or browse all opportunities.' :
                      'Complete your profile to get personalized opportunity recommendations.'}
                  </p>
                  {!profile && (
                    <Link
                      href="/profile"
                      className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                    >
                      Complete Your Profile
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-8">
          {/* Quick actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/opportunities"
                className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-center"
              >
                Browse Opportunities
              </Link>
              <Link
                href="/discover"
                className="block w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors text-center"
              >
                Discover Matches
              </Link>
              <Link
                href="/profile"
                className="block w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-md transition-colors text-center"
              >
                Edit Profile
              </Link>
              <Link
                href="/dashboard/applications"
                className="block w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-md transition-colors text-center"
              >
                View Applications
              </Link>
            </div>
          </div>
          
          {/* Profile summary */}
          {profile && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Your Profile</h2>
              
              <div className="space-y-4">
                {profile.avatar_url && (
                  <div className="flex justify-center">
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || 'Profile'} 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium">{profile.full_name || 'Not provided'}</p>
                </div>
                
                {profile.location && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="font-medium">{profile.location}</p>
                  </div>
                )}
                
                {profile.interests && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Interests</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.interests.split(',').map((interest, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          {interest.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {profile.skills && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Skills</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.skills.split(',').map((skill, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/profile"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit profile →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function calculateProfileCompletion(profile: any): number {
  if (!profile) return 0
  
  const requiredFields = ['full_name', 'bio', 'website', 'avatar_url', 'interests', 'skills', 'location']
  const completedFields = requiredFields.filter(field => !!profile[field])
  
  return Math.round((completedFields.length / requiredFields.length) * 100)
} 