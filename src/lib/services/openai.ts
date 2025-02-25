import OpenAI from 'openai'
import { Profile } from '@/types/profile'
import { Opportunity } from '@/types/opportunity'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Uses OpenAI to analyze an artist profile and generate a description of their ideal opportunities
 */
export async function generateProfileInsights(profile: Profile): Promise<string> {
  try {
    const prompt = `
      Analyze this artist profile and generate a concise description of what types of opportunities would be ideal for them:
      
      Name: ${profile.full_name || 'Not provided'}
      Bio: ${profile.bio || 'Not provided'}
      Location: ${profile.location || 'Not provided'}
      Interests: ${profile.interests || 'Not provided'}
      Skills: ${profile.skills || 'Not provided'}
      
      Provide a concise summary of the ideal opportunities for this artist, including:
      1. What types of projects would match their skills
      2. What subject matters align with their interests
      3. Any location preferences to consider
      4. The artist's apparent strengths based on their profile
    `
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert in matching artists with relevant opportunities. Provide concise, specific insights.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    })
    
    return response.choices[0].message.content || ''
  } catch (error) {
    console.error('Error generating profile insights:', error)
    return 'Unable to generate profile insights at this time.'
  }
}

/**
 * Uses OpenAI to evaluate how well an opportunity matches an artist profile
 */
export async function evaluateOpportunityMatch(profile: Profile, opportunity: Opportunity): Promise<{
  score: number;
  reasoning: string;
}> {
  try {
    const prompt = `
      Evaluate how well this opportunity matches the artist's profile:
      
      ARTIST PROFILE:
      Name: ${profile.full_name || 'Not provided'}
      Bio: ${profile.bio || 'Not provided'}
      Location: ${profile.location || 'Not provided'}
      Interests: ${profile.interests || 'Not provided'}
      Skills: ${profile.skills || 'Not provided'}
      
      OPPORTUNITY:
      Title: ${opportunity.title}
      Description: ${opportunity.description}
      Requirements: ${opportunity.requirements || 'Not specified'}
      Category: ${opportunity.category || 'Not specified'}
      Location: ${opportunity.location || 'Not specified'}
      Remote: ${opportunity.is_remote ? 'Yes' : 'No'}
      
      Provide:
      1. A match score from 0-100 where 0 is no match and 100 is perfect match
      2. A brief explanation of why this opportunity is or isn't a good match
      
      Format your response as JSON:
      {
        "score": number,
        "reasoning": "explanation"
      }
    `
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert in matching artists with relevant opportunities. Analyze the match and respond with JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
    
    const content = response.choices[0].message.content || ''
    const result = JSON.parse(content)
    
    return {
      score: result.score,
      reasoning: result.reasoning
    }
  } catch (error) {
    console.error('Error evaluating opportunity match:', error)
    // Fallback to basic matching if OpenAI fails
    return {
      score: 50,
      reasoning: 'Unable to perform AI matching at this time. Using basic matching instead.'
    }
  }
}

/**
 * Uses OpenAI to generate application content based on artist profile and opportunity
 */
export async function generateApplicationContent(profile: Profile, opportunity: Opportunity): Promise<{
  message: string;
  proposal: string;
}> {
  try {
    const prompt = `
      Generate a draft application for this opportunity based on the artist's profile:
      
      ARTIST PROFILE:
      Name: ${profile.full_name || 'Not provided'}
      Bio: ${profile.bio || 'Not provided'}
      Location: ${profile.location || 'Not provided'}
      Interests: ${profile.interests || 'Not provided'}
      Skills: ${profile.skills || 'Not provided'}
      
      OPPORTUNITY:
      Title: ${opportunity.title}
      Description: ${opportunity.description}
      Requirements: ${opportunity.requirements || 'Not specified'}
      Category: ${opportunity.category || 'Not specified'}
      
      Generate:
      1. A brief introduction message (2-3 sentences) explaining why the artist is interested
      2. A more detailed proposal (1-2 paragraphs) highlighting relevant skills and approach
      
      Format your response as JSON:
      {
        "message": "introduction text",
        "proposal": "proposal text"
      }
    `
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert in helping artists apply for opportunities. Generate professional application content.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
    
    const content = response.choices[0].message.content || ''
    const result = JSON.parse(content)
    
    return {
      message: result.message,
      proposal: result.proposal
    }
  } catch (error) {
    console.error('Error generating application content:', error)
    return {
      message: '',
      proposal: ''
    }
  }
} 