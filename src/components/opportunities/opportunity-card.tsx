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
    matchScore?: number
  }
  className?: string
  showMatchScore?: boolean
}

export function OpportunityCard({ 
  opportunity, 
  className,
  showMatchScore = true
}: OpportunityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const toggleExpand = () => setIsExpanded(!isExpanded)
  
  // Safely handle date formatting with error handling
  let timeAgo = 'Recently'
  try {
    if (opportunity.created_at) {
      const createdAt = new Date(opportunity.created_at)
      if (!isNaN(createdAt.getTime())) {
        timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })
      } else {
        console.log('Invalid created_at date format:', opportunity.created_at)
      }
    }
  } catch (error) {
    console.error('Error formatting created_at date:', error, opportunity.created_at)
  }
  
  // Safely handle deadline formatting with error handling
  let deadline = 'No deadline'
  try {
    if (opportunity.deadline) {
      const deadlineDate = new Date(opportunity.deadline)
      if (!isNaN(deadlineDate.getTime())) {
        deadline = formatDistanceToNow(deadlineDate, { addSuffix: true })
      } else {
        console.log('Invalid deadline date format:', opportunity.deadline)
        deadline = typeof opportunity.deadline === 'string' ? opportunity.deadline : 'No deadline'
      }
    }
  } catch (error) {
    console.error('Error formatting deadline date:', error, opportunity.deadline)
    deadline = typeof opportunity.deadline === 'string' ? opportunity.deadline : 'No deadline'
  }
  
  // Safely handle amount formatting
  let formattedAmount = 'Amount not specified'
  try {
    if (opportunity.amount) {
      if (typeof opportunity.amount === 'number') {
        formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(opportunity.amount)
      } else if (typeof opportunity.amount === 'string') {
        // If it's already a string (like "$5,000"), use it directly
        formattedAmount = opportunity.amount
      }
    }
  } catch (error) {
    console.error('Error formatting amount:', error)
    formattedAmount = opportunity.amount?.toString() || 'Amount not specified'
  }
  
  // Function to get match score color based on score value
  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-900/30 text-green-400 border border-green-800'
    if (score >= 60) return 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
    return 'bg-gray-800 text-gray-400 border border-gray-700'
  }
  
  return (
    <div 
      className={cn(
        'bg-gray-900 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow border border-gray-800',
        className
      )}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold mb-2 text-white">
            <Link href={`/opportunities/${opportunity.id}`} className="hover:text-gray-300">
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800">
                Open
              </span>
            )}
            {opportunity.status === 'closed' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-800">
                Closed
              </span>
            )}
            {opportunity.status === 'draft' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
                Draft
              </span>
            )}
          </div>
        </div>
        
        <p className="text-gray-300 mb-4 line-clamp-2">
          {opportunity.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
            opportunity.opportunity_type === 'grant' 
              ? "bg-blue-900/30 text-blue-400 border-blue-800"
              : opportunity.opportunity_type === 'job'
                ? "bg-purple-900/30 text-purple-400 border-purple-800"
                : "bg-orange-900/30 text-orange-400 border-orange-800"
          )}>
            {opportunity.opportunity_type === 'grant' ? 'Grant' : 
             opportunity.opportunity_type === 'job' ? 'Job' : 'Gig'}
          </span>
          
          {opportunity.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
              {opportunity.category}
            </span>
          )}
          
          {opportunity.is_remote && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
              Remote
            </span>
          )}
          
          {opportunity.location && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
              {opportunity.location}
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-400">
          <div className="flex items-center">
            <span>Posted {timeAgo}</span>
            {opportunity.profiles?.full_name && (
              <span className="ml-2">
                by <span className="font-medium text-white">{opportunity.profiles.full_name}</span>
              </span>
            )}
          </div>
          
          <div className="flex items-center">
            {opportunity.amount && (
              <span className="font-medium text-white">
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
      
      <div className="px-6 py-3 bg-gray-800 border-t border-gray-700">
        <Link 
          href={`/opportunities/${opportunity.id}`}
          className="text-white hover:text-gray-300 font-medium text-sm flex items-center"
        >
          View Details <span className="ml-1">→</span>
        </Link>
      </div>
    </div>
  )
} 