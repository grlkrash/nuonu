import { createServerSupabaseClient } from '@/lib/auth'
import { Database } from '@/lib/supabase/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export async function getProfileById(id: string) {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching profile:', error)
    throw new Error(`Failed to fetch profile: ${error.message}`)
  }
  
  return data
}

export async function updateProfile(id: string, updates: ProfileUpdate) {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating profile:', error)
    throw new Error(`Failed to update profile: ${error.message}`)
  }
  
  return data
}

export async function uploadProfileAvatar(userId: string, file: File) {
  const supabase = createServerSupabaseClient()
  
  // Generate a unique file name
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `avatars/${fileName}`
  
  // Upload the file
  const { error: uploadError } = await supabase
    .storage
    .from('profiles')
    .upload(filePath, file)
  
  if (uploadError) {
    console.error('Error uploading avatar:', uploadError)
    throw new Error(`Failed to upload avatar: ${uploadError.message}`)
  }
  
  // Get the public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('profiles')
    .getPublicUrl(filePath)
  
  // Update the profile with the new avatar URL
  const { data, error: updateError } = await supabase
    .from('profiles')
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()
  
  if (updateError) {
    console.error('Error updating profile with avatar:', updateError)
    throw new Error(`Failed to update profile with avatar: ${updateError.message}`)
  }
  
  return data
}

export async function getProfileCompletion(profile: Profile) {
  // Define the fields that contribute to profile completion
  const fields = [
    { name: 'full_name', weight: 25 },
    { name: 'bio', weight: 25 },
    { name: 'website', weight: 25 },
    { name: 'avatar_url', weight: 25 },
  ]
  
  // Calculate completion percentage
  let completionPercentage = 0
  
  for (const field of fields) {
    if (profile[field.name as keyof Profile]) {
      completionPercentage += field.weight
    }
  }
  
  return completionPercentage
} 