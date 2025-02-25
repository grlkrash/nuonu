import { Suspense } from 'react'
import Link from 'next/link'
import { getOpportunities, getOpportunityCategories } from '@/lib/services/opportunities'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'
import { getCurrentUser } from '@/lib/auth'

export const metadata = {
  title: 'Opportunities | Nuonu',
  description: 'Browse opportunities for artists',
}

interface OpportunitiesPageProps {
  searchParams: {
    category?: string
    status?: string
    q?: string
    page?: string
  }
}

export default async function OpportunitiesPage({ searchParams }: OpportunitiesPageProps) {
  const user = await getCurrentUser().catch(() => null)
  const categories = await getOpportunityCategories().catch(() => [])
  
  const category = searchParams.category || null
  const status = searchParams.status || 'open'
  const searchQuery = searchParams.q || null
  const page = parseInt(searchParams.page || '1', 10)
  const limit = 9
  const offset = (page - 1) * limit
  
  const { opportunities, count } = await getOpportunities({
    limit,
    offset,
    status,
    category,
    searchQuery,
  })
  
  const totalPages = Math.ceil(count / limit)
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Opportunities</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Find and apply for opportunities that match your skills
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            
            <div className="space-y-6">
              {/* Status filter */}
              <div>
                <h3 className="text-sm font-medium mb-2">Status</h3>
                <div className="space-y-2">
                  {['open', 'closed', 'all'].map((statusOption) => (
                    <div key={statusOption} className="flex items-center">
                      <Link
                        href={{
                          pathname: '/opportunities',
                          query: {
                            ...searchParams,
                            status: statusOption === 'all' ? undefined : statusOption,
                            page: undefined,
                          },
                        }}
                        className={`text-sm ${
                          status === statusOption || (statusOption === 'all' && !status)
                            ? 'text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Category filter */}
              {categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Categories</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Link
                        href={{
                          pathname: '/opportunities',
                          query: {
                            ...searchParams,
                            category: undefined,
                            page: undefined,
                          },
                        }}
                        className={`text-sm ${
                          !category
                            ? 'text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        All Categories
                      </Link>
                    </div>
                    
                    {categories.map((categoryOption) => (
                      <div key={categoryOption} className="flex items-center">
                        <Link
                          href={{
                            pathname: '/opportunities',
                            query: {
                              ...searchParams,
                              category: categoryOption,
                              page: undefined,
                            },
                          }}
                          className={`text-sm ${
                            category === categoryOption
                              ? 'text-blue-600 dark:text-blue-400 font-medium'
                              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          {categoryOption}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Search */}
              <div>
                <h3 className="text-sm font-medium mb-2">Search</h3>
                <form
                  action="/opportunities"
                  method="get"
                  className="flex items-center"
                >
                  {category && (
                    <input type="hidden" name="category" value={category} />
                  )}
                  {status && status !== 'open' && (
                    <input type="hidden" name="status" value={status} />
                  )}
                  <input
                    type="text"
                    name="q"
                    defaultValue={searchQuery || ''}
                    placeholder="Search opportunities..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                  />
                  <button
                    type="submit"
                    className="ml-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
        
        {/* Opportunities grid */}
        <div className="lg:col-span-3">
          <Suspense fallback={<div>Loading opportunities...</div>}>
            {opportunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {searchQuery
                    ? `No results found for "${searchQuery}"`
                    : 'No opportunities match the selected filters'}
                </p>
                <Link
                  href="/opportunities"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear filters
                </Link>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-2">
                  {page > 1 && (
                    <Link
                      href={{
                        pathname: '/opportunities',
                        query: {
                          ...searchParams,
                          page: page - 1,
                        },
                      }}
                      className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Previous
                    </Link>
                  )}
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      key={pageNum}
                      href={{
                        pathname: '/opportunities',
                        query: {
                          ...searchParams,
                          page: pageNum,
                        },
                      }}
                      className={`px-3 py-1 rounded-md ${
                        pageNum === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  ))}
                  
                  {page < totalPages && (
                    <Link
                      href={{
                        pathname: '/opportunities',
                        query: {
                          ...searchParams,
                          page: page + 1,
                        },
                      }}
                      className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Next
                    </Link>
                  )}
                </nav>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  )
}