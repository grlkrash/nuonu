import { getOpportunities } from './opportunities'
import { evaluateOpportunityMatch } from './openai'
import { Profile } from '@/types/profile'
import { Opportunity } from '@/types/opportunity'
import { supabase } from '@/lib/supabase/client'

// Import OpenAI with error handling
let OpenAI: any
let openai: any = null

try {
  // Dynamic import to avoid build errors
  OpenAI = require('openai').OpenAI
  
  // Initialize OpenAI client if API key is available
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
} catch (error) {
  console.error('Failed to import or initialize OpenAI client:', error)
}

/**
 * Calculates a match score between a profile and an opportunity
 * Falls back to this method if OpenAI is not available
 */
export function calculateMatchScore(profile: Profile, opportunity: Opportunity): number {
  let score = 0
  
  // Extract profile interests and skills
  const interests = Array.isArray(profile.interests) 
    ? profile.interests 
    : (profile.interests?.split(',').map(i => i.trim().toLowerCase()) || [])
  
  const skills = Array.isArray(profile.skills) 
    ? profile.skills 
    : (profile.skills?.split(',').map(s => s.trim().toLowerCase()) || [])
  
  // Extract opportunity text for matching
  const opportunityText = [
    opportunity.title,
    opportunity.description,
    opportunity.requirements,
    opportunity.category,
    opportunity.eligibility
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  
  // Match interests (weighted)
  interests.forEach(interest => {
    if (interest && opportunityText.includes(interest.toLowerCase())) {
      score += 10
    }
  })
  
  // Match skills (weighted higher)
  skills.forEach(skill => {
    if (skill && opportunityText.includes(skill.toLowerCase())) {
      score += 15
    }
  })
  
  // Artistic discipline matching (weighted highest)
  if (profile.artistic_discipline && opportunity.category) {
    const discipline = profile.artistic_discipline.toLowerCase()
    const category = opportunity.category.toLowerCase()
    
    if (discipline === category) {
      score += 25
    } else if (category.includes(discipline) || discipline.includes(category)) {
      score += 15
    }
  }
  
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
  
  // Experience level matching
  if (profile.experience_level && opportunity.experience_level) {
    if (profile.experience_level === opportunity.experience_level) {
      score += 15
    }
  }
  
  // Normalize score to 0-100 range
  return Math.min(Math.round(score * 1.2), 100)
}

export interface MatchResult {
  highMatches: Opportunity[]
  mediumMatches: Opportunity[]
  otherMatches: Opportunity[]
}

/**
 * Gets opportunities matched to a user profile
 * Uses OpenAI for intelligent matching with fallback to algorithm-based matching
 */
export async function getMatchedOpportunities(
  profile: Profile,
  limit: number = 5
): Promise<MatchResult> {
  try {
    // Get all open opportunities from the database
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    if (!opportunities || opportunities.length === 0) {
      return { highMatches: [], mediumMatches: [], otherMatches: [] }
    }
    
    // If profile is incomplete, return random opportunities
    if (!profile.artistic_discipline && !profile.bio && !profile.skills) {
      const shuffled = [...opportunities].sort(() => 0.5 - Math.random())
      return {
        highMatches: shuffled.slice(0, Math.min(limit, shuffled.length)),
        mediumMatches: [],
        otherMatches: []
      }
    }
    
    // Try AI-based matching if OpenAI is available
    if (openai && process.env.OPENAI_API_KEY) {
      try {
        return await aiBasedMatching(profile, opportunities, limit)
      } catch (aiError) {
        console.error('AI-based matching failed, falling back to algorithm:', aiError)
        // Fall back to algorithm-based matching
        return algorithmBasedMatching(profile, opportunities, limit)
      }
    } else {
      // Use algorithm-based matching if OpenAI is not available
      return algorithmBasedMatching(profile, opportunities, limit)
    }
  } catch (error) {
    console.error('Error in opportunity matching:', error)
    return { highMatches: [], mediumMatches: [], otherMatches: [] }
  }
}

/**
 * AI-based matching using OpenAI
 */
async function aiBasedMatching(
  profile: Profile,
  opportunities: Opportunity[],
  limit: number
): Promise<MatchResult> {
  if (!openai) {
    throw new Error('OpenAI client not initialized')
  }
  
  // Create a prompt for the AI to match opportunities
  const prompt = `
    I have an artist with the following profile:
    - Name: ${profile.full_name || 'Not specified'}
    - Artistic Discipline: ${profile.artistic_discipline || 'Not specified'}
    - Experience Level: ${profile.experience_level || 'Not specified'}
    - Location: ${profile.location || 'Not specified'}
    - Bio: ${profile.bio || 'Not specified'}
    - Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills || 'Not specified'}
    - Interests: ${Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests || 'Not specified'}
    
    I have the following opportunities. For each opportunity, assign a match score from 0-100 based on how well it matches the artist's profile. Return the results as a JSON object with an array of matches containing opportunity IDs and scores.
    
    ${opportunities.slice(0, 20).map((opp, index) => `
    Opportunity ${index + 1}:
    - ID: ${opp.id}
    - Title: ${opp.title}
    - Type: ${opp.opportunity_type}
    - Description: ${opp.description}
    - Organization: ${opp.organization}
    - Eligibility: ${opp.eligibility}
    - Amount: ${opp.amount}
    - Deadline: ${opp.deadline}
    `).join('\n')}
  `
  
  // Call OpenAI API with timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('OpenAI API request timed out')), 10000)
  })
  
  const apiPromise = openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system", 
        content: "You are an expert in matching artists with relevant opportunities. Analyze the artist profile and available opportunities to determine the best matches. Return your response as a JSON object with an array of matches containing opportunity IDs and match scores from 0-100."
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
  })
  
  // Race between API call and timeout
  const completion = await Promise.race([apiPromise, timeoutPromise]) as any
  
  // Parse the response
  const responseText = completion.choices[0].message.content
  let matchScores
  
  try {
    matchScores = JSON.parse(responseText)
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', parseError)
    throw new Error('Invalid response format from OpenAI')
  }
  
  if (!matchScores.matches || !Array.isArray(matchScores.matches)) {
    throw new Error('Invalid matches format in OpenAI response')
  }
  
  // Sort opportunities by match score
  const scoredOpportunities = opportunities.map(opp => {
    const matchInfo = matchScores.matches.find((m: any) => m.id === opp.id)
    return {
      ...opp,
      matchScore: matchInfo ? matchInfo.score : 0
    }
  }).sort((a, b) => b.matchScore - a.matchScore)
  
  // Categorize matches
  const highMatches = scoredOpportunities
    .filter(opp => opp.matchScore >= 80)
    .slice(0, limit)
  
  const mediumMatches = scoredOpportunities
    .filter(opp => opp.matchScore >= 60 && opp.matchScore < 80)
    .slice(0, limit)
  
  const otherMatches = scoredOpportunities
    .filter(opp => opp.matchScore < 60)
    .slice(0, limit)
  
  return { highMatches, mediumMatches, otherMatches }
}

/**
 * Algorithm-based matching when AI is unavailable
 */
function algorithmBasedMatching(
  profile: Profile,
  opportunities: Opportunity[],
  limit: number
): MatchResult {
  const scoredOpportunities = opportunities.map(opp => ({
    ...opp,
    matchScore: calculateMatchScore(profile, opp)
  })).sort((a, b) => b.matchScore - a.matchScore)
  
  return {
    highMatches: scoredOpportunities.filter(opp => opp.matchScore >= 75).slice(0, limit),
    mediumMatches: scoredOpportunities.filter(opp => opp.matchScore >= 50 && opp.matchScore < 75).slice(0, limit),
    otherMatches: scoredOpportunities.filter(opp => opp.matchScore < 50).slice(0, limit)
  }
} 