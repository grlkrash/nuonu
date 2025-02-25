import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Artist = Database['public']['Tables']['artists']['Row']
type ArtistInsert = Database['public']['Tables']['artists']['Insert']
type ArtistUpdate = Database['public']['Tables']['artists']['Update']
type ArtistPreference = Database['public']['Tables']['artist_preferences']['Row']
type ArtistPreferenceInsert = Database['public']['Tables']['artist_preferences']['Insert']
type ArtistPreferenceUpdate = Database['public']['Tables']['artist_preferences']['Update']

/**
 * Get artist by user ID
 */
export async function getArtistByUserId(userId: string) {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error(`Error fetching artist for user ${userId}:`, error)
    throw new Error(`Failed to fetch artist: ${error.message}`)
  }
  
  return data
}

/**
 * Get artist by ID
 */
export async function getArtistById(id: string) {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error(`Error fetching artist ${id}:`, error)
    throw new Error(`Failed to fetch artist: ${error.message}`)
  }
  
  return data
}

/**
 * Create a new artist profile
 */
export async function createArtist(artist: ArtistInsert) {
  const { data, error } = await supabase
    .from('artists')
    .insert(artist)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating artist:', error)
    throw new Error(`Failed to create artist: ${error.message}`)
  }
  
  return data
}

/**
 * Update an existing artist profile
 */
export async function updateArtist(id: string, updates: ArtistUpdate) {
  const { data, error } = await supabase
    .from('artists')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error(`Error updating artist ${id}:`, error)
    throw new Error(`Failed to update artist: ${error.message}`)
  }
  
  return data
}

/**
 * Get artist preferences
 */
export async function getArtistPreferences(artistId: string) {
  const { data, error } = await supabase
    .from('artist_preferences')
    .select('*')
    .eq('artist_id', artistId)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching preferences for artist ${artistId}:`, error)
    throw new Error(`Failed to fetch artist preferences: ${error.message}`)
  }
  
  return data
}

/**
 * Create artist preferences
 */
export async function createArtistPreferences(preferences: ArtistPreferenceInsert) {
  const { data, error } = await supabase
    .from('artist_preferences')
    .insert(preferences)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating artist preferences:', error)
    throw new Error(`Failed to create artist preferences: ${error.message}`)
  }
  
  return data
}

/**
 * Update artist preferences
 */
export async function updateArtistPreferences(id: string, updates: ArtistPreferenceUpdate) {
  const { data, error } = await supabase
    .from('artist_preferences')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error(`Error updating artist preferences ${id}:`, error)
    throw new Error(`Failed to update artist preferences: ${error.message}`)
  }
  
  return data
} 