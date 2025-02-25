import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession, getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/auth'

export const metadata = {
  title: 'Profile | Nuonu',
  description: 'View and manage your profile',
}

export default async function ProfilePage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/signin')
  }
  
  const user = await getCurrentUser()
  const supabase = createServerSupabaseClient()
  
  // Fetch profile data
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <Link 
          href="/profile/edit" 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          Edit Profile
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
              <p>Error loading profile: {error.message}</p>
              <p className="text-sm mt-1">Please try refreshing the page or contact support if the issue persists.</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Account Created</p>
                  <p className="font-medium">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Profile Details</h2>
              
              {profile ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                    <p className="font-medium">{profile.full_name || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bio</p>
                    <p className="font-medium">{profile.bio || 'No bio provided'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
                    {profile.website ? (
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {profile.website}
                      </a>
                    ) : (
                      <p className="font-medium">Not provided</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">
                    Profile not set up yet. Please complete your profile.
                  </p>
                  <Link 
                    href="/profile/edit" 
                    className="inline-block mt-3 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Complete your profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Your Opportunities</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>You haven't created any opportunities yet.</p>
            <Link 
              href="/opportunities/create" 
              className="inline-block mt-3 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create your first opportunity
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Your Applications</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>You haven't applied to any opportunities yet.</p>
            <Link 
              href="/opportunities" 
              className="inline-block mt-3 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Browse opportunities
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 