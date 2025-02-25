import { getOpportunities } from './opportunities'
import { Profile } from '@/types/profile'
import { Opportunity } from '@/types/opportunity'

/**
 * Calculates a match score between a profile and an opportunity
 * In a real application, this would use AI/ML for more sophisticated matching
 */
export function calculateMatchScore(profile: Profile, opportunity: Opportunity): number {
  let score = 0
  
  // Extract profile interests and skills
  const interests = profile.interests?.split(',').map(i => i.trim().toLowerCase()) || []
  const skills = profile.skills?.split(',').map(s => s.trim().toLowerCase()) || []
  
  // Extract opportunity text for matching
  const opportunityText = [
    opportunity.title,
    opportunity.description,
    opportunity.requirements,
    opportunity.category
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  
  // Match interests
  interests.forEach(interest => {
    if (opportunityText.includes(interest)) {
      score += 10
    }
  })
  
  // Match skills
  skills.forEach(skill => {
    if (opportunityText.includes(skill)) {
      score += 15
    }
  })
  
  // Location matching
  if (profile.location && opportunity.location) {
    const profileLocation = profile.location.toLowerCase()
    const opportunityLocation = opportunity.location.toLowerCase()
    
    if (profileLocation === opportunityLocation) {
      score += 20
    } else if (opportunityLocation.includes(profileLocation) || profileLocation.includes(opportunityLocation)) {
      score += 10
    }
  }
  
  // Remote work preference
  if (opportunity.is_remote) {
    score += 5
  }
  
  return score
}

/**
 * Gets opportunities matched to a user profile
 */
export async function getMatchedOpportunities(profile: Profile, limit = 10) {
  // Get all open opportunities
  const { opportunities } = await getOpportunities({
    status: 'open',
    limit: 50,
  }).catch(() => ({ opportunities: [], count: 0 }))
  
  // Calculate match scores
  const scoredOpportunities = opportunities.map(opportunity => ({
    opportunity,
    score: calculateMatchScore(profile, opportunity)
  }))
  
  // Sort by score (descending)
  scoredOpportunities.sort((a, b) => b.score - a.score)
  
  // Group opportunities by match level
  const highMatches = scoredOpportunities
    .filter(item => item.score >= 30)
    .map(item => item.opportunity)
    .slice(0, limit)
    
  const mediumMatches = scoredOpportunities
    .filter(item => item.score >= 15 && item.score < 30)
    .map(item => item.opportunity)
    .slice(0, limit)
    
  const otherMatches = scoredOpportunities
    .filter(item => item.score < 15)
    .map(item => item.opportunity)
    .slice(0, limit)
  
  return {
    highMatches,
    mediumMatches,
    otherMatches,
    allMatches: [...highMatches, ...mediumMatches, ...otherMatches]
  }
} 