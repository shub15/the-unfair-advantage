import { supabase } from '@/lib/supabase'

// Define valid status types
export type EvaluationStatus = 
  | 'pending'
  | 'processing' 
  | 'completed'
  | 'failed'
  | 'reviewing'
  | 'mentor_completed'
  | 'admin_review'
  | 'approved'
  | 'rejected'
  | 'on_hold'

export type AdminStatus = 
  | 'pending'
  | 'under_review'
  | 'approved' 
  | 'rejected'
  | 'requires_info'
  | 'on_hold'

export class DatabaseService {
  // Check if required tables exist
  private async checkTablesExist() {
    try {
      const { error } = await supabase
        .from('evaluations')
        .select('id')
        .limit(1)
      
      return !error
    } catch (error) {
      console.log('Tables not found, they may need to be created')
      return false
    }
  }

  // Get user's evaluation statistics
  async getUserEvaluationStats(userId: string) {
    try {
      const tablesExist = await this.checkTablesExist()
      if (!tablesExist) {
        console.log('Tables do not exist, returning empty stats')
        return {
          totalIdeas: 0,
          completedEvaluations: 0,
          pendingEvaluations: 0,
          processingEvaluations: 0,
          reviewingEvaluations: 0,
          averageScore: 0,
          thisMonthIdeas: 0
        }
      }

      // Get all evaluations for the user
      const { data: evaluations, error } = await supabase
        .from('evaluations')
        .select('status, overall_score, created_at')
        .eq('user_id', userId)
      
      if (error) {
        console.error('Database error:', error)
        throw error
      }
      
      const totalIdeas = evaluations?.length || 0
      const completed = evaluations?.filter(e => e.status === 'completed' || e.status === 'approved') || []
      const pending = evaluations?.filter(e => e.status === 'pending') || []
      const processing = evaluations?.filter(e => e.status === 'processing') || []
      const reviewing = evaluations?.filter(e => e.status === 'reviewing' || e.status === 'admin_review') || []
      
      // Calculate average score from completed evaluations
      const avgScore = completed.length > 0 
        ? Math.round(completed.reduce((sum, e) => sum + (e.overall_score || 0), 0) / completed.length)
        : 0
      
      // Calculate this month's submissions
      const thisMonth = new Date()
      thisMonth.setDate(1)
      const thisMonthIdeas = evaluations?.filter(e => 
        new Date(e.created_at) >= thisMonth
      ).length || 0
      
      return {
        totalIdeas,
        completedEvaluations: completed.length,
        pendingEvaluations: pending.length,
        processingEvaluations: processing.length,
        reviewingEvaluations: reviewing.length,
        averageScore: avgScore,
        thisMonthIdeas
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return {
        totalIdeas: 0,
        completedEvaluations: 0,
        pendingEvaluations: 0,
        processingEvaluations: 0,
        reviewingEvaluations: 0,
        averageScore: 0,
        thisMonthIdeas: 0
      }
    }
  }

  // Create a new evaluation with proper status
  async createEvaluation(data: {
    user_id: string
    title: string
    description: string
    industry: string
    target_market: string
    language?: string
    input_type?: 'text' | 'image' | 'voice' | 'sketch' | 'combined'
  }) {
    try {
      const { data: evaluation, error } = await supabase
        .from('evaluations')
        .insert({
          ...data,
          status: 'pending' as EvaluationStatus,
          admin_status: 'pending' as AdminStatus,
          input_type: data.input_type || 'text',
          created_at: new Date().toISOString(),
          tata_strive_id: `TS-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        })
        .select()
        .single()
      
      if (error) throw error
      return evaluation
    } catch (error) {
      console.error('Error creating evaluation:', error)
      throw error
    }
  }

  // Update evaluation status
  async updateEvaluationStatus(
    evaluationId: string, 
    status: EvaluationStatus,
    additionalData?: Record<string, any>
  ) {
    try {
      const updateData = {
        status,
        ...additionalData,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('evaluations')
        .update(updateData)
        .eq('id', evaluationId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating evaluation status:', error)
      throw error
    }
  }

  // Update evaluation with admin data
  async updateEvaluation(evaluationId: string, updates: Record<string, any>) {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', evaluationId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating evaluation:', error)
      throw error
    }
  }

  // Get evaluation by ID
  async getEvaluationById(evaluationId: string) {
    try {
      const { data: evaluation, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          user_profiles!evaluations_user_id_fkey(name, email, avatar_url),
          application_files(*),
          reviews(
            *,
            user_profiles!reviews_mentor_id_fkey(name, avatar_url)
          )
        `)
        .eq('id', evaluationId)
        .single()
      
      if (error) throw error
      return evaluation
    } catch (error) {
      console.error('Error fetching evaluation:', error)
      throw error
    }
  }
}

export const databaseService = new DatabaseService()
