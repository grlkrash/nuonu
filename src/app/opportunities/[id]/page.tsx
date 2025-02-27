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
    // Check if this is a sample opportunity
    if (params.id.startsWith('sample-')) {
      const sampleOpportunity = await getSampleOpportunityById(params.id)
      if (sampleOpportunity) {
        return {
          title: `${sampleOpportunity.title} | Nuonu`,
          description: sampleOpportunity.description.substring(0, 160),
        }
      }
    }
    
    // Regular API fetch for real opportunities
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/opportunities/${params.id}`, {
      next: { revalidate: 60 } // Revalidate every minute
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch opportunity')
    }
    
    const data = await response.json()
    
    if (!data.success || !data.opportunity) {
      throw new Error('Failed to fetch opportunity')
    }
    
    const opportunity = data.opportunity
    
    return {
      title: `${opportunity.title} | Nuonu`,
      description: opportunity.description.substring(0, 160),
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Opportunity | Nuonu',
      description: 'View opportunity details',
    }
  }
}

// Helper function to get sample opportunity by ID
async function getSampleOpportunityById(id: string) {
  try {
    const currentDate = new Date()
    const oneMonthLater = new Date(currentDate)
    oneMonthLater.setMonth(currentDate.getMonth() + 1)
    
    const twoMonthsLater = new Date(currentDate)
    twoMonthsLater.setMonth(currentDate.getMonth() + 2)
    
    console.log('Fetching sample opportunity by ID:', id)
    
    // Sample opportunities data - ensure this matches the data in dashboard/page.tsx
    const sampleOpportunities = {
      'sample-1': {
        id: 'sample-1',
        title: 'Artist Innovation Grant',
        organization: 'Creative Foundation',
        deadline: oneMonthLater.toISOString(),
        amount: '$5,000',
        description: 'Funding for innovative art projects that push boundaries. This grant aims to support artists who are exploring new techniques, materials, or concepts in their work. Successful applicants will demonstrate a clear vision for how their project contributes to artistic innovation.',
        requirements: 'Portfolio of previous work, project proposal, budget breakdown, timeline for completion.',
        eligibility: 'Open to artists of all disciplines. Must be 18 years or older. International applicants welcome.',
        matchScore: 85,
        created_at: currentDate.toISOString(),
        status: 'open',
        location: 'Global',
        url: 'https://example.com/grant1',
        opportunity_type: 'grant',
        is_remote: true,
        category: 'Visual Arts',
        creator_id: 'sample-creator',
        profiles: {
          id: 'sample-creator',
          full_name: 'Creative Foundation Team',
          avatar_url: null,
          website: 'https://example.com',
          bio: 'Supporting innovative artists worldwide'
        },
        tags: ['innovation', 'visual arts', 'new media']
      },
      'sample-2': {
        id: 'sample-2',
        title: 'Digital Art Fellowship',
        organization: 'Tech Arts Initiative',
        deadline: twoMonthsLater.toISOString(),
        amount: '$10,000',
        description: 'Support for artists working with digital media and technology. This fellowship provides financial support, mentorship, and exhibition opportunities for artists exploring the intersection of art and technology. Fellows will have access to cutting-edge tools and resources.',
        requirements: 'Digital portfolio, artist statement, project proposal, technical specifications.',
        eligibility: 'Artists working primarily in digital media. Experience with digital tools required. Open to international applicants.',
        matchScore: 80,
        created_at: currentDate.toISOString(),
        status: 'open',
        location: 'Remote',
        url: 'https://example.com/grant2',
        opportunity_type: 'grant',
        is_remote: true,
        category: 'Digital Arts',
        creator_id: 'sample-creator-2',
        profiles: {
          id: 'sample-creator-2',
          full_name: 'Tech Arts Initiative',
          avatar_url: null,
          website: 'https://example.com/techarts',
          bio: 'Bridging the gap between technology and artistic expression'
        },
        tags: ['digital', 'technology', 'new media', 'fellowship']
      },
      'sample-3': {
        id: 'sample-3',
        title: 'Community Art Project Grant',
        organization: 'Local Arts Council',
        deadline: oneMonthLater.toISOString(),
        amount: '$3,000',
        description: 'Funding for art projects that engage with local communities. This grant supports artists who collaborate with community members to create public art, workshops, or events that address local issues and foster community connections.',
        requirements: 'Project proposal, community engagement plan, budget, letters of support from community partners.',
        eligibility: 'Artists with experience in community engagement. Must be based in or have strong ties to the community where the project will take place.',
        matchScore: 65,
        created_at: currentDate.toISOString(),
        status: 'open',
        location: 'New York',
        url: 'https://example.com/grant3',
        opportunity_type: 'grant',
        is_remote: false,
        category: 'Community Arts',
        creator_id: 'sample-creator-3',
        profiles: {
          id: 'sample-creator-3',
          full_name: 'Local Arts Council',
          avatar_url: null,
          website: 'https://example.com/localarts',
          bio: 'Supporting arts and culture in our community'
        },
        tags: ['community', 'public art', 'social practice']
      },
      'sample-4': {
        id: 'sample-4',
        title: 'Emerging Artist Scholarship',
        organization: 'National Arts Foundation',
        deadline: twoMonthsLater.toISOString(),
        amount: '$7,500',
        description: 'Support for early-career artists to develop their practice. This scholarship provides financial assistance to artists in the early stages of their careers, allowing them to focus on developing their artistic voice and building a sustainable practice.',
        requirements: 'Portfolio, artist statement, career goals, financial need statement.',
        eligibility: 'Artists who have been practicing professionally for less than 5 years. Must demonstrate financial need.',
        matchScore: 60,
        created_at: currentDate.toISOString(),
        status: 'open',
        location: 'United States',
        url: 'https://example.com/grant4',
        opportunity_type: 'grant',
        is_remote: false,
        category: 'Emerging Artists',
        creator_id: 'sample-creator-4',
        profiles: {
          id: 'sample-creator-4',
          full_name: 'National Arts Foundation',
          avatar_url: null,
          website: 'https://example.com/naf',
          bio: 'Nurturing the next generation of artistic talent'
        },
        tags: ['emerging', 'scholarship', 'professional development']
      }
    }
    
    const opportunity = sampleOpportunities[id]
    console.log('Sample opportunity found:', !!opportunity)
    return opportunity || null
  } catch (error) {
    console.error('Error getting sample opportunity:', error)
    return null
  }
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  const user = await getCurrentUser().catch(() => null)
  
  let opportunity
  try {
    // Check if this is a sample opportunity
    if (params.id.startsWith('sample-')) {
      console.log('Fetching sample opportunity:', params.id)
      opportunity = await getSampleOpportunityById(params.id)
      
      if (!opportunity) {
        console.error('Sample opportunity not found:', params.id)
        notFound()
      }
    } else {
      // Regular API fetch for real opportunities
      console.log('Fetching real opportunity:', params.id)
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
    }
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