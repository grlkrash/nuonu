import OpenAI from 'openai'
import { Opportunity } from '@/types/opportunity'

// Initialize OpenAI client (used as a proxy for Grok API in this demo)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface TwitterOpportunity {
  tweetId: string
  tweetUrl: string
  username: string
  displayName: string
  content: string
  postedAt: string
  opportunity: {
    title: string
    description: string
    category?: string
    location?: string
    isRemote?: boolean
    budget?: number
    deadline?: string
  }
}

/**
 * Search Twitter for artist opportunities using the Grok API
 * Note: This is a simulated implementation using OpenAI as a proxy
 */
export async function searchTwitterForOpportunities(
  query: string = 'artist grant OR opportunity OR job OR commission',
  limit: number = 10
): Promise<TwitterOpportunity[]> {
  try {
    // In a real implementation, this would use the Grok API to search Twitter
    // For this demo, we'll simulate the results using OpenAI
    
    const prompt = `
      Generate ${limit} simulated Twitter posts about artist opportunities, grants, jobs, or commissions.
      
      For each opportunity, include:
      1. A realistic tweet ID (numeric string)
      2. A Twitter username
      3. A display name
      4. Tweet content (max 280 chars)
      5. Posted date (within the last week)
      6. Extracted opportunity details:
         - Title
         - Description
         - Category (e.g., Visual Arts, Music, etc.)
         - Location (if mentioned)
         - Whether it's remote (true/false)
         - Budget amount (if mentioned)
         - Deadline (if mentioned)
      
      Format your response as a JSON array of objects with the following structure:
      [
        {
          "tweetId": "string",
          "tweetUrl": "string",
          "username": "string",
          "displayName": "string",
          "content": "string",
          "postedAt": "string",
          "opportunity": {
            "title": "string",
            "description": "string",
            "category": "string",
            "location": "string",
            "isRemote": boolean,
            "budget": number,
            "deadline": "string"
          }
        }
      ]
      
      Make the opportunities diverse and realistic, including various art forms, locations, and budgets.
    `
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a system that simulates Twitter search results for artist opportunities.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
    
    const content = response.choices[0].message.content || ''
    const result = JSON.parse(content)
    
    return result
  } catch (error) {
    console.error('Error searching Twitter for opportunities:', error)
    return []
  }
}

/**
 * Convert Twitter opportunities to the application's opportunity format
 */
export function convertTwitterToOpportunities(twitterOpportunities: TwitterOpportunity[]): Opportunity[] {
  return twitterOpportunities.map(twitterOpp => ({
    id: `twitter-${twitterOpp.tweetId}`,
    title: twitterOpp.opportunity.title,
    description: `${twitterOpp.opportunity.description}\n\nSource: Twitter - @${twitterOpp.username}\nOriginal Tweet: ${twitterOpp.content}\nTweet URL: https://twitter.com/${twitterOpp.username}/status/${twitterOpp.tweetId}`,
    category: twitterOpp.opportunity.category,
    location: twitterOpp.opportunity.location,
    is_remote: twitterOpp.opportunity.isRemote,
    budget: twitterOpp.opportunity.budget,
    deadline: twitterOpp.opportunity.deadline,
    status: 'open',
    creator_id: `twitter-${twitterOpp.username}`,
    created_at: new Date(twitterOpp.postedAt).toISOString(),
    updated_at: new Date(twitterOpp.postedAt).toISOString(),
    profiles: {
      id: `twitter-${twitterOpp.username}`,
      full_name: twitterOpp.displayName,
      avatar_url: `https://unavatar.io/twitter/${twitterOpp.username}`,
      bio: `Twitter user @${twitterOpp.username}`,
      website: `https://twitter.com/${twitterOpp.username}`
    }
  }))
} 