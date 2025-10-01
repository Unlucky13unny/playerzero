import { supabase, supabaseAdmin } from '../supabaseClient'

export interface StatReport {
  id: string
  reporter_user_id: string
  reported_user_id: string
  screenshot_id: string
  reason: string
  additional_notes?: string
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken'
  reviewed_by?: string
  reviewed_at?: string
  admin_notes?: string
  created_at: string
  updated_at: string
}

export interface ReportedScreenshot {
  screenshot_id: string
  screenshot_url: string
  entry_date: string
  report_count: number
  screenshot_owner_id: string
  trainer_name: string
  is_blocked: boolean
  blocked_reason?: string
  total_reports: number
  pending_reports: number
  last_report_date: string
  total_xp: number
  pokemon_caught: number
  distance_walked: number
  pokestops_visited: number
  unique_pokedex_entries: number
  trainer_level: number
}

export interface ReportWithDetails extends StatReport {
  reporter_email?: string
  reporter_trainer_name?: string
  reported_email?: string
  reported_trainer_name?: string
  screenshot_url?: string
}

export const reportService = {
  // Submit a report for a screenshot
  async submitReport(
    screenshotId: string,
    reportedUserId: string,
    reason: string,
    additionalNotes?: string
  ): Promise<{ data: StatReport | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: new Error('User not authenticated') }
      }

      // Check if user already reported this screenshot
      const { data: existingReport } = await supabase
        .from('stat_reports')
        .select('id')
        .eq('reporter_user_id', user.id)
        .eq('screenshot_id', screenshotId)
        .single()

      if (existingReport) {
        return { data: null, error: new Error('You have already reported this screenshot') }
      }

      const { data, error } = await supabase
        .from('stat_reports')
        .insert([
          {
            reporter_user_id: user.id,
            reported_user_id: reportedUserId,
            screenshot_id: screenshotId,
            reason: reason,
            additional_notes: additionalNotes,
            status: 'pending'
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error submitting report:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error in submitReport:', error)
      return { data: null, error }
    }
  },

  // Check if current user has already reported a screenshot
  async hasUserReported(screenshotId: string): Promise<{ hasReported: boolean; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { hasReported: false, error: null }
      }

      const { data, error } = await supabase
        .from('stat_reports')
        .select('id')
        .eq('reporter_user_id', user.id)
        .eq('screenshot_id', screenshotId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        return { hasReported: false, error }
      }

      return { hasReported: !!data, error: null }
    } catch (error) {
      return { hasReported: false, error }
    }
  },

  // Get all reported screenshots (admin only)
  async getAllReportedScreenshots(): Promise<{ data: ReportedScreenshot[] | null; error: any }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_reported_screenshots')
        .select('*')
        .order('report_count', { ascending: false })

      if (error) {
        console.error('Error fetching reported screenshots:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error in getAllReportedScreenshots:', error)
      return { data: null, error }
    }
  },

  // Get reports for a specific screenshot (admin only)
  async getReportsForScreenshot(screenshotId: string): Promise<{ data: ReportWithDetails[] | null; error: any }> {
    try {
      // Get reports
      const { data: reports, error: reportsError } = await supabaseAdmin
        .from('stat_reports')
        .select('*')
        .eq('screenshot_id', screenshotId)
        .order('created_at', { ascending: false })

      if (reportsError) {
        console.error('Error fetching reports:', reportsError)
        return { data: null, error: reportsError }
      }

      if (!reports || reports.length === 0) {
        return { data: [], error: null }
      }

      // Get auth users for email lookup
      const { data: authResponse, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (authError) {
        console.error('Error fetching auth users:', authError)
        return { data: null, error: authError }
      }

      // Get profiles for trainer names
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, trainer_name')

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return { data: null, error: profilesError }
      }

      // Create lookup maps
      const emailMap = new Map(authResponse.users.map(u => [u.id, u.email]))
      const trainerMap = new Map(profiles?.map(p => [p.user_id, p.trainer_name]))

      // Enrich reports with user details
      const enrichedReports: ReportWithDetails[] = reports.map(report => ({
        ...report,
        reporter_email: emailMap.get(report.reporter_user_id) || 'Unknown',
        reporter_trainer_name: trainerMap.get(report.reporter_user_id) || 'Unknown',
        reported_email: emailMap.get(report.reported_user_id) || 'Unknown',
        reported_trainer_name: trainerMap.get(report.reported_user_id) || 'Unknown'
      }))

      return { data: enrichedReports, error: null }
    } catch (error) {
      console.error('Error in getReportsForScreenshot:', error)
      return { data: null, error }
    }
  },

  // Update report status (admin only)
  async updateReportStatus(
    reportId: string,
    status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken',
    adminNotes?: string
  ): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { error: new Error('User not authenticated') }
      }

      const { error } = await supabaseAdmin
        .from('stat_reports')
        .update({
          status: status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', reportId)

      if (error) {
        console.error('Error updating report status:', error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Error in updateReportStatus:', error)
      return { error }
    }
  },

  // Block a user (admin only)
  async blockUser(
    userId: string,
    reason: string
  ): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { error: new Error('User not authenticated') }
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          is_blocked: true,
          blocked_reason: reason,
          blocked_at: new Date().toISOString(),
          blocked_by: user.id
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error blocking user:', error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Error in blockUser:', error)
      return { error }
    }
  },

  // Unblock a user (admin only)
  async unblockUser(userId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          is_blocked: false,
          blocked_reason: null,
          blocked_at: null,
          blocked_by: null
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error unblocking user:', error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Error in unblockUser:', error)
      return { error }
    }
  },

  // Dismiss all reports for a screenshot (admin only)
  async dismissAllReports(screenshotId: string, adminNotes?: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { error: new Error('User not authenticated') }
      }

      const { error } = await supabaseAdmin
        .from('stat_reports')
        .update({
          status: 'dismissed',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('screenshot_id', screenshotId)
        .eq('status', 'pending')

      if (error) {
        console.error('Error dismissing reports:', error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Error in dismissAllReports:', error)
      return { error }
    }
  }
}

