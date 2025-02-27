import { OpenAI } from 'openai'
import { supabase } from '@/lib/supabase/client'
import { Profile } from '@/types/profile'
import { Opportunity } from '@/types/opportunity'
import { Application } from '@/types/application'
import { submitExternalApplication, checkApplicationStatus } from './browser-base'
import { logAgentActivity } from '@/lib/supabase/client'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Analyzes an artist's profile and generates personalized recommendations
 * for improving their grant application success rate
 */
export async function generateProfileRecommendations(profile: Profile): Promise<{
  strengths: string[];
  improvements: string[];
  opportunityTypes: string[];
}> {
  try {
    const prompt = `
      Analyze this artist profile and provide recommendations for improving their grant application success rate:
      
      Name: ${profile.full_name || 'Not provided'}
      Bio: ${profile.bio || 'Not provided'}
      Location: ${profile.location || 'Not provided'}
      Artistic Discipline: ${profile.artistic_discipline || 'Not provided'}
      Experience Level: ${profile.experience_level || 'Not provided'}
      Skills: ${profile.skills || 'Not provided'}
      Interests: ${profile.interests || 'Not provided'}
      
      Provide:
      1. Three strengths of this profile that would appeal to grant providers
      2. Three areas for improvement to increase grant success
      3. Three types of opportunities that would be a good match for this artist
      
      Format your response as JSON:
      {
        "strengths": ["strength1", "strength2", "strength3"],
        "improvements": ["improvement1", "improvement2", "improvement3"],
        "opportunityTypes": ["type1", "type2", "type3"]
      }
    `
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert in helping artists secure grants and opportunities. Provide specific, actionable recommendations.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })
    
    const content = response.choices[0].message.content || ''
    return JSON.parse(content)
  } catch (error) {
    console.error('Error generating profile recommendations:', error)
    return {
      strengths: ['Unable to analyze profile strengths at this time.'],
      improvements: ['Unable to generate improvement recommendations at this time.'],
      opportunityTypes: ['Unable to suggest opportunity types at this time.']
    }
  }
}

/**
 * Generates a complete grant application based on the artist's profile and the opportunity
 */
export async function generateGrantApplication(profile: Profile, opportunity: Opportunity): Promise<{
  artistStatement: string;
  projectDescription: string;
  budget: string;
  timeline: string;
  impactStatement: string;
}> {
  try {
    const prompt = `
      Generate a complete grant application for this opportunity based on the artist's profile:
      
      ARTIST PROFILE:
      Name: ${profile.full_name || 'Not provided'}
      Bio: ${profile.bio || 'Not provided'}
      Location: ${profile.location || 'Not provided'}
      Artistic Discipline: ${profile.artistic_discipline || 'Not provided'}
      Experience Level: ${profile.experience_level || 'Not provided'}
      Skills: ${profile.skills || 'Not provided'}
      Interests: ${profile.interests || 'Not provided'}
      
      OPPORTUNITY:
      Title: ${opportunity.title}
      Description: ${opportunity.description}
      Requirements: ${opportunity.requirements || 'Not specified'}
      Eligibility: ${opportunity.eligibility || 'Not specified'}
      Amount: ${opportunity.amount || 'Not specified'}
      
      Generate a complete grant application including:
      1. Artist statement (1 paragraph)
      2. Project description (2 paragraphs)
      3. Budget breakdown (bullet points)
      4. Project timeline (bullet points)
      5. Impact statement (1 paragraph)
      
      Format your response as JSON:
      {
        "artistStatement": "text",
        "projectDescription": "text",
        "budget": "text",
        "timeline": "text",
        "impactStatement": "text"
      }
    `
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert in writing successful grant applications for artists. Generate professional, compelling application content.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })
    
    const content = response.choices[0].message.content || ''
    return JSON.parse(content)
  } catch (error) {
    console.error('Error generating grant application:', error)
    return {
      artistStatement: '',
      projectDescription: '',
      budget: '',
      timeline: '',
      impactStatement: ''
    }
  }
}

/**
 * Analyzes an application and provides feedback for improvement
 */
export async function analyzeApplication(application: Application): Promise<{
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}> {
  try {
    const prompt = `
      Analyze this grant application and provide feedback for improvement:
      
      Application Message: ${application.message || 'Not provided'}
      Application Proposal: ${application.proposal || 'Not provided'}
      
      Provide:
      1. A score from 0-100 rating the overall quality of the application
      2. Three strengths of the application
      3. Three weaknesses or areas for improvement
      4. Three specific suggestions to improve the application
      
      Format your response as JSON:
      {
        "score": number,
        "strengths": ["strength1", "strength2", "strength3"],
        "weaknesses": ["weakness1", "weakness2", "weakness3"],
        "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
      }
    `
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert in evaluating grant applications. Provide specific, actionable feedback to help improve the application.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })
    
    const content = response.choices[0].message.content || ''
    return JSON.parse(content)
  } catch (error) {
    console.error('Error analyzing application:', error)
    return {
      score: 50,
      strengths: ['Unable to analyze application strengths at this time.'],
      weaknesses: ['Unable to analyze application weaknesses at this time.'],
      suggestions: ['Unable to generate improvement suggestions at this time.']
    }
  }
}

/**
 * Finds opportunities that match the artist's profile using AI
 */
