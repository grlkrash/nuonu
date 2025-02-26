import { getOpportunities } from './opportunities'
import { evaluateOpportunityMatch } from './openai'
import { Profile } from '@/types/profile'
import { Opportunity } from '@/types/opportunity'
import { supabase } from '@/lib/supabase/client'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

interface MatchResult {
  highMatches: Opportunity[]
  mediumMatches: Opportunity[]
  otherMatches: Opportunity[]
}

export async function getMatchedOpportunities(
  profile: Profile,
  limit: number = 5
): Promise<MatchResult> {
  try {
    // Get all opportunities from the database
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('*')
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
    
    // Create a prompt for the AI to match opportunities
    const prompt = `
      I have an artist with the following profile:
      - Name: ${profile.full_name || 'Not specified'}
      - Artistic Discipline: ${profile.artistic_discipline || 'Not specified'}
      - Experience Level: ${profile.experience_level || 'Not specified'}
      - Location: ${profile.location || 'Not specified'}
      - Bio: ${profile.bio || 'Not specified'}
      - Skills: ${profile.skills?.join(', ') || 'Not specified'}
      
      I have the following opportunities. For each opportunity, assign a match score from 0-100 based on how well it matches the artist's profile. Return the results as a JSON array with opportunity IDs and scores.
      
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
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system", 
          content: "You are an expert in matching artists with relevant opportunities. Analyze the artist profile and available opportunities to determine the best matches. Return your response as a JSON array with opportunity IDs and match scores from 0-100."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    })
    
    // Parse the response
    const responseText = completion.choices[0].message.content
    const matchScores = JSON.parse(responseText)
    
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
  } catch (error) {
    console.error('Error in AI matching:', error)
    
    // Fallback to basic matching if AI fails
    return fallbackMatching(profile, opportunities, limit)
  }
}

// Fallback matching function when AI is unavailable
function fallbackMatching(
  profile: Profile,
  opportunities: Opportunity[],
  limit: number
): MatchResult {
  // Simple keyword matching
  const keywords = [
    profile.artistic_discipline,
    ...(profile.skills || []),
  ].filter(Boolean).map(k => k?.toLowerCase())
  
  const scoredOpportunities = opportunities.map(opp => {
    const text = `${opp.title} ${opp.description} ${opp.eligibility}`.toLowerCase()
    
    // Calculate a simple match score based on keyword presence
    let score = 0
    keywords.forEach(keyword => {
      if (keyword && text.includes(keyword)) {
        score += 20 // Add 20 points per keyword match
      }
    })
    
    return { ...opp, matchScore: score }
  }).sort((a, b) => b.matchScore - a.matchScore)
  
  return {
    highMatches: scoredOpportunities.filter(opp => opp.matchScore >= 60).slice(0, limit),
    mediumMatches: scoredOpportunities.filter(opp => opp.matchScore >= 30 && opp.matchScore < 60).slice(0, limit),
    otherMatches: scoredOpportunities.filter(opp => opp.matchScore < 30).slice(0, limit)
  }
} 