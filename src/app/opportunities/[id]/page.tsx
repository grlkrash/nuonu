import { notFound } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { getCurrentUser } from '@/lib/auth'
import OpportunityDetailClient from './opportunity-detail-client'

interface OpportunityPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: OpportunityPageProps) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/opportunities/${params.id}`, {
      next: { revalidate: 60 } // Revalidate every minute
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch opportunity')
    }
    
    const data = await response.json()
    const opportunity = data.opportunity
    
    return {
      title: `${opportunity.title} | Nuonu`,
      description: opportunity.description.substring(0, 160),
    }
  } catch (error) {
    return {
      title: 'Opportunity | Nuonu',
      description: 'View opportunity details',
    }
  }
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  const user = await getCurrentUser().catch(() => null)
  
  let opportunity
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/opportunities/${params.id}`, {
      next: { revalidate: 60 } // Revalidate every minute
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to fetch opportunity')
    }
    
    const data = await response.json()
    
    if (!data.success || !data.opportunity) {
      throw new Error('Failed to fetch opportunity')
    }
    
    opportunity = data.opportunity
  } catch (error) {
    console.error('Error fetching opportunity:', error)
    notFound()
  }
  
  const createdAt = new Date(opportunity.created_at)
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })
  
  const deadline = opportunity.deadline 
    ? new Date(opportunity.deadline)
    : null
  
  // Pass all data to the client component
  return <OpportunityDetailClient 
    opportunity={opportunity}
    timeAgo={timeAgo}
    deadline={deadline}
    user={user}
  />
} 