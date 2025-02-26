import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { supabase } from '@/lib/supabase/client'
import { generateProfileInsights, evaluateOpportunityMatch, generateApplicationContent } from '@/lib/services/openai'
import { getMatchedOpportunities } from '@/lib/services/ai-matching'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { action, profile, opportunity, opportunityId, query } = await request.json()

    // Validate request
    if (!action) {
      return NextResponse.json(
        { error: 'Missing required parameter: action' },
        { status: 400 }
      )
    }

    // Handle different agent actions
    switch (action) {
      case 'match_opportunities':
        if (!profile) {
          return NextResponse.json(
            { error: 'Missing required parameter: profile' },
            { status: 400 }
          )
        }
        
        const matchResults = await getMatchedOpportunities(profile)
        return NextResponse.json({ results: matchResults })

      case 'evaluate_match':
        if (!profile || !opportunity) {
          return NextResponse.json(
            { error: 'Missing required parameters: profile and/or opportunity' },
            { status: 400 }
          )
        }
        
        const matchEvaluation = await evaluateOpportunityMatch(profile, opportunity)
        return NextResponse.json({ evaluation: matchEvaluation })

      case 'generate_application':
        if (!profile || !opportunity) {
          return NextResponse.json(
            { error: 'Missing required parameters: profile and/or opportunity' },
            { status: 400 }
          )
        }
        
        const applicationContent = await generateApplicationContent(profile, opportunity)
        return NextResponse.json({ content: applicationContent })

      case 'generate_insights':
        if (!profile) {
          return NextResponse.json(
            { error: 'Missing required parameter: profile' },
            { status: 400 }
          )
        }
        
        const insights = await generateProfileInsights(profile)
        return NextResponse.json({ insights })

      case 'search_opportunities':
        if (!query) {
          return NextResponse.json(
            { error: 'Missing required parameter: query' },
            { status: 400 }
          )
        }
        
        // Get opportunities from database
        const { data: opportunities, error } = await supabase
          .from('opportunities')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          throw error
        }
        
        // Use OpenAI to find relevant opportunities based on the query
        const prompt = `
          I have a search query from an artist looking for opportunities: "${query}"
          
          Here are some available opportunities:
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
          
          Return the IDs of the opportunities that are most relevant to the search query "${query}".
          Format your response as a JSON array of opportunity IDs, ordered by relevance.
          Example: ["opp-id-1", "opp-id-2", "opp-id-3"]
        `
        
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system", 
              content: "You are an expert in matching artists with relevant opportunities. Analyze the search query and available opportunities to determine the best matches. Return your response as a JSON array of opportunity IDs."
            },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
        })
        
        // Parse the response
        const responseText = completion.choices[0].message.content
        const matchedIds = JSON.parse(responseText).ids || []
        
        // Filter and return the matched opportunities
        const matchedOpportunities = opportunities.filter(opp => 
          matchedIds.includes(opp.id)
        )
        
        return NextResponse.json({ results: matchedOpportunities })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in AI agent:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
} 