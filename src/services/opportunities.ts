import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Opportunity = Database['public']['Tables']['opportunities']['Row']
type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert']
type OpportunityUpdate = Database['public']['Tables']['opportunities']['Update']

/**
 * Get all opportunities with optional filtering
 */
export async function getOpportunities({
  type,
  status = 'active',
  limit = 10,
  offset = 0,
}: {
  type?: string
  status?: string
  limit?: number
  offset?: number
} = {}) {
  let query = supabase
    .from('opportunities')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (type) {
    query = query.eq('opportunity_type', type)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching opportunities:', error)
    throw new Error(`Failed to fetch opportunities: ${error.message}`)
  }
  
  return data
}

/**
 * Get a single opportunity by ID
 */
export async function getOpportunityById(id: string) {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error(`Error fetching opportunity ${id}:`, error)
    throw new Error(`Failed to fetch opportunity: ${error.message}`)
  }
  
  return data
}

/**
 * Create a new opportunity
 */
export async function createOpportunity(opportunity: OpportunityInsert) {
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

/**
 * Update an existing opportunity
 */
export async function updateOpportunity(id: string, updates: OpportunityUpdate) {
  const { data, error } = await supabase
    .from('opportunities')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error(`Error updating opportunity ${id}:`, error)
    throw new Error(`Failed to update opportunity: ${error.message}`)
  }
  
  return data
}

/**
 * Delete an opportunity
 */
export async function deleteOpportunity(id: string) {
  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error(`Error deleting opportunity ${id}:`, error)
    throw new Error(`Failed to delete opportunity: ${error.message}`)
  }
  
  return true
} 