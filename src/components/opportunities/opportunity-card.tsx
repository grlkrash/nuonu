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
  timeAgo: string
  className?: string
  showMatchScore?: boolean
  showAIBadge?: boolean
  isBlockchain?: boolean
}

export function OpportunityCard({ 
  opportunity, 
  timeAgo,
  className,
  showMatchScore = true,
  showAIBadge = false,
  isBlockchain = false,
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
  
  // Format amount with currency symbol
  const formattedAmount = opportunity.amount 
    ? opportunity.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : null

  // Check if opportunity is open based on status and deadline
  const isOpen = opportunity.status === 'open' && 
    (!opportunity.deadline || new Date() < new Date(opportunity.deadline))

  // Determine if the opportunity is a sample
  const isSample = opportunity.id.startsWith('sample-')

  // Get the badge color based on opportunity type
  function getBadgeColor() {
    if (opportunity.opportunity_type === 'grant') return 'bg-blue-900/30 text-blue-400 border border-blue-800'
    if (opportunity.opportunity_type === 'job') return 'bg-purple-900/30 text-purple-400 border border-purple-800'
    return 'bg-gray-800 text-gray-400 border border-gray-700'
  }

  return (
    <div 
      className={cn(
        "rounded-lg overflow-hidden border bg-card text-card-foreground shadow-md transition-all hover:shadow-lg",
        className
      )}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold mb-2">
            <Link href={`/opportunities/${opportunity.id}`} className="hover:text-muted-foreground">
              {opportunity.title}
            </Link>
          </h3>
          
          <div className="flex items-center gap-2">
            {showMatchScore && opportunity.matchScore !== undefined && (
              <span 
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  getBadgeColor()
                )}
              >
                <Sparkles className="mr-1 h-3 w-3" />
                {opportunity.matchScore}% Match
              </span>
            )}
            
            {showAIBadge && (
              <div
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  "bg-primary/20 text-primary border border-primary/30"
                )}
              >
                <Sparkles className="mr-1 h-3 w-3" />
                AI Match
              </div>
            )}
            
            {isOpen ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:border dark:border-green-800">
                Open
              </span>
            ) : opportunity.status === 'closed' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 dark:border dark:border-red-800">
                Closed
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:border dark:border-gray-700">
                {opportunity.status}
              </span>
            )}
          </div>
        </div>
        
        <p className="text-muted-foreground mb-4 line-clamp-2">
          {opportunity.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            isBlockchain 
              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 dark:border dark:border-purple-800"
              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:border dark:border-blue-800"
          )}>
            {opportunity.opportunity_type === 'grant' ? 'Grant' : 
             opportunity.opportunity_type === 'job' ? 'Job' : 'Gig'}
          </span>
          
          {opportunity.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:border dark:border-gray-700">
              {opportunity.category}
            </span>
          )}
          
          {opportunity.is_remote && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:border dark:border-gray-700">
              Remote
            </span>
          )}
          
          {opportunity.location && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:border dark:border-gray-700">
              {opportunity.location}
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center">
            {!isSample && opportunity.profiles && (
              <>
                <span className="ml-2">
                  by <span className="font-medium">{opportunity.profiles.full_name}</span>
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center">
            {formattedAmount && (
              <span className="font-medium">
                ${formattedAmount}
              </span>
            )}
            
            {timeAgo && (
              <span className="ml-4">
                {timeAgo}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-6 py-3 bg-secondary/50 dark:bg-gray-800 border-t border-border dark:border-gray-700">
        <Link 
          href={`/opportunities/${opportunity.id}`}
          className="text-primary hover:text-primary/80 font-medium text-sm flex items-center"
        >
          View Details <span className="ml-1">→</span>
        </Link>
      </div>
    </div>
  )
} 