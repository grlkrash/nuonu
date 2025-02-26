'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Plus, Search, Filter, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'
import { AIOpportunityFinder } from '@/components/opportunities/ai-opportunity-finder'

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
  status?: 'open' | 'closed'
  category?: string
  is_remote?: boolean
  location?: string | null
  profiles?: any[] | null
}

export default function OpportunitiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') || 'all'
  const initialTab = searchParams.get('tab') || 'browse'
  
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>(initialType)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'amount'>('newest')
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    
    // Update URL with the new tab parameter
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    
    // Replace the current URL with the new one
    router.replace(`/opportunities?${params.toString()}`)
  }
  
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
    <div className="container py-10">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Opportunities</h1>
            <p className="text-muted-foreground">
              Discover grants, jobs, and gigs for artists
            </p>
          </div>
          <Button onClick={() => router.push('/opportunities/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Opportunity
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="browse">
              <Filter className="mr-2 h-4 w-4" />
              Browse Opportunities
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Opportunity Finder
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex gap-2">
                <Button
                  variant={selectedType === 'all' ? 'default' : 'outline'}
                  onClick={() => handleTypeChange('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedType === 'grant' ? 'default' : 'outline'}
                  onClick={() => handleTypeChange('grant')}
                >
                  Grants
                </Button>
                <Button
                  variant={selectedType === 'job' ? 'default' : 'outline'}
                  onClick={() => handleTypeChange('job')}
                >
                  Jobs
                </Button>
                <Button
                  variant={selectedType === 'gig' ? 'default' : 'outline'}
                  onClick={() => handleTypeChange('gig')}
                >
                  Gigs
                </Button>
              </div>
              
              <div className="flex gap-2 ml-auto">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder="Search opportunities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[200px] md:w-[300px]"
                  />
                  <Button type="submit">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setLoading(true)
                    setError(null)
                    // Trigger a re-fetch by changing a dependency
                    setSortBy(prev => prev === 'newest' ? 'amount' : 'newest')
                    setTimeout(() => setSortBy(prev => prev === 'newest' ? 'amount' : 'newest'), 100)
                  }}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            ) : opportunities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No opportunities found.</p>
                {searchQuery && (
                  <p className="mt-2">
                    Try different search terms or filters.
                  </p>
                )}
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
          </TabsContent>
          
          <TabsContent value="ai" className="space-y-6">
            <AIOpportunityFinder />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}