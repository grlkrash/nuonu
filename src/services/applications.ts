import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Application = Database['public']['Tables']['applications']['Row']
type ApplicationInsert = Database['public']['Tables']['applications']['Insert']
type ApplicationUpdate = Database['public']['Tables']['applications']['Update']

/**
 * Get applications for an artist
 */
export async function getArtistApplications(artistId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      opportunities (*)
    `)
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error(`Error fetching applications for artist ${artistId}:`, error)
    throw new Error(`Failed to fetch applications: ${error.message}`)
  }
  
  return data
}

/**
 * Get applications for an opportunity
 */
export async function getOpportunityApplications(opportunityId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      artists (*)
    `)
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error(`Error fetching applications for opportunity ${opportunityId}:`, error)
    throw new Error(`Failed to fetch applications: ${error.message}`)
  }
  
  return data
}

/**
 * Get a single application by ID
 */
export async function getApplicationById(id: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      opportunities (*),
      artists (*)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error(`Error fetching application ${id}:`, error)
    throw new Error(`Failed to fetch application: ${error.message}`)
  }
  
  return data
}

/**
 * Create a new application
 */
export async function createApplication(application: ApplicationInsert) {
  const { data, error } = await supabase
    .from('applications')
    .insert(application)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating application:', error)
    throw new Error(`Failed to create application: ${error.message}`)
  }
  
  return data
}

/**
 * Update an existing application
 */
export async function updateApplication(id: string, updates: ApplicationUpdate) {
  const { data, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error(`Error updating application ${id}:`, error)
    throw new Error(`Failed to update application: ${error.message}`)
  }
  
  return data
}

/**
 * Delete an application
 */
export async function deleteApplication(id: string) {
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error(`Error deleting application ${id}:`, error)
    throw new Error(`Failed to delete application: ${error.message}`)
  }
  
  return true
} 