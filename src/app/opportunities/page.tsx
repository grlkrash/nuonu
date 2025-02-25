import { Suspense } from 'react'
import { getOpportunities } from '@/services/opportunities'
import { OpportunityList } from '@/components/opportunities/opportunity-list'

export const metadata = {
  title: 'Opportunities | Nuonu',
  description: 'Discover grants, residencies, and other funding opportunities for artists',
}

export const revalidate = 3600 // Revalidate every hour

async function OpportunitiesContent() {
  const opportunities = await getOpportunities({ limit: 50 })
  
  return (
    <OpportunityList initialOpportunities={opportunities} />
  )
}

export default function OpportunitiesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Opportunities
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Discover grants, residencies, and other funding opportunities for artists
        </p>
      </div>
      
      <Suspense fallback={<OpportunitiesLoading />}>
        <OpportunitiesContent />
      </Suspense>
    </div>
  )
}

function OpportunitiesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i}
            className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
          />
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div 
            key={i} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 h-64 animate-pulse"
          >
            <div className="p-5 space-y-4">
              <div className="flex justify-between">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-1/4"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="flex justify-between items-center pt-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}