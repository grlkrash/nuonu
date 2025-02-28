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
 * Calculate match score between artist profile and opportunity
 */
function calculateMatchScore(profile: Profile, opportunity: Opportunity): number {
  let score = 0;
  let maxScore = 0;
  
  // Match based on artistic discipline (highest weight)
  if (profile.artistic_discipline && opportunity.category) {
    maxScore += 40;
    const disciplineMatch = matchDiscipline(profile.artistic_discipline, opportunity.category);
    score += disciplineMatch * 40;
  }
  
  // Match based on experience level
  if (profile.experience_level && opportunity.eligibility) {
    maxScore += 20;
    const experienceMatch = matchExperience(profile.experience_level, opportunity.eligibility);
    score += experienceMatch * 20;
  }
  
  // Match based on location
  if (profile.location && opportunity.location) {
    maxScore += 20;
    const locationMatch = matchLocation(profile.location, opportunity.location, opportunity.is_remote);
    score += locationMatch * 20;
  }
  
  // Match based on skills and interests
  if (profile.skills || profile.interests) {
    maxScore += 20;
    const skillsMatch = matchSkillsAndInterests(
      profile.skills || '',
      profile.interests || '',
      opportunity.description || ''
    );
    score += skillsMatch * 20;
  }
  
  // If we don't have enough matching criteria, adjust the score
  if (maxScore === 0) return 50; // Default score for insufficient data
  
  // Normalize score to 0-100 range
  return Math.round((score / maxScore) * 100);
}

/**
 * Helper function to match artistic disciplines
 */
function matchDiscipline(profileDiscipline: string, opportunityCategory: string): number {
  const disciplines = {
    visual_arts: ['visual arts', 'painting', 'sculpture', 'photography', 'illustration'],
    performing_arts: ['performing arts', 'theater', 'dance', 'music', 'performance'],
    digital_media: ['digital media', 'digital art', 'new media', 'technology', 'nft'],
    literature: ['literature', 'writing', 'poetry', 'publishing'],
    film: ['film', 'video', 'cinema', 'animation'],
    mixed_media: ['mixed media', 'installation', 'multimedia'],
  };
  
  const normalizedProfile = profileDiscipline.toLowerCase();
  const normalizedCategory = opportunityCategory.toLowerCase();
  
  // Direct match
  if (normalizedProfile === normalizedCategory) return 1;
  
  // Check if they belong to the same category group
  for (const [category, keywords] of Object.entries(disciplines)) {
    const isProfileInCategory = keywords.some(k => normalizedProfile.includes(k));
    const isOpportunityInCategory = keywords.some(k => normalizedCategory.includes(k));
    
    if (isProfileInCategory && isOpportunityInCategory) return 0.8;
  }
  
  return 0.2; // Some minimal match for all arts
}

/**
 * Helper function to match experience levels
 */
function matchExperience(profileExperience: string, opportunityEligibility: string): number {
  const experienceLevels = {
    student: 1,
    emerging: 2,
    mid_career: 3,
    established: 4
  };
  
  const normalizedEligibility = opportunityEligibility.toLowerCase();
  const profileLevel = experienceLevels[profileExperience as keyof typeof experienceLevels] || 2;
  
  // If eligibility mentions "all levels" or similar
  if (normalizedEligibility.includes('all') || normalizedEligibility.includes('any')) return 1;
  
  // Match specific experience levels
  if (normalizedEligibility.includes(profileExperience)) return 1;
  
  // If eligibility mentions "emerging" and profile is student or emerging
  if (normalizedEligibility.includes('emerging') && profileLevel <= 2) return 0.8;
  
  // If eligibility mentions "established" and profile is mid_career or established
  if (normalizedEligibility.includes('established') && profileLevel >= 3) return 0.8;
  
  return 0.4; // Some minimal match
}

/**
 * Helper function to match locations
 */
function matchLocation(profileLocation: string, opportunityLocation: string, isRemote?: boolean): number {
  if (isRemote) return 1; // Remote opportunities match any location
  
  const normalizedProfile = profileLocation.toLowerCase();
  const normalizedOpportunity = opportunityLocation.toLowerCase();
  
  // Direct city/region match
  if (normalizedProfile.includes(normalizedOpportunity) || 
      normalizedOpportunity.includes(normalizedProfile)) return 1;
  
  // Country match
  const profileParts = normalizedProfile.split(',').map(p => p.trim());
  const opportunityParts = normalizedOpportunity.split(',').map(p => p.trim());
  
  const profileCountry = profileParts[profileParts.length - 1];
  const opportunityCountry = opportunityParts[opportunityParts.length - 1];
  
  if (profileCountry === opportunityCountry) return 0.8;
  
  return 0.2; // Different locations
}

/**
 * Helper function to match skills and interests
 */
function matchSkillsAndInterests(skills: string, interests: string, description: string): number {
  const normalizedDescription = description.toLowerCase();
  let matches = 0;
  let total = 0;
  
  // Check skills
  const skillsList = skills.split(',').map(s => s.trim().toLowerCase());
  skillsList.forEach(skill => {
    if (skill && normalizedDescription.includes(skill)) matches++;
    if (skill) total++;
  });
  
  // Check interests
  const interestsList = interests.split(',').map(i => i.trim().toLowerCase());
  interestsList.forEach(interest => {
    if (interest && normalizedDescription.includes(interest)) matches++;
    if (interest) total++;
  });
  
  if (total === 0) return 0.5; // No skills/interests provided
  return matches / total;
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