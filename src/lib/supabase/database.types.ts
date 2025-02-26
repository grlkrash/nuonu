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
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          full_name: string | null
          bio: string | null
          website: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string | null
          full_name?: string | null
          bio?: string | null
          website?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          full_name?: string | null
          bio?: string | null
          website?: string | null
          avatar_url?: string | null
        }
      }
      opportunities: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          title: string
          description: string
          requirements: string | null
          budget: number | null
          deadline: string | null
          status: string
          creator_id: string
          category: string | null
          location: string | null
          is_remote: boolean
          tags: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          title: string
          description: string
          requirements?: string | null
          budget?: number | null
          deadline?: string | null
          status?: string
          creator_id: string
          category?: string | null
          location?: string | null
          is_remote?: boolean
          tags?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          title?: string
          description?: string
          requirements?: string | null
          budget?: number | null
          deadline?: string | null
          status?: string
          creator_id?: string
          category?: string | null
          location?: string | null
          is_remote?: boolean
          tags?: string[] | null
        }
      }
      applications: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          opportunity_id: string
          applicant_id: string
          proposal: string
          status: string
          portfolio_url: string | null
          contact_info: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          opportunity_id: string
          applicant_id: string
          proposal: string
          status?: string
          portfolio_url?: string | null
          contact_info?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          opportunity_id?: string
          applicant_id?: string
          proposal?: string
          status?: string
          portfolio_url?: string | null
          contact_info?: string | null
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
      opportunity_status: 'open' | 'closed' | 'draft' | 'archived'
      application_status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
    }
  }
} 