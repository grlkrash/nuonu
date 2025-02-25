export interface Artist {
  id: string
  userId: string
  name: string
  email: string
  bio?: string
  artisticDiscipline: string
  experienceLevel?: string
  location?: string
  portfolioUrl?: string
  walletAddresses: {
    base?: string
    zksync?: string
    flow?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Opportunity {
  id: string
  title: string
  description: string
  type: 'grant' | 'bounty' | 'proposal'
  platform: 'base' | 'zksync' | 'flow'
  organization: string
  amount: number
  deadline: Date
  requirements: string[]
  applicationUrl?: string
  contractAddress?: string
  status: 'active' | 'expired' | 'filled'
  createdAt: Date
  updatedAt: Date
}

export interface Application {
  id: string
  artistId: string
  opportunityId: string
  status: 'draft' | 'submitted' | 'accepted' | 'rejected'
  submissionDate?: Date
  responseDate?: Date
  notes?: string
  transactionHash?: string
  createdAt: Date
  updatedAt: Date
}

export interface AIAgent {
  id: string
  name: string
  platform: 'base' | 'zksync' | 'flow'
  capabilities: string[]
  status: 'active' | 'inactive'
  lastAction?: Date
  createdAt: Date
  updatedAt: Date
} 