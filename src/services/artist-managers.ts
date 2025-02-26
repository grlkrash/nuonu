import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type ArtistManager = Database['public']['Tables']['artist_managers']['Row']
type ArtistManagerInsert = Database['public']['Tables']['artist_managers']['Insert']
type ArtistManagerUpdate = Database['public']['Tables']['artist_managers']['Update']

/**
 * Get artist manager by user ID
 */
export async function getArtistManagerByUserId(userId: string) {
  const { data, error } = await supabase
    .from('artist_managers')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error(`Error fetching artist manager for user ${userId}:`, error)
    throw new Error(`Failed to fetch artist manager: ${error.message}`)
  }
  
  return data
}

/**
 * Get artist manager by ID
 */
export async function getArtistManagerById(id: string) {
  const { data, error } = await supabase
    .from('artist_managers')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error(`Error fetching artist manager ${id}:`, error)
    throw new Error(`Failed to fetch artist manager: ${error.message}`)
  }
  
  return data
}

/**
 * Create a new artist manager profile
 */
export async function createArtistManager(artistManager: ArtistManagerInsert) {
  const { data, error } = await supabase
    .from('artist_managers')
    .insert(artistManager)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating artist manager:', error)
    throw new Error(`Failed to create artist manager: ${error.message}`)
  }
  
  return data
}

/**
 * Update an existing artist manager profile
 */
export async function updateArtistManager(id: string, updates: ArtistManagerUpdate) {
  const { data, error } = await supabase
    .from('artist_managers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error(`Error updating artist manager ${id}:`, error)
    throw new Error(`Failed to update artist manager: ${error.message}`)
  }
  
  return data
}

/**
 * Get all artist managers
 */
export async function getAllArtistManagers() {
  const { data, error } = await supabase
    .from('artist_managers')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching artist managers:', error)
    throw new Error(`Failed to fetch artist managers: ${error.message}`)
  }
  
  return data || []
}

/**
 * Check if a user is an artist manager
 */
export async function isArtistManager(userId: string): Promise<boolean> {
  const manager = await getArtistManagerByUserId(userId).catch(() => null)
  return !!manager
} 