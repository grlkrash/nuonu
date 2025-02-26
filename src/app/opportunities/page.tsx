'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'

interface Opportunity {
  id: string
  title: string
  description: string
  opportunity_type: 'grant' | 'job' | 'gig'
  organization: string
  amount: number
  deadline: string
  eligibility: string
  application_url: string
  source: string
  source_id: string
  created_at: string
}

export default function OpportunitiesPage() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') || 'all'
  
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>(initialType)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'amount'>('newest')
  
  useEffect(() => {
    async function fetchOpportunities() {
      setLoading(true)
      setError(null)
      
      try {
        let query = supabase
          .from('opportunities')
          .select('*')
        
        // Apply type filter
        if (selectedType !== 'all') {
          query = query.eq('opportunity_type', selectedType)
        }
        
        // Apply sorting
        if (sortBy === 'newest') {
          query = query.order('created_at', { ascending: false })
        } else if (sortBy === 'amount') {
          query = query.order('amount', { ascending: false })
        }
        
        const { data, error } = await query
        
        if (error) throw error
        
        // Apply search filter client-side
        let filteredData = data || []
        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase()
          filteredData = filteredData.filter(opp => 
            opp.title.toLowerCase().includes(lowerQuery) ||
            opp.description.toLowerCase().includes(lowerQuery) ||
            opp.organization.toLowerCase().includes(lowerQuery)
          )
        }
        
        setOpportunities(filteredData)
      } catch (err) {
        console.error('Error fetching opportunities:', err)
        setError('Failed to load opportunities. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchOpportunities()
  }, [selectedType, sortBy, searchQuery])
  
  const handleTypeChange = (type: string) => {
    setSelectedType(type)
  }
  
  const handleSortChange = (sort: 'newest' | 'amount') => {
    setSortBy(sort)
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is already applied via the useEffect dependency
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Opportunities</h1>
      
      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTypeChange('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedType === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleTypeChange('grant')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedType === 'grant'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              Grants
            </button>
            <button
              onClick={() => handleTypeChange('job')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedType === 'job'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              Jobs
            </button>
            <button
              onClick={() => handleTypeChange('gig')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedType === 'gig'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              Gigs
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as 'newest' | 'amount')}
              className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="amount">Amount</option>
            </select>
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
      
      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No opportunities found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
            />
          ))}
        </div>
      )}
    </div>
  )
}