'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Sparkles } from 'lucide-react'
import type { Opportunity } from '@/lib/services/opportunities'
import { cn } from '@/lib/utils'

interface OpportunityCardProps {
  opportunity: Opportunity & {
    profiles?: {
      full_name: string | null
      avatar_url: string | null
    } | null
  }
  className?: string
  showMatchScore?: boolean
}

export function OpportunityCard({ 
  opportunity, 
  className,
  showMatchScore = false
}: OpportunityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const toggleExpand = () => setIsExpanded(!isExpanded)
  
  const createdAt = new Date(opportunity.created_at)
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })
  
  const deadline = opportunity.deadline 
    ? formatDistanceToNow(new Date(opportunity.deadline), { addSuffix: true })
    : null
  
  const formattedAmount = opportunity.amount 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(opportunity.amount)
    : 'Amount not specified'
  
  // Function to get match score color based on score value
  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
  
  return (
    <div 
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            <Link href={`/opportunities/${opportunity.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
              {opportunity.title}
            </Link>
          </h3>
          
          <div className="flex items-center gap-2">
            {showMatchScore && opportunity.matchScore !== undefined && (
              <span 
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  getMatchScoreColor(opportunity.matchScore)
                )}
              >
                <Sparkles className="mr-1 h-3 w-3" />
                {opportunity.matchScore}% Match
              </span>
            )}
            
            {opportunity.status === 'open' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Open
              </span>
            )}
            {opportunity.status === 'closed' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                Closed
              </span>
            )}
            {opportunity.status === 'draft' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                Draft
              </span>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {opportunity.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            opportunity.opportunity_type === 'grant' 
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              : opportunity.opportunity_type === 'job'
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
          )}>
            {opportunity.opportunity_type === 'grant' ? 'Grant' : 
             opportunity.opportunity_type === 'job' ? 'Job' : 'Gig'}
          </span>
          
          {opportunity.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
              {opportunity.category}
            </span>
          )}
          
          {opportunity.is_remote && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400">
              Remote
            </span>
          )}
          
          {opportunity.location && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              {opportunity.location}
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <span>Posted {timeAgo}</span>
            {opportunity.profiles?.full_name && (
              <span className="ml-2">
                by <span className="font-medium">{opportunity.profiles.full_name}</span>
              </span>
            )}
          </div>
          
          <div className="flex items-center">
            {opportunity.amount > 0 && (
              <span className="font-medium text-gray-900 dark:text-white">
                {formattedAmount}
              </span>
            )}
            
            {deadline && (
              <span className="ml-4">
                Deadline: {deadline}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <Link 
          href={`/opportunities/${opportunity.id}`}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm"
        >
          View Details →
        </Link>
      </div>
    </div>
  )
} 