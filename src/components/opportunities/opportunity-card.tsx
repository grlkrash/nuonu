'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Sparkles } from 'lucide-react'
import type { Opportunity } from '@/lib/services/opportunities'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DollarSign, Clock, Users } from 'lucide-react'

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
  const [isHovered, setIsHovered] = useState(false)
  
  const toggleExpand = () => setIsExpanded(!isExpanded)
  
  // Use the timeAgo prop if provided, otherwise calculate it from created_at
  let formattedTimeAgo = timeAgo || 'Recently'
  
  // Only calculate if timeAgo prop is not provided
  if (!timeAgo) {
    try {
      if (opportunity.created_at) {
        const createdAt = new Date(opportunity.created_at)
        if (!isNaN(createdAt.getTime())) {
          formattedTimeAgo = formatDistanceToNow(createdAt, { addSuffix: true })
        } else {
          console.log('Invalid created_at date format:', opportunity.created_at)
        }
      }
    } catch (error) {
      console.error('Error formatting created_at date:', error, opportunity.created_at)
    }
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
    <Card
      className={`relative overflow-hidden transition-all duration-300 ${
        isHovered ? 'shadow-lg' : 'shadow-md'
      } border-gray-200 hover:border-primary/50`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : ''
        }`}
      />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold line-clamp-1">
              <Link href={`/opportunities/${opportunity.id}`} className="hover:text-muted-foreground">
                {opportunity.title}
              </Link>
            </h3>
            <p className="text-sm text-gray-500">{formattedTimeAgo}</p>
          </div>
          <Badge
            variant={
              opportunity.status === 'open'
                ? 'default'
                : opportunity.status === 'closed'
                ? 'destructive'
                : 'outline'
            }
            className="capitalize"
          >
            {opportunity.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {opportunity.description}
        </p>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-sm font-medium">
              {formattedAmount && `$${formattedAmount}`}
            </span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-sm">{deadline}</span>
          </div>
          
          <div className="flex items-center">
            <Users className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-sm">{opportunity.applicants}</span>
          </div>
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="pt-3 pb-3 flex justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/opportunities/${opportunity.id}`}>View Details</Link>
        </Button>
        
        <Button variant="outline" size="sm" asChild>
          <Link href={`/opportunities/${opportunity.id}/apply`}>Apply Now</Link>
        </Button>
      </CardFooter>
    </Card>
  )
} 