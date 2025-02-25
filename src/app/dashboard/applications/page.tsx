import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { getApplicationsByUserId } from '@/lib/services/applications'
import { getCurrentUser } from '@/lib/auth'

export const metadata = {
  title: 'My Applications | Nuonu',
  description: 'Manage your submitted applications',
}

export default async function ApplicationsPage() {
  const user = await getCurrentUser().catch(() => null)
  
  if (!user) {
    redirect('/signin?redirect=/dashboard/applications')
  }
  
  const applications = await getApplicationsByUserId(user.id).catch(() => [])
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">My Applications</h1>
        <Link
          href="/opportunities"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          Browse Opportunities
        </Link>
      </div>
      
      {applications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No Applications Yet</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You haven't submitted any applications yet. Browse available opportunities to get started.
          </p>
          <Link
            href="/opportunities"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Browse Opportunities
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((application) => {
            const createdAt = new Date(application.created_at)
            const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })
            
            return (
              <div 
                key={application.id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-1">
                        <Link 
                          href={`/opportunities/${application.opportunity_id}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {application.opportunities?.title || 'Untitled Opportunity'}
                        </Link>
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Applied {timeAgo}
                      </p>
                    </div>
                    
                    <div className="mt-2 md:mt-0">
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Your Message
                        </h3>
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                          {application.message}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Your Proposal
                        </h3>
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                          {application.proposal}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                          Opportunity Details
                        </h3>
                        
                        {application.opportunities && (
                          <div className="space-y-3">
                            {application.opportunities.category && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                                <p className="text-sm font-medium">{application.opportunities.category}</p>
                              </div>
                            )}
                            
                            {application.opportunities.budget && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                                <p className="text-sm font-medium">${application.opportunities.budget.toLocaleString()}</p>
                              </div>
                            )}
                            
                            {application.compensation && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Your Requested Compensation</p>
                                <p className="text-sm font-medium">{application.compensation}</p>
                              </div>
                            )}
                            
                            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-600">
                              <Link
                                href={`/opportunities/${application.opportunity_id}`}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                View Opportunity
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
} 