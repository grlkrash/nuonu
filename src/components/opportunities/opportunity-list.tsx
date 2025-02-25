'use client'

import { useState } from 'react'
import { Database } from '@/lib/supabase/database.types'
import { OpportunityCard } from './opportunity-card'

type Opportunity = Database['public']['Tables']['opportunities']['Row']

interface OpportunityListProps {
  initialOpportunities: Opportunity[]
  filters?: {
    types?: string[]
  }
}

export function OpportunityList({ 
  initialOpportunities,
  filters
}: OpportunityListProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities)
  const [activeType, setActiveType] = useState<string | null>(null)
  
  const opportunityTypes = filters?.types || [
    'Grant', 
    'Residency', 
    'Commission', 
    'Job', 
    'Contest'
  ]
  
  const handleFilterByType = (type: string | null) => {
    setActiveType(type)
    
    if (!type) {
      setOpportunities(initialOpportunities)
      return
    }
    
    const filtered = initialOpportunities.filter(
      opp => opp.opportunity_type.toLowerCase() === type.toLowerCase()
    )
    setOpportunities(filtered)
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterByType(null)}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            activeType === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        
        {opportunityTypes.map(type => (
          <button
            key={type}
            onClick={() => handleFilterByType(type)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              activeType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      
      {opportunities.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            No opportunities found. Try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map(opportunity => (
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