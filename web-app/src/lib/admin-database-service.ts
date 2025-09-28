import { supabase } from '@/lib/supabase'

export interface AdminEvaluationOverview {
  id: string
  title: string
  industry: string
  status: string
  admin_status: 'pending' | 'approved' | 'rejected' | 'under_review'
  overall_score?: number
  priority_level: 'low' | 'normal' | 'high' | 'urgent'
  funding_potential?: number
  commercial_viability?: number
  risk_assessment?: 'low' | 'medium' | 'high'
  submitted_at: string
  completed_at?: string
  admin_decision_date?: string
  student_name: string
  student_email: string
  admin_reviewer?: string
  review_count: number
  avg_mentor_rating?: number
  view_count: number
  like_count: number
  application_cohort?: string
}

export interface AdminStats {
  totalApplications: number
  pendingReview: number
  approvedApplications: number
  rejectedApplications: number
  averageScore: number
  averageFundingPotential: number
  topIndustries: Array<{ industry: string; count: number }>
  recentActivity: number
}

export interface CohortAnalysis {
  application_cohort: string
  total_applications: number
  approved_count: number
  rejected_count: number
  pending_count: number
  avg_score: number
  avg_funding_potential: number
  cohort_start: string
  cohort_end: string
  industries: string
}

export interface PerformanceMetrics {
  week_start: string
  total_submissions: number
  completed_evaluations: number
  approved_applications: number
  rejected_applications: number
  avg_score: number
  avg_funding_potential: number
  unique_industries: number
  unique_entrepreneurs: number
}

export interface AdminAction {
  user_profiles: any
  user_profiles: any
  id: string
  admin_id: string
  action_type: string
  target_id?: string
  target_type?: string
  action_details?: any
  created_at: string
}

