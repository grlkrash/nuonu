export interface ArtistManager {
  id: string
  userId: string
  name: string
  email: string
  bio?: string
  company?: string
  position?: string
  experience?: string
  location?: string
  website?: string
  socialLinks?: {
    twitter?: string
    linkedin?: string
    instagram?: string
  }
  artistTypes?: string[]
  projectTypes?: string[]
  budgetRange?: {
    min?: number
    max?: number
  }
  walletAddresses?: {
    base?: string
    zksync?: string
    flow?: string
  }
  createdAt: Date
  updatedAt: Date
  onboardingCompleted: boolean
}

export interface ArtistManagerFormData {
  name: string
  email: string
  bio: string
  company: string
  position: string
  experience: string
  location: string
  website: string
  socialLinks: {
    twitter: string
    linkedin: string
    instagram: string
  }
  artistTypes: string[]
  projectTypes: string[]
  budgetRange: {
    min: number
    max: number
  }
  walletAddresses: {
    base: string
    zksync: string
    flow: string
  }
} 