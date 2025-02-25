import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession, getCurrentUser } from '@/lib/auth'

export const metadata = {
  title: 'Dashboard | Nuonu',
  description: 'Manage your opportunities and applications',
}

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/signin')
  }
  
  const user = await getCurrentUser()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Activity</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Applications</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Opportunities Created</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Profile Completion</span>
              <span className="font-medium">20%</span>
            </div>
          </div>
        </div>
        
        {/* Quick actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link 
              href="/opportunities/create" 
              className="block w-full text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Create Opportunity
            </Link>
            <Link 
              href="/profile/edit" 
              className="block w-full text-center py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-md transition-colors"
            >
              Complete Your Profile
            </Link>
            <Link 
              href="/opportunities" 
              className="block w-full text-center py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-md transition-colors"
            >
              Browse Opportunities
            </Link>
          </div>
        </div>
        
        {/* User info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Account</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">User ID</p>
              <p className="font-medium text-sm truncate">{user?.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Account Created</p>
              <p className="font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent opportunities */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Recent Opportunities</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>No opportunities available yet.</p>
            <Link 
              href="/opportunities" 
              className="inline-block mt-3 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Browse all opportunities
            </Link>
          </div>
        </div>
      </div>
      
      {/* Recent applications */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Your Applications</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>You haven't applied to any opportunities yet.</p>
            <Link 
              href="/opportunities" 
              className="inline-block mt-3 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Find opportunities to apply
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 