import { getOpportunities } from './opportunities'
import { evaluateOpportunityMatch } from './openai'
import { Profile } from '@/types/profile'
import { Opportunity } from '@/types/opportunity'

/**
 * Calculates a match score between a profile and an opportunity
 * Falls back to this method if OpenAI is not available
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
  
  // Normalize score to 0-100 range
  return Math.min(Math.round(score * 1.5), 100)
}

/**
 * Gets opportunities matched to a user profile using AI
 */
export async function getMatchedOpportunities(profile: Profile, limit = 10) {
  // Get all open opportunities
  const { opportunities } = await getOpportunities({
    status: 'open',
    limit: 50,
  }).catch(() => ({ opportunities: [], count: 0 }))
  
  // Use OpenAI for matching if available, otherwise fall back to basic matching
  const useOpenAI = process.env.OPENAI_API_KEY && opportunities.length <= 10
  
  let scoredOpportunities = []
  
  if (useOpenAI) {
    // Use OpenAI for more sophisticated matching
    const matchPromises = opportunities.map(async (opportunity) => {
      try {
        const { score, reasoning } = await evaluateOpportunityMatch(profile, opportunity)
        return {
          opportunity,
          score,
          reasoning
        }
      } catch (error) {
        // Fall back to basic matching if OpenAI fails
        return {
          opportunity,
          score: calculateMatchScore(profile, opportunity),
          reasoning: 'Matched based on keywords and location'
        }
      }
    })
    
    scoredOpportunities = await Promise.all(matchPromises)
  } else {
    // Use basic matching for all opportunities
    scoredOpportunities = opportunities.map(opportunity => ({
      opportunity,
      score: calculateMatchScore(profile, opportunity),
      reasoning: 'Matched based on keywords and location'
    }))
  }
  
  // Sort by score (descending)
  scoredOpportunities.sort((a, b) => b.score - a.score)
  
  // Group opportunities by match level
  const highMatches = scoredOpportunities
    .filter(item => item.score >= 70)
    .map(item => ({
      ...item.opportunity,
      matchScore: item.score,
      matchReason: item.reasoning
    }))
    .slice(0, limit)
    
  const mediumMatches = scoredOpportunities
    .filter(item => item.score >= 40 && item.score < 70)
    .map(item => ({
      ...item.opportunity,
      matchScore: item.score,
      matchReason: item.reasoning
    }))
    .slice(0, limit)
    
  const otherMatches = scoredOpportunities
    .filter(item => item.score < 40)
    .map(item => ({
      ...item.opportunity,
      matchScore: item.score,
      matchReason: item.reasoning
    }))
    .slice(0, limit)
  
  return {
    highMatches,
    mediumMatches,
    otherMatches,
    allMatches: [...highMatches, ...mediumMatches, ...otherMatches]
  }
} 