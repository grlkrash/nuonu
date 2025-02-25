import { createServerSupabaseClient } from '@/lib/auth'
import { Database } from '@/lib/supabase/database.types'

export type Application = Database['public']['Tables']['applications']['Row']
export type ApplicationInsert = Database['public']['Tables']['applications']['Insert']
export type ApplicationUpdate = Database['public']['Tables']['applications']['Update']

export async function getApplicationsByOpportunityId(opportunityId: string) {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('applications')
    .select('*, profiles!applicant_id(id, full_name, avatar_url)')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching applications:', error)
    throw new Error(`Failed to fetch applications: ${error.message}`)
  }
  
  return data || []
}

export async function getApplicationsByUserId(userId: string) {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('applications')
    .select('*, opportunities!opportunity_id(*)')
    .eq('applicant_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching applications:', error)
    throw new Error(`Failed to fetch applications: ${error.message}`)
  }
  
  return data || []
}

export async function getApplicationById(id: string) {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      profiles!applicant_id(id, full_name, avatar_url, website, bio),
      opportunities!opportunity_id(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching application:', error)
    throw new Error(`Failed to fetch application: ${error.message}`)
  }
  
  return data
}

export async function createApplication(application: ApplicationInsert) {
  const supabase = createServerSupabaseClient()
  
  // Check if user already applied to this opportunity
  const { data: existingApplications, error: checkError } = await supabase
    .from('applications')
    .select('id')
    .eq('opportunity_id', application.opportunity_id)
    .eq('applicant_id', application.applicant_id)
  
  if (checkError) {
    console.error('Error checking existing applications:', checkError)
    throw new Error(`Failed to check existing applications: ${checkError.message}`)
  }
  
  if (existingApplications && existingApplications.length > 0) {
    throw new Error('You have already applied to this opportunity')
  }
  
  // Create the application
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

export async function updateApplicationStatus(id: string, status: string) {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('applications')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating application status:', error)
    throw new Error(`Failed to update application status: ${error.message}`)
  }
  
  return data
}

export async function updateApplication(id: string, updates: ApplicationUpdate) {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('applications')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating application:', error)
    throw new Error(`Failed to update application: ${error.message}`)
  }
  
  return data
}

export async function deleteApplication(id: string) {
  const supabase = createServerSupabaseClient()
  
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting application:', error)
    throw new Error(`Failed to delete application: ${error.message}`)
  }
  
  return true
}

export async function getApplicationCountByOpportunityId(opportunityId: string) {
  const supabase = createServerSupabaseClient()
  
  const { count, error } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('opportunity_id', opportunityId)
  
  if (error) {
    console.error('Error counting applications:', error)
    throw new Error(`Failed to count applications: ${error.message}`)
  }
  
  return count || 0
} 