export async function findMatchingOpportunities(profile: Profile, limit: number = 5): Promise<Opportunity[]> {
  try {
    // Get all opportunities from the database
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    if (!opportunities || opportunities.length === 0) {
      return []
    }
    
    // Create a prompt for the AI to match opportunities
    const prompt = `
      I have an artist with the following profile:
      - Name: ${profile.full_name || 'Not specified'}
      - Artistic Discipline: ${profile.artistic_discipline || 'Not specified'}
      - Experience Level: ${profile.experience_level || 'Not specified'}
      - Location: ${profile.location || 'Not specified'}
      - Bio: ${profile.bio || 'Not specified'}
      - Skills: ${profile.skills || 'Not specified'}
      - Interests: ${profile.interests || 'Not specified'}
      
      I have the following opportunities. For each opportunity, assign a match score from 0-100 based on how well it matches the artist's profile. Return the results as a JSON object with an array of matches containing opportunity IDs and scores.
      
      ${opportunities.slice(0, 20).map((opp, index) => `
      Opportunity ${index + 1}:
      - ID: ${opp.id}
      - Title: ${opp.title}
      - Type: ${opp.opportunity_type}
      - Description: ${opp.description}
      - Organization: ${opp.organization}
      - Eligibility: ${opp.eligibility || 'Not specified'}
      - Amount: ${opp.amount || 'Not specified'}
      - Deadline: ${opp.deadline || 'Not specified'}
      `).join('\n')}
      
      Format your response as JSON:
      {
        "matches": [
          {"id": "opportunity_id_1", "score": 85},
          {"id": "opportunity_id_2", "score": 72},
          ...
        ]
      }
    `
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system", 
          content: "You are an expert in matching artists with relevant opportunities. Analyze the artist profile and available opportunities to determine the best matches. Return your response as a JSON object with an array of matches containing opportunity IDs and scores."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    })
    
    // Parse the response
    const responseText = completion.choices[0].message.content
    const matchScores = JSON.parse(responseText)
    
    // Sort opportunities by match score and return top matches
    const matchedOpportunities = opportunities
      .map(opp => {
        const matchInfo = matchScores.matches.find((m: any) => m.id === opp.id)
        return {
          ...opp,
          matchScore: matchInfo ? matchInfo.score : 0
        }
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
    
    return matchedOpportunities
  } catch (error) {
    console.error('Error finding matching opportunities:', error)
    return []
  }
}

/**
 * Generates a personalized action plan for an artist to improve their grant success
 */
export async function generateActionPlan(profile: Profile): Promise<{
  shortTerm: string[];
  mediumTerm: string[];
  longTerm: string[];
}> {
  try {
    const prompt = `
      Create a personalized action plan for this artist to improve their grant application success:
      
      Name: ${profile.full_name || 'Not provided'}
      Bio: ${profile.bio || 'Not provided'}
      Location: ${profile.location || 'Not provided'}
      Artistic Discipline: ${profile.artistic_discipline || 'Not provided'}
      Experience Level: ${profile.experience_level || 'Not provided'}
      Skills: ${profile.skills || 'Not provided'}
      Interests: ${profile.interests || 'Not provided'}
      
      Provide:
      1. Three short-term actions (next 30 days)
      2. Three medium-term actions (1-3 months)
      3. Three long-term actions (3-12 months)
      
      Format your response as JSON:
      {
        "shortTerm": ["action1", "action2", "action3"],
        "mediumTerm": ["action1", "action2", "action3"],
        "longTerm": ["action1", "action2", "action3"]
      }
    `
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert career coach for artists. Create specific, actionable plans to help artists improve their grant success.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })
    
    const content = response.choices[0].message.content || ''
    return JSON.parse(content)
  } catch (error) {
    console.error('Error generating action plan:', error)
    return {
      shortTerm: ['Unable to generate short-term actions at this time.'],
      mediumTerm: ['Unable to generate medium-term actions at this time.'],
      longTerm: ['Unable to generate long-term actions at this time.']
    }
  }
}

export async function submitExternalGrantApplication(artistId: string, opportunityId: string, applicationData: any) {
  try {
    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'external_application',
      status: 'in_progress',
      details: {
        message: 'Preparing to submit external grant application',
        opportunity_id: opportunityId
      }
    })

    // Get opportunity details
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single()

    if (!opportunity) {
      throw new Error('Opportunity not found')
    }

    // Check if the opportunity has an external URL
    if (!opportunity.external_url) {
      throw new Error('This opportunity does not have an external application URL')
    }

    // Submit the application using Browser Base
    const result = await submitExternalApplication({
      artistId,
      opportunityId,
      applicationText: applicationData.text || '',
      attachments: applicationData.attachments || [],
      externalUrl: opportunity.external_url,
      formFields: applicationData.formFields || {}
    })

    if (!result.success) {
      throw new Error(result.message)
    }

    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'external_application',
      status: 'completed',
      details: {
        message: 'Successfully submitted external grant application',
        opportunity_id: opportunityId,
        submission_id: result.submissionId
      }
    })

    return {
      success: true,
      message: 'External grant application submitted successfully',
      submissionId: result.submissionId
    }
  } catch (error) {
    console.error('Error submitting external grant application:', error)
    
    await logAgentActivity({
      artist_id: artistId,
      activity_type: 'external_application',
      status: 'failed',
      details: {
        message: `Failed to submit external grant application: ${error instanceof Error ? error.message : 'Unknown error'}`,
        opportunity_id: opportunityId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return {
      success: false,
      message: `Failed to submit external grant application: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 