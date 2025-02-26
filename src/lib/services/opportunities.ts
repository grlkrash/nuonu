import { createServerSupabaseClient } from '@/lib/auth'
import { Database } from '@/lib/supabase/database.types'

export type Opportunity = Database['public']['Tables']['opportunities']['Row']
export type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert']
export type OpportunityUpdate = Database['public']['Tables']['opportunities']['Update']

export async function getOpportunities({
  limit = 10,
  offset = 0,
  status = 'open',
  category = null,
  isRemote = null,
  creatorId = null,
  searchQuery = null,
  tags = null,
}: {
  limit?: number
  offset?: number
  status?: string
  category?: string | null
  isRemote?: boolean | null
  creatorId?: string | null
  searchQuery?: string | null
  tags?: string[] | null
}) {
  const supabase = createServerSupabaseClient()
  
  let query = supabase
    .from('opportunities')
    .select('*, profiles!creator_id(full_name, avatar_url)', { count: 'exact' })
    
  // Apply filters
  if (status) {
    query = query.eq('status', status)
  }
  
  if (category) {
    query = query.eq('category', category)
  }
  
  if (isRemote !== null) {
    query = query.eq('is_remote', isRemote)
  }
  
  if (creatorId) {
    query = query.eq('creator_id', creatorId)
  }
  
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }
  
  // Filter by tags if provided
  if (tags && tags.length > 0) {
    // Use the overlap operator to find opportunities with any of the provided tags
    query = query.overlaps('tags', tags)
  }
  
  // Apply pagination
  query = query.order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  const { data, error, count } = await query
  
  if (error) {
    console.error('Error fetching opportunities:', error)
    throw new Error(`Failed to fetch opportunities: ${error.message}`)
  }
  
  return { 
    opportunities: data || [], 
    count: count || 0 
  }
}

export async function getOpportunityById(id: string) {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('opportunities')
    .select('*, profiles!creator_id(id, full_name, avatar_url, website, bio)')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching opportunity:', error)
    throw new Error(`Failed to fetch opportunity: ${error.message}`)
  }
  
  return data
}

export async function createOpportunity(opportunity: OpportunityInsert) {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('opportunities')
    .insert(opportunity)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating opportunity:', error)
    throw new Error(`Failed to create opportunity: ${error.message}`)
  }
  
  return data
}

export async function updateOpportunity(id: string, updates: OpportunityUpdate) {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('opportunities')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating opportunity:', error)
    throw new Error(`Failed to update opportunity: ${error.message}`)
  }
  
  return data
}

export async function deleteOpportunity(id: string) {
  const supabase = createServerSupabaseClient()
  
  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting opportunity:', error)
    throw new Error(`Failed to delete opportunity: ${error.message}`)
  }
  
  return true
}

export async function getOpportunityCategories() {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('opportunities')
    .select('category')
    .not('category', 'is', null)
    .order('category')
  
  if (error) {
    console.error('Error fetching categories:', error)
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }
  
  // Extract unique categories
  const categories = [...new Set(data.map(item => item.category))]
  
  return categories
}

export async function getOpportunityTags() {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('opportunities')
    .select('tags')
    .not('tags', 'is', null)
  
  if (error) {
    console.error('Error fetching tags:', error)
    throw new Error(`Failed to fetch tags: ${error.message}`)
  }
  
  // Extract unique tags from all opportunities
  const allTags = data.flatMap(item => item.tags || [])
  const uniqueTags = [...new Set(allTags)]
  
  return uniqueTags.sort()
}

export async function getOpportunitiesByTag(tag: string, limit = 10, offset = 0) {
  const supabase = createServerSupabaseClient()
  
  const { data, error, count } = await supabase
    .from('opportunities')
    .select('*, profiles!creator_id(full_name, avatar_url)', { count: 'exact' })
    .contains('tags', [tag])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) {
    console.error('Error fetching opportunities by tag:', error)
    throw new Error(`Failed to fetch opportunities by tag: ${error.message}`)
  }
  
  return { 
    opportunities: data || [], 
    count: count || 0 
  }
}

export async function getBlockchainOpportunities(limit = 10, offset = 0) {
  const blockchainTags = ['blockchain', 'crypto', 'web3', 'nft', 'dao']
  
  return getOpportunities({
    limit,
    offset,
    tags: blockchainTags,
    status: 'open'
  })
} 