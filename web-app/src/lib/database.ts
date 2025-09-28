export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          name: string
          avatar_url?: string
          role: 'entrepreneur' | 'mentor' | 'admin'
          preferred_language: string
          bio?: string
          location?: string
          website?: string
          skills?: string[]
          industries?: string[]
          experience?: number
          hourly_rate?: number
          availability?: 'available' | 'busy' | 'offline'
          rating?: number
          total_ratings?: number
          total_students?: number
          is_active: boolean
          last_login_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string
          role?: 'entrepreneur' | 'mentor' | 'admin'
          preferred_language?: string
          bio?: string
          location?: string
          website?: string
          skills?: string[]
          industries?: string[]
          experience?: number
          hourly_rate?: number
          availability?: 'available' | 'busy' | 'offline'
          rating?: number
          total_ratings?: number
          total_students?: number
          is_active?: boolean
          last_login_at?: string
        }
        Update: {
          name?: string
          avatar_url?: string
          role?: 'entrepreneur' | 'mentor' | 'admin'
          preferred_language?: string
          bio?: string
          location?: string
          website?: string
          skills?: string[]
          industries?: string[]
          experience?: number
          hourly_rate?: number
          availability?: 'available' | 'busy' | 'offline'
          rating?: number
          total_ratings?: number
          total_students?: number
          is_active?: boolean
          last_login_at?: string
        }
      }
      evaluations: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          industry: string
          target_market: string
          language: string
          status: 'pending' | 'completed' | 'failed' | 'reviewing'
          overall_score?: number
          market_viability?: number
          financial_feasibility?: number
          execution_readiness?: number
          innovation_index?: number
          scalability_potential?: number
          ai_analysis_data?: Json
          submitted_at: string
          completed_at?: string
          is_public: boolean
          view_count: number
          like_count: number
          tags?: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          title: string
          description: string
          industry: string
          target_market: string
          language?: string
          status?: 'pending' | 'completed' | 'failed' | 'reviewing'
          overall_score?: number
          market_viability?: number
          financial_feasibility?: number
          execution_readiness?: number
          innovation_index?: number
          scalability_potential?: number
          ai_analysis_data?: Json
          is_public?: boolean
          view_count?: number
          like_count?: number
          tags?: string[]
        }
        Update: {
          title?: string
          description?: string
          industry?: string
          target_market?: string
          language?: string
          status?: 'pending' | 'completed' | 'failed' | 'reviewing'
          overall_score?: number
          market_viability?: number
          financial_feasibility?: number
          execution_readiness?: number
          innovation_index?: number
          scalability_potential?: number
          ai_analysis_data?: Json
          completed_at?: string
          is_public?: boolean
          view_count?: number
          like_count?: number
          tags?: string[]
        }
      }
      reviews: {
        Row: {
          id: string
          evaluation_id: string
          mentor_id: string
          student_id: string
          overall_rating: number
          strengths: string[]
          weaknesses: string[]
          recommendations: string[]
          next_steps: string[]
          detailed_feedback?: string
          is_helpful?: boolean
          helpful_votes: number
          status: 'draft' | 'submitted' | 'reviewed'
          created_at: string
          updated_at: string
        }
        Insert: {
          evaluation_id: string
          mentor_id: string
          student_id: string
          overall_rating: number
          strengths: string[]
          weaknesses: string[]
          recommendations: string[]
          next_steps: string[]
          detailed_feedback?: string
          is_helpful?: boolean
          helpful_votes?: number
          status?: 'draft' | 'submitted' | 'reviewed'
        }
        Update: {
          overall_rating?: number
          strengths?: string[]
          weaknesses?: string[]
          recommendations?: string[]
          next_steps?: string[]
          detailed_feedback?: string
          is_helpful?: boolean
          helpful_votes?: number
          status?: 'draft' | 'submitted' | 'reviewed'
        }
      }
      mentorship: {
        Row: {
          id: string
          mentor_id: string
          student_id: string
          status: 'pending' | 'active' | 'completed' | 'cancelled'
          start_date?: string
          end_date?: string
          goals?: string[]
          progress: number
          total_reviews: number
          notes?: string
          rating?: number
          feedback?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          mentor_id: string
          student_id: string
          status?: 'pending' | 'active' | 'completed' | 'cancelled'
          start_date?: string
          end_date?: string
          goals?: string[]
          progress?: number
          total_reviews?: number
          notes?: string
          rating?: number
          feedback?: string
        }
        Update: {
          status?: 'pending' | 'active' | 'completed' | 'cancelled'
          start_date?: string
          end_date?: string
          goals?: string[]
          progress?: number
          total_reviews?: number
          notes?: string
          rating?: number
          feedback?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          mentorship_id?: string
          content: string
          type: 'text' | 'file' | 'image' | 'link'
          attachments?: string[]
          is_read: boolean
          read_at?: string
          reply_to?: string
          is_deleted: boolean
          created_at: string
          edited_at?: string
        }
        Insert: {
          sender_id: string
          receiver_id: string
          mentorship_id?: string
          content: string
          type?: 'text' | 'file' | 'image' | 'link'
          attachments?: string[]
          is_read?: boolean
          read_at?: string
          reply_to?: string
          is_deleted?: boolean
          edited_at?: string
        }
        Update: {
          content?: string
          type?: 'text' | 'file' | 'image' | 'link'
          attachments?: string[]
          is_read?: boolean
          read_at?: string
          is_deleted?: boolean
          edited_at?: string
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
      user_role: 'entrepreneur' | 'mentor' | 'admin'
      availability_status: 'available' | 'busy' | 'offline'
      evaluation_status: 'pending' | 'completed' | 'failed' | 'reviewing'
      mentorship_status: 'pending' | 'active' | 'completed' | 'cancelled'
      review_status: 'draft' | 'submitted' | 'reviewed'
      message_type: 'text' | 'file' | 'image' | 'link'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
