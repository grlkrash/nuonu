import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getProfileById } from '@/lib/services/profiles'
import { getOpportunities } from '@/lib/services/opportunities'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'

export const metadata = {
  title: 'Discover Opportunities | Nuonu',
  description: 'Discover artist opportunities through various channels',
}

export default function DiscoverPage() {
  redirect('/dashboard')
} 