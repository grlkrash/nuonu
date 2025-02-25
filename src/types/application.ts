import { Opportunity } from './opportunity'
import { Profile } from './profile'

export interface Application {
  id: string
  user_id: string
  opportunity_id: string
  message: string
  proposal: string
  compensation?: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  opportunities?: Opportunity
  profiles?: Profile
} 