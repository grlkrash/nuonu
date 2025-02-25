import { Profile } from './profile'

export interface Opportunity {
  id: string
  title: string
  description: string
  requirements?: string
  category?: string
  location?: string
  is_remote?: boolean
  budget?: number
  deadline?: string
  status: 'open' | 'closed' | 'draft'
  creator_id: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface OpportunityUpdate {
  title?: string
  description?: string
  requirements?: string
  category?: string
  location?: string
  is_remote?: boolean
  budget?: number
  deadline?: string
  status?: 'open' | 'closed' | 'draft'
} 