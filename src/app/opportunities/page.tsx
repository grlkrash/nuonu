'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'
import { AIOpportunityFinder } from '@/components/opportunities/ai-opportunity-finder'
import { useUser } from '@/lib/hooks/use-user'
import { useToast } from '@/components/ui/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

interface Opportunity {
  id: string
  title: string
  description: string
  organization: string
  deadline: string
  amount: string
  location: string
  opportunity_type: string
  status: 'open' | 'closed' | 'draft'
  created_at: string
  updated_at: string
  matchScore?: number
}

export default function OpportunitiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: userLoading } = useUser()
  const { toast } = useToast()
  
  // State for opportunities
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [highMatches, setHighMatches] = useState<Opportunity[]>([])
  const [mediumMatches, setMediumMatches] = useState<Opportunity[]>([])
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(true)
  const [isLoadingMatches, setIsLoadingMatches] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  
  // Get query parameters
  const initialType = searchParams.get('type') || 'all'
  const initialQuery = searchParams.get('query') || ''
  
  // Set initial filter values from URL
  useEffect(() => {
    if (initialType) setSelectedType(initialType)
    if (initialQuery) setSearchQuery(initialQuery)
  }, [initialType, initialQuery])
  
  // Fetch AI matches if user is logged in
  useEffect(() => {
    if (userLoading) return
    
    if (user) {
      fetchAIMatches()
    } else {
      setIsLoadingMatches(false)
    }
  }, [user, userLoading])
  
  // Fetch all opportunities
  useEffect(() => {
    fetchOpportunities()
  }, [selectedType, searchQuery])
  
  // Fetch AI matches from the agent API
  async function fetchAIMatches() {
    try {
      setIsLoadingMatches(true)
      const response = await fetch('/api/agent?action=matches')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch AI matches')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setHighMatches(data.matches.highMatches || [])
        setMediumMatches(data.matches.mediumMatches || [])
      } else {
        throw new Error(data.message || 'Failed to fetch AI matches')
      }
    } catch (error) {
      console.error('Error fetching AI matches:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch AI matches',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingMatches(false)
    }
  }
  
  // Fetch all opportunities from API
  async function fetchOpportunities() {
    try {
      setIsLoadingOpportunities(true)
      setError(null)
      
      // Build query parameters
      const queryParams = new URLSearchParams()
      if (selectedType !== 'all') queryParams.set('type', selectedType)
      if (searchQuery) queryParams.set('query', searchQuery)
      
      const url = `/api/opportunities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch opportunities')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setOpportunities(data.opportunities || [])
      } else {
        throw new Error(data.message || 'Failed to fetch opportunities')
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
      setError(error instanceof Error ? error.message : 'Failed to load opportunities. Please try again later.')
    } finally {
      setIsLoadingOpportunities(false)
    }
  }
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }
  
  // Handle type filter change
  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    
    // Update URL with new filter
    const params = new URLSearchParams(searchParams.toString())
    if (type === 'all') {
      params.delete('type')
    } else {
      params.set('type', type)
    }
    
    if (searchQuery) {
      params.set('query', searchQuery)
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
    window.history.pushState({}, '', newUrl)
  }
  
  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Update URL with search query
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery) {
      params.set('query', searchQuery)
    } else {
      params.delete('query')
    }
    
    if (selectedType !== 'all') {
      params.set('type', selectedType)
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
    window.history.pushState({}, '', newUrl)
    
    fetchOpportunities()
  }
  
  // Get unique opportunity types for filter
  const opportunityTypes = ['all', ...new Set(opportunities.map(opp => opp.opportunity_type))]
  
  // Show error if there's an issue loading opportunities
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Error</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button onClick={() => fetchOpportunities()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Opportunities</h1>
        
        {/* AI-matched opportunities section */}
        {user && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Your Matches</h2>
            
            {isLoadingMatches ? (
              <div className="bg-gray-900 rounded-lg p-8">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-3/4 bg-gray-800" />
                  <Skeleton className="h-20 w-full bg-gray-800" />
                  <Skeleton className="h-20 w-full bg-gray-800" />
                </div>
              </div>
            ) : highMatches.length === 0 && mediumMatches.length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-8 text-center">
                <p className="text-gray-400 mb-4">
                  No matches found. Complete your profile to get personalized recommendations.
                </p>
                <Button onClick={() => router.push('/profile/edit')}>
                  Complete Profile
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
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
                          showMatchScore={true}
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
                          showMatchScore={true}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Search and filter section */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Browse All Opportunities</h2>
          
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search opportunities..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              
              <Button type="submit" className="bg-white text-black hover:bg-gray-200">
                Search
              </Button>
            </div>
          </form>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {opportunityTypes.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                onClick={() => handleTypeChange(type)}
                className={selectedType === type ? 'bg-white text-black' : 'border-gray-700 text-gray-300'}
              >
                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          
          {isLoadingOpportunities ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full bg-gray-800" />
              <Skeleton className="h-20 w-full bg-gray-800" />
              <Skeleton className="h-20 w-full bg-gray-800" />
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No opportunities found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {opportunities.map((opportunity) => (
                <OpportunityCard 
                  key={opportunity.id} 
                  opportunity={opportunity}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}