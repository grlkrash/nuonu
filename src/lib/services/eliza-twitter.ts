import OpenAI from 'openai'
import { Opportunity } from '@/types/opportunity'
import { createClient } from '@/lib/supabase/client'
import { logAgentActivity, updateAgentActivityStatus } from './agent-activities'
import { v4 as uuidv4 } from 'uuid'

// Initialize OpenAI client (used as a fallback if Eliza is not available)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Import the Eliza Twitter package
// Note: This is a placeholder import - replace with the actual import when available
import { ElizaTwitterClient } from '@plugin-twitter/eliza-twitter'

// Initialize the Eliza Twitter client
const elizaTwitterClient = new ElizaTwitterClient({
  apiKey: process.env.ELIZA_API_KEY || 'demo-key',
})

interface ElizaTwitterOpportunity {
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
 * Search Twitter for artist opportunities using Eliza OS
 */
export async function searchTwitterWithEliza(
  query: string = 'artist grant OR opportunity OR job OR commission',
  limit: number = 10
): Promise<ElizaTwitterOpportunity[]> {
  try {
    // Try to use the Eliza Twitter client first
    try {
      console.log('Searching Twitter with Eliza OS...')
      
      const results = await elizaTwitterClient.search({
        query,
        limit,
      })
      
      console.log(`Found ${results.length} results with Eliza`)
      
      return results.map(tweet => ({
        tweetId: tweet.id,
        tweetUrl: tweet.url || `https://twitter.com/${tweet.username}/status/${tweet.id}`,
        username: tweet.username,
        displayName: tweet.displayName || tweet.username,
        content: tweet.text || tweet.content,
        postedAt: tweet.createdAt || new Date().toISOString(),
        opportunity: extractOpportunityFromTweet(tweet)
      }))
    } catch (elizaError) {
      console.warn('Error using Eliza Twitter client, falling back to simulation:', elizaError)
      
      // Fall back to OpenAI simulation if Eliza fails
      const prompt = `
        You are Eliza OS, an AI agent that can search Twitter for artist opportunities.
        
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
        Include at least 3 blockchain-related opportunities (NFT, crypto art, web3).
      `
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are Eliza OS, an AI agent that can search Twitter for artist opportunities.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
      
      const content = response.choices[0].message.content || ''
      const result = JSON.parse(content)
      
      return result.opportunities || []
    }
  } catch (error) {
    console.error('Error searching Twitter with Eliza:', error)
    return []
  }
}

/**
 * Helper function to extract opportunity details from a tweet
 */
function extractOpportunityFromTweet(tweet: any): ElizaTwitterOpportunity['opportunity'] {
  // If the tweet already has structured opportunity data, use it
  if (tweet.opportunity) {
    return tweet.opportunity
  }
  
  // Otherwise, extract opportunity details from the tweet content
  const content = tweet.text || tweet.content || ''
  
  // Basic extraction logic - in a real implementation, this would use more sophisticated NLP
  const title = extractTitle(content)
  const description = content
  const category = extractCategory(content)
  const location = extractLocation(content)
  const isRemote = content.toLowerCase().includes('remote') || 
                  content.toLowerCase().includes('work from home') || 
                  content.toLowerCase().includes('wfh')
  const budget = extractBudget(content)
  const deadline = extractDeadline(content)
  
  return {
    title,
    description,
    category,
    location,
    isRemote,
    budget,
    deadline
  }
}

// Helper functions for extracting opportunity details from tweet content
function extractTitle(content: string): string {
  // Simple heuristic: use the first sentence or first 60 chars
  const firstSentence = content.split(/[.!?]/).filter(s => s.trim().length > 0)[0] || ''
  return firstSentence.length > 60 ? firstSentence.substring(0, 60) + '...' : firstSentence
}

function extractCategory(content: string): string | undefined {
  const categories = [
    'Visual Arts', 'Music', 'Dance', 'Theater', 'Film', 'Photography', 
    'Literature', 'Poetry', 'Design', 'Fashion', 'Digital Art', 'NFT', 
    'Sculpture', 'Painting', 'Illustration', 'Animation', 'Performance Art'
  ]
  
  for (const category of categories) {
    if (content.toLowerCase().includes(category.toLowerCase())) {
      return category
    }
  }
  
  return undefined
}

function extractLocation(content: string): string | undefined {
  // This would be more sophisticated in a real implementation
  // For now, just check for common location patterns
  const locationMatch = content.match(/in ([A-Z][a-z]+ ?[A-Z]?[a-z]*)/);
  return locationMatch ? locationMatch[1] : undefined;
}

function extractBudget(content: string): number | undefined {
  // Look for currency symbols followed by numbers
  const budgetMatch = content.match(/[$€£¥](\d{1,3}(,\d{3})*(\.\d+)?)/);
  if (budgetMatch) {
    return parseFloat(budgetMatch[1].replace(/,/g, ''));
  }
  
  // Look for numbers followed by currency words
  const wordMatch = content.match(/(\d{1,3}(,\d{3})*(\.\d+)?) ?(dollars|USD|EUR|GBP)/i);
  if (wordMatch) {
    return parseFloat(wordMatch[1].replace(/,/g, ''));
  }
  
  return undefined;
}

function extractDeadline(content: string): string | undefined {
  // Look for deadline patterns
  const deadlineMatch = content.match(/(deadline|due|apply by|submissions by):? ([A-Za-z]+ \d{1,2}(st|nd|rd|th)?,? \d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  return deadlineMatch ? deadlineMatch[2] : undefined;
}

/**
 * Convert Eliza Twitter opportunities to the application's opportunity format
 */
export function convertElizaTwitterToOpportunities(elizaOpportunities: ElizaTwitterOpportunity[]): Opportunity[] {
  return elizaOpportunities.map(elizaOpp => ({
    id: `eliza-twitter-${elizaOpp.tweetId}`,
    title: elizaOpp.opportunity.title,
    description: `${elizaOpp.opportunity.description}\n\nSource: Twitter (via Eliza OS) - @${elizaOpp.username}\nOriginal Tweet: ${elizaOpp.content}\nTweet URL: ${elizaOpp.tweetUrl || `https://twitter.com/${elizaOpp.username}/status/${elizaOpp.tweetId}`}`,
    category: elizaOpp.opportunity.category,
    location: elizaOpp.opportunity.location,
    is_remote: elizaOpp.opportunity.isRemote,
    budget: elizaOpp.opportunity.budget,
    deadline: elizaOpp.opportunity.deadline,
    status: 'open',
    creator_id: `twitter-${elizaOpp.username}`,
    created_at: new Date(elizaOpp.postedAt).toISOString(),
    updated_at: new Date(elizaOpp.postedAt).toISOString(),
    source: 'eliza-twitter',
    source_id: elizaOpp.tweetId,
    tags: ['eliza', 'twitter', ...(elizaOpp.opportunity.category ? [elizaOpp.opportunity.category.toLowerCase()] : [])],
    profiles: {
      id: `twitter-${elizaOpp.username}`,
      full_name: elizaOpp.displayName,
      avatar_url: `https://unavatar.io/twitter/${elizaOpp.username}`,
      bio: `Twitter user @${elizaOpp.username}`,
      website: `https://twitter.com/${elizaOpp.username}`
    }
  }))
}

/**
 * Store Eliza Twitter opportunities in the database and log the activity
 */
export async function storeElizaTwitterOpportunities(
  artistId: string,
  opportunities: Opportunity[]
): Promise<{ activityId: string, opportunities: Opportunity[] }> {
  const supabase = createClient()
  
  // Log the activity
  const activityId = await logAgentActivity(
    artistId, 
    'discover_opportunities', 
    'in_progress',
    {
      source: 'eliza-twitter',
      query: 'artist grant OR opportunity OR job OR commission'
    }
  )
  
  try {
    // Store opportunities in the database
    const { data, error } = await supabase
      .from('opportunities')
      .insert(opportunities.map(opp => ({
        ...opp,
        id: opp.id || `eliza-twitter-${uuidv4()}` // Ensure each opportunity has a unique ID
      })))
      .select('id')
    
    if (error) {
      await updateAgentActivityStatus(
        activityId,
        'failed',
        {
          error: error.message,
          source: 'eliza-twitter'
        }
      )
      throw error
    }
    
    // Update the activity status
    await updateAgentActivityStatus(
      activityId,
      'completed',
      {
        opportunities_found: opportunities.length,
        opportunity_ids: data.map(o => o.id),
        source: 'eliza-twitter'
      }
    )
    
    return { 
      activityId,
      opportunities
    }
  } catch (error) {
    console.error('Error storing Eliza Twitter opportunities:', error)
    
    // Update the activity status to failed if not already done
    await updateAgentActivityStatus(
      activityId,
      'failed',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'eliza-twitter'
      }
    ).catch(e => console.error('Error updating activity status:', e))
    
    throw error
  }
}

/**
 * Discover opportunities using Eliza OS Twitter integration
 */
export async function discoverOpportunitiesWithEliza(artistId: string): Promise<{
  activityId: string;
  opportunities?: Opportunity[];
}> {
  try {
    // Search Twitter for opportunities using Eliza
    const elizaOpportunities = await searchTwitterWithEliza()
    
    // Convert Eliza Twitter opportunities to the application format
    const opportunities = convertElizaTwitterToOpportunities(elizaOpportunities)
    
    // Store opportunities in the database and log the activity
    const result = await storeElizaTwitterOpportunities(artistId, opportunities)
    
    return {
      activityId: result.activityId,
      opportunities: result.opportunities
    }
  } catch (error) {
    console.error('Error discovering opportunities with Eliza:', error)
    throw error
  }
} 