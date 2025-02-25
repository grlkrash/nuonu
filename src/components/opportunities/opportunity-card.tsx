'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Database } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils'

type Opportunity = Database['public']['Tables']['opportunities']['Row']

interface OpportunityCardProps {
  opportunity: Opportunity
  className?: string
}

export function OpportunityCard({ opportunity, className }: OpportunityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const toggleExpand = () => setIsExpanded(!isExpanded)
  
  const formattedDate = opportunity.deadline 
    ? formatDistanceToNow(new Date(opportunity.deadline), { addSuffix: true })
    : 'No deadline'
  
  const formattedAmount = opportunity.amount 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(opportunity.amount)
    : 'Amount not specified'
  
  return (
    <div 
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{opportunity.title}</h3>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {opportunity.opportunity_type}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
          {opportunity.organization && (
            <span className="mr-3">{opportunity.organization}</span>
          )}
          <span>{formattedDate}</span>
        </div>
        
        <div className="mb-3">
          <p className={cn(
            "text-gray-600 dark:text-gray-300 text-sm",
            !isExpanded && "line-clamp-2"
          )}>
            {opportunity.description || 'No description provided'}
          </p>
          {opportunity.description && opportunity.description.length > 120 && (
            <button 
              onClick={toggleExpand}
              className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-1 hover:underline focus:outline-none"
              aria-expanded={isExpanded}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-gray-900 dark:text-white font-medium">
            {formattedAmount}
          </span>
          <Link 
            href={`/opportunities/${opportunity.id}`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
} 