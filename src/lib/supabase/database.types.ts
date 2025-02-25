export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          artistic_discipline: string
          experience_level: string | null
          location: string | null
          bio: string | null
          portfolio_url: string | null
          wallet_addresses: Json | null
          onboarding_completed: boolean
          onboarding_step: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          artistic_discipline: string
          experience_level?: string | null
          location?: string | null
          bio?: string | null
          portfolio_url?: string | null
          wallet_addresses?: Json | null
          onboarding_completed?: boolean
          onboarding_step?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          artistic_discipline?: string
          experience_level?: string | null
          location?: string | null
          bio?: string | null
          portfolio_url?: string | null
          wallet_addresses?: Json | null
          onboarding_completed?: boolean
          onboarding_step?: number
          created_at?: string
          updated_at?: string
        }
      }
      artist_preferences: {
        Row: {
          id: string
          artist_id: string
          opportunity_types: string[] | null
          grant_types: string[] | null
          job_types: string[] | null
          gig_types: string[] | null
          min_amount: number | null
          max_amount: number | null
          regions: string[] | null
          keywords: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          opportunity_types?: string[] | null
          grant_types?: string[] | null
          job_types?: string[] | null
          gig_types?: string[] | null
          min_amount?: number | null
          max_amount?: number | null
          regions?: string[] | null
          keywords?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          opportunity_types?: string[] | null
          grant_types?: string[] | null
          job_types?: string[] | null
          gig_types?: string[] | null
          min_amount?: number | null
          max_amount?: number | null
          regions?: string[] | null
          keywords?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      opportunities: {
        Row: {
          id: string
          title: string
          description: string | null
          opportunity_type: string
          organization: string | null
          amount: number | null
          deadline: string | null
          eligibility: string | null
          application_url: string | null
          source: string | null
          source_id: string | null
          platform: string | null
          contract_address: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          opportunity_type: string
          organization?: string | null
          amount?: number | null
          deadline?: string | null
          eligibility?: string | null
          application_url?: string | null
          source?: string | null
          source_id?: string | null
          platform?: string | null
          contract_address?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          opportunity_type?: string
          organization?: string | null
          amount?: number | null
          deadline?: string | null
          eligibility?: string | null
          application_url?: string | null
          source?: string | null
          source_id?: string | null
          platform?: string | null
          contract_address?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          artist_id: string
          opportunity_id: string
          status: string
          submission_date: string | null
          response_date: string | null
          notes: string | null
          transaction_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          opportunity_id: string
          status: string
          submission_date?: string | null
          response_date?: string | null
          notes?: string | null
          transaction_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          opportunity_id?: string
          status?: string
          submission_date?: string | null
          response_date?: string | null
          notes?: string | null
          transaction_hash?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 