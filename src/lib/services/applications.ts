import { createServerSupabaseClient } from '@/lib/auth'
import { Database } from '@/lib/supabase/database.types'
import { contractManager } from '@/lib/blockchain/contracts'
import { createHash } from 'crypto'

export type Application = Database['public']['Tables']['applications']['Row']
export type ApplicationInsert = Database['public']['Tables']['applications']['Insert']
export type ApplicationUpdate = Database['public']['Tables']['applications']['Update']

// Helper to generate content hash
function generateContentHash(content: any): string {
  const contentString = JSON.stringify(content)
  return createHash('sha256').update(contentString).digest('hex')
}

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
  
  // Get blockchain status if available
  if (data.chain === 'base' && data.transaction_hash) {
    try {
      const onChainData = await contractManager.getApplicationFromBase(id)
      data.onchain_status = onChainData.status
      data.onchain_timestamp = onChainData.timestamp
    } catch (chainError) {
      console.error('Error fetching Base chain status:', chainError)
    }
  } else if (data.chain === 'zksync' && data.zksync_transaction_hash) {
    try {
      const onChainData = await contractManager.getApplicationFromZkSync(id)
      data.onchain_status = onChainData.status
      data.onchain_timestamp = onChainData.timestamp
    } catch (chainError) {
      console.error('Error fetching zkSync chain status:', chainError)
    }
  }
  
  return data
}

export async function createApplication(application: ApplicationInsert) {
  const supabase = createServerSupabaseClient()
  
  try {
    // Check if user already applied
    const { data: existingApplications, error: checkError } = await supabase
      .from('applications')
      .select('id')
      .eq('opportunity_id', application.opportunity_id)
      .eq('applicant_id', application.applicant_id)
    
    if (checkError) throw checkError
    if (existingApplications?.length) {
      throw new Error('You have already applied to this opportunity')
    }
    
    // Generate content hash for blockchain
    const contentHash = generateContentHash({
      applicant_id: application.applicant_id,
      opportunity_id: application.opportunity_id,
      proposal: application.proposal,
      portfolio_url: application.portfolio_url,
      contact_info: application.contact_info
    })
    
    // Start database transaction
    const { data, error } = await supabase
      .from('applications')
      .insert({
        ...application,
        content_hash: contentHash,
        chain_status: 'pending'
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Submit to blockchain
    try {
      // Try Base first
      const baseResult = await contractManager.submitApplicationToBase(
        data.id,
        contentHash,
        application.opportunity_id
      )
      
      // Update with Base transaction hash
      await supabase
        .from('applications')
        .update({
          transaction_hash: baseResult.transactionHash,
          chain_status: 'submitted_base',
          chain: 'base'
        })
        .eq('id', data.id)
      
      // Try zkSync as well
      try {
        const zkSyncResult = await contractManager.submitApplicationToZkSync(
          data.id,
          contentHash,
          application.opportunity_id
        )
        
        // Update with zkSync status
        await supabase
          .from('applications')
          .update({
            zksync_transaction_hash: zkSyncResult.transactionHash,
            chain_status: 'submitted_both'
          })
          .eq('id', data.id)
      } catch (zkError) {
        console.error('zkSync submission failed:', zkError)
        // Continue with Base submission only
      }
    } catch (chainError) {
      console.error('Blockchain submission failed:', chainError)
      // Update status to indicate blockchain failure
      await supabase
        .from('applications')
        .update({
          chain_status: 'failed'
        })
        .eq('id', data.id)
      
      throw new Error('Failed to submit application to blockchain')
    }
    
    return data
  } catch (error) {
    console.error('Error in createApplication:', error)
    throw error
  }
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