export class AdminDatabaseService {
  // Verify admin access
  private async verifyAdminAccess(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single()
      
      return profile?.role === 'admin'
    } catch (error) {
      console.error('Admin verification error:', error)
      return false
    }
  }

  // Get admin dashboard overview
  async getAdminOverview(adminId: string): Promise<AdminStats> {
    const isAdmin = await this.verifyAdminAccess(adminId)
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    try {
      // Get basic stats
      const { data: evaluations, error: evalError } = await supabase
        .from('evaluations')
        .select(`
          id, 
          status, 
          admin_status, 
          overall_score, 
          funding_potential, 
          industry,
          submitted_at
        `)
      
      if (evalError) throw evalError

      const totalApplications = evaluations.length
      const pendingReview = evaluations.filter(e => e.admin_status === 'pending').length
      const approvedApplications = evaluations.filter(e => e.admin_status === 'approved').length
      const rejectedApplications = evaluations.filter(e => e.admin_status === 'rejected').length
      
      const completedEvals = evaluations.filter(e => e.overall_score !== null)
      const averageScore = completedEvals.length > 0 
        ? completedEvals.reduce((sum, e) => sum + (e.overall_score || 0), 0) / completedEvals.length
        : 0

      const fundingEvals = evaluations.filter(e => e.funding_potential !== null)
      const averageFundingPotential = fundingEvals.length > 0
        ? fundingEvals.reduce((sum, e) => sum + (e.funding_potential || 0), 0) / fundingEvals.length
        : 0

      // Get industry distribution
      const industryCount: Record<string, number> = {}
      evaluations.forEach(e => {
        industryCount[e.industry] = (industryCount[e.industry] || 0) + 1
      })
      
      const topIndustries = Object.entries(industryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([industry, count]) => ({ industry, count }))

      // Recent activity (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const recentActivity = evaluations.filter(e => 
        new Date(e.submitted_at) > weekAgo
      ).length

      return {
        totalApplications,
        pendingReview,
        approvedApplications,
        rejectedApplications,
        averageScore,
        averageFundingPotential,
        topIndustries,
        recentActivity
      }
    } catch (error) {
      console.error('Error fetching admin overview:', error)
      throw error
    }
  }

  // Get evaluations for admin review with filtering and sorting
  async getAdminEvaluations(
    adminId: string,
    filters: {
      status?: string
      admin_status?: string
      industry?: string
      priority_level?: string
      cohort?: string
      date_from?: string
      date_to?: string
      search?: string
    } = {},
    pagination: {
      page?: number
      limit?: number
      sort_by?: string
      sort_order?: 'asc' | 'desc'
    } = {}
  ): Promise<{ data: AdminEvaluationOverview[], count: number }> {
    const isAdmin = await this.verifyAdminAccess(adminId)
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    try {
      let query = supabase
        .from('admin_evaluation_overview')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.admin_status) query = query.eq('admin_status', filters.admin_status)
      if (filters.industry) query = query.eq('industry', filters.industry)
      if (filters.priority_level) query = query.eq('priority_level', filters.priority_level)
      if (filters.cohort) query = query.eq('application_cohort', filters.cohort)
      if (filters.date_from) query = query.gte('submitted_at', filters.date_from)
      if (filters.date_to) query = query.lte('submitted_at', filters.date_to)
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,student_name.ilike.%${filters.search}%,industry.ilike.%${filters.search}%`)
      }

      // Apply sorting
      const sortBy = pagination.sort_by || 'submitted_at'
      const sortOrder = pagination.sort_order || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const page = pagination.page || 1
      const limit = pagination.limit || 50
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      
      if (error) throw error

      return { data: data || [], count: count || 0 }
    } catch (error) {
      console.error('Error fetching admin evaluations:', error)
      throw error
    }
  }

  // Get detailed evaluation for admin review
  async getEvaluationDetails(adminId: string, evaluationId: string) {
    const isAdmin = await this.verifyAdminAccess(adminId)
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          *,
          user_profiles!evaluations_user_id_fkey(name, email, avatar_url),
          reviews(
            *,
            user_profiles!reviews_mentor_id_fkey(name, avatar_url, rating)
          )
        `)
        .eq('id', evaluationId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching evaluation details:', error)
      throw error
    }
  }

  // Update evaluation admin status
  async updateEvaluationStatus(
    adminId: string,
    evaluationId: string,
    updates: {
      admin_status?: 'pending' | 'approved' | 'rejected' | 'under_review'
      admin_notes?: string
      priority_level?: 'low' | 'normal' | 'high' | 'urgent'
      funding_potential?: number
      commercial_viability?: number
      risk_assessment?: 'low' | 'medium' | 'high'
      application_cohort?: string
    }
  ) {
    const isAdmin = await this.verifyAdminAccess(adminId)
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    try {
      const updateData = {
        ...updates,
        admin_decision_by: adminId,
        admin_decision_date: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('evaluations')
        .update(updateData)
        .eq('id', evaluationId)
        .select()
        .single()

      if (error) throw error

      // Log admin action
      await this.logAdminAction(adminId, 'evaluation_review', evaluationId, 'evaluation', {
        updates,
        previous_status: data.admin_status
      })

      return data
    } catch (error) {
      console.error('Error updating evaluation status:', error)
      throw error
    }
  }

  // Bulk update evaluations
  async bulkUpdateEvaluations(
    adminId: string,
    evaluationIds: string[],
    updates: {
      admin_status?: 'pending' | 'approved' | 'rejected' | 'under_review'
      priority_level?: 'low' | 'normal' | 'high' | 'urgent'
      application_cohort?: string
    }
  ) {
    const isAdmin = await this.verifyAdminAccess(adminId)
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    try {
      const updateData = {
        ...updates,
        admin_decision_by: adminId,
        admin_decision_date: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('evaluations')
        .update(updateData)
        .in('id', evaluationIds)
        .select()

      if (error) throw error

      // Log bulk action
      await this.logAdminAction(adminId, 'bulk_action', null, 'evaluation', {
        action: 'bulk_update',
        evaluation_ids: evaluationIds,
        updates,
        count: evaluationIds.length
      })

      return data
    } catch (error) {
      console.error('Error bulk updating evaluations:', error)
      throw error
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(adminId: string): Promise<PerformanceMetrics[]> {
    const isAdmin = await this.verifyAdminAccess(adminId)
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    try {
      const { data, error } = await supabase
        .from('admin_performance_metrics')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(26) // Last 6 months of weekly data

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching performance metrics:', error)
      throw error
    }
  }

  // Get cohort analysis
  async getCohortAnalysis(adminId: string): Promise<CohortAnalysis[]> {
    const isAdmin = await this.verifyAdminAccess(adminId)
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    try {
      const { data, error } = await supabase
        .from('admin_cohort_analysis')
        .select('*')
        .order('cohort_start', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching cohort analysis:', error)
      throw error
    }
  }

  // Get admin activity log
  async getAdminActivity(
    adminId: string,
    filters: { admin_id?: string; action_type?: string; days?: number } = {}
  ): Promise<AdminAction[]> {
    const isAdmin = await this.verifyAdminAccess(adminId)
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    try {
      let query = supabase
        .from('admin_actions')
        .select(`
          *,
          user_profiles!admin_actions_admin_id_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (filters.admin_id) query = query.eq('admin_id', filters.admin_id)
      if (filters.action_type) query = query.eq('action_type', filters.action_type)
      if (filters.days) {
        const daysAgo = new Date()
        daysAgo.setDate(daysAgo.getDate() - filters.days)
        query = query.gte('created_at', daysAgo.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching admin activity:', error)
      throw error
    }
  }

  // Log admin action
  private async logAdminAction(
    adminId: string,
    actionType: string,
    targetId?: string,
    targetType?: string,
    actionDetails?: any
  ) {
    try {
      const { error } = await supabase.rpc('log_admin_action', {
        action_type_param: actionType,
        target_id_param: targetId,
        target_type_param: targetType,
        action_details_param: actionDetails
      })

      if (error) {
        console.error('Error logging admin action:', error)
      }
    } catch (error) {
      console.error('Error in logAdminAction:', error)
    }
  }

  // Generate application report
  async generateApplicationReport(
    adminId: string,
    filters: {
      cohort?: string
      date_from?: string
      date_to?: string
      status?: string
    } = {}
  ) {
    const isAdmin = await this.verifyAdminAccess(adminId)
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    try {
      const { data: evaluations } = await supabase
        .from('admin_evaluation_overview')
        .select('*')

      if (!evaluations) return null

      // Generate report data
      const report = {
        generated_at: new Date().toISOString(),
        generated_by: adminId,
        filters,
        summary: {
          total_applications: evaluations.length,
          approved: evaluations.filter(e => e.admin_status === 'approved').length,
          rejected: evaluations.filter(e => e.admin_status === 'rejected').length,
          pending: evaluations.filter(e => e.admin_status === 'pending').length,
          avg_score: evaluations.reduce((sum, e) => sum + (e.overall_score || 0), 0) / evaluations.length,
          industries: [...new Set(evaluations.map(e => e.industry))],
          cohorts: [...new Set(evaluations.map(e => e.application_cohort).filter(Boolean))]
        },
        applications: evaluations
      }

      // Log report generation
      await this.logAdminAction(adminId, 'report_generated', null, 'system', {
        report_type: 'application_report',
        filters,
        record_count: evaluations.length
      })

      return report
    } catch (error) {
      console.error('Error generating application report:', error)
      throw error
    }
  }

  // Get filter options for admin dashboard
  async getFilterOptions(adminId: string) {
    const isAdmin = await this.verifyAdminAccess(adminId)
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    try {
      const { data: evaluations, error } = await supabase
        .from('evaluations')
        .select('industry, admin_status, application_cohort')

      if (error) throw error

      const industries = [...new Set(evaluations?.map(e => e.industry) || [])]
      const statuses = [...new Set(evaluations?.map(e => e.admin_status) || [])]
      const cohorts = [...new Set(evaluations?.map(e => e.application_cohort).filter(Boolean) || [])]

      return {
        industries: industries.sort(),
        statuses: statuses.sort(),
        cohorts: cohorts.sort(),
        priorities: ['low', 'normal', 'high', 'urgent'],
        risk_levels: ['low', 'medium', 'high']
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
      throw error
    }
  }
}

export const adminDatabaseService = new AdminDatabaseService()
