import { supabase, supabaseAdmin } from '../supabaseClient'

export interface AdminUserData {
  id: string
  email: string
  trainer_name: string
  is_paid_user: boolean
  subscription_type?: string
  subscription_expires_at?: string
  trial_active: boolean
  trial_expires_at?: string
  created_at: string
  last_sign_in_at?: string | null
  profile_complete: boolean
}

export interface AdminStats {
  total_users: number
  active_sessions: number
  paid_users: number
  trial_users: number
  monthly_revenue: number
  support_tickets: number
}

export interface StatEntry {
  id: string
  user_id: string
  profile_id: string
  distance_walked: number
  pokemon_caught: number
  pokestops_visited: number
  total_xp: number
  unique_pokedex_entries: number
  trainer_level: number
  entry_date: string
  created_at: string
  trainer_name?: string
  trainer_code?: string
  email?: string
}

export const adminService = {
  // Get all users with their profile data
  async getAllUsers(): Promise<{ data: AdminUserData[] | null; error: any }> {
    try {      
      // Step 1: Get all users from Supabase auth table
      const { data: authResponse, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (authError) {
        console.error('❌ Error fetching auth users:', authError)
        return { data: null, error: authError }
      }

      const authUsers = authResponse.users
      
      // Step 2: Get all users from profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profileError) {
        console.error('❌ Error fetching profiles:', profileError)
        return { data: null, error: profileError }
      }

      // Step 3: Combine results based on user.id == profiles.user_id
      const joinedData: AdminUserData[] = authUsers.map(authUser => {
        // Find matching profile for this auth user
        const matchingProfile = profiles.find(profile => profile.user_id === authUser.id)
        
        return {
          id: authUser.id,
          email: authUser.email || 'No email',
          trainer_name: matchingProfile?.trainer_name || 'Profile not set up',
          is_paid_user: matchingProfile?.is_paid_user || false,
          subscription_type: matchingProfile?.subscription_type,
          subscription_expires_at: matchingProfile?.subscription_expires_at,
          trial_active: this.isTrialActive(matchingProfile?.subscription_expires_at, matchingProfile?.is_paid_user),
          trial_expires_at: matchingProfile?.subscription_expires_at,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          profile_complete: !!matchingProfile?.trainer_name
        }
      })

      // Also include profiles that don't have corresponding auth users (edge case)
      const orphanedProfiles = profiles.filter(profile => 
        !authUsers.some(authUser => authUser.id === profile.user_id)
      )

      if (orphanedProfiles.length > 0) {
        console.log(`⚠️ Found ${orphanedProfiles.length} profiles without corresponding auth users`)
        
        const orphanedData: AdminUserData[] = orphanedProfiles.map(profile => ({
          id: profile.user_id,
          email: 'Auth user not found',
          trainer_name: profile.trainer_name || 'Unknown Trainer',
          is_paid_user: profile.is_paid_user || false,
          subscription_type: profile.subscription_type,
          subscription_expires_at: profile.subscription_expires_at,
          trial_active: this.isTrialActive(profile.subscription_expires_at, profile.is_paid_user),
          trial_expires_at: profile.subscription_expires_at,
          created_at: profile.created_at,
          last_sign_in_at: null,
          profile_complete: !!profile.trainer_name
        }))

        joinedData.push(...orphanedData)
      }
      
      return { data: joinedData, error: null }
    } catch (error) {
      console.error('❌ Unexpected error in getAllUsers:', error)
      return { data: null, error }
    }
  },

  // Helper function to determine if trial is active
  isTrialActive(expiresAt?: string, isPaid?: boolean): boolean {
    if (isPaid) return false // Paid users don't have trials
    if (!expiresAt) return false
    
    const now = new Date()
    const expiry = new Date(expiresAt)
    return expiry > now
  },

  // Get admin dashboard stats
  async getAdminStats(): Promise<{ data: AdminStats | null; error: any }> {
    try {
      // Get basic counts from profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('is_paid_user, subscription_expires_at')

      if (profileError) {
        return { data: null, error: profileError }
      }

      const totalUsers = profiles.length
      const paidUsers = profiles.filter(p => p.is_paid_user).length
      const trialUsers = profiles.filter(p => 
        this.isTrialActive(p.subscription_expires_at, p.is_paid_user)
      ).length

      // Mock data for other stats (you'll need to implement these based on your actual data structure)
      const stats: AdminStats = {
        total_users: totalUsers,
        active_sessions: Math.floor(totalUsers * 0.6), // Mock: 60% active
        paid_users: paidUsers,
        trial_users: trialUsers,
        monthly_revenue: paidUsers * 9.99, // Mock calculation
        support_tickets: Math.floor(Math.random() * 50) + 10 // Mock random tickets
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update user payment status
  async updateUserPaymentStatus(userId: string, isPaid: boolean, subscriptionType?: string): Promise<{ error: any }> {
    try {
      const updateData: any = {
        is_paid_user: isPaid,
        subscription_type: subscriptionType
      }

      if (isPaid) {
        // Set expiry to 1 year from now for paid users
        const oneYearFromNow = new Date()
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
        updateData.subscription_expires_at = oneYearFromNow.toISOString()
      } else {
        // Set trial expiry to 7 days from now
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
        updateData.subscription_expires_at = sevenDaysFromNow.toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId)

      return { error }
    } catch (error) {
      return { error }
    }
  },

  // Search users by trainer name or email
  async searchUsers(query: string): Promise<{ data: AdminUserData[] | null; error: any }> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`trainer_name.ilike.%${query}%, email.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error }
      }

      const userData: AdminUserData[] = profiles.map(profile => ({
        id: profile.user_id,
        email: 'Search by email not available', // Would need auth table access
        trainer_name: profile.trainer_name || 'Unknown Trainer',
        is_paid_user: profile.is_paid_user || false,
        subscription_type: profile.subscription_type,
        subscription_expires_at: profile.subscription_expires_at,
        trial_active: this.isTrialActive(profile.subscription_expires_at, profile.is_paid_user),
        trial_expires_at: profile.subscription_expires_at,
        created_at: profile.created_at,
        last_sign_in_at: null,
        profile_complete: !!profile.trainer_name
      }))

      return { data: userData, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async fetchStatEntries(): Promise<StatEntry[]> {
    try {
      // First, get all stat entries
      const { data: statEntries, error: statError } = await supabaseAdmin
        .from('stat_entries')
        .select('*')
        .order('created_at', { ascending: false })

      if (statError) {
        console.error('Error fetching stat entries:', statError)
        throw statError
      }

      // Then get all profiles to join manually
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, trainer_name, trainer_code')

      if (profileError) {
        console.error('Error fetching profiles:', profileError)
        throw profileError
      }

      // Create a map of profiles for quick lookup
      const profileMap = new Map(profiles?.map(profile => [profile.id, profile]) || [])

      // Transform the data to include trainer info
      const transformedData = statEntries?.map((entry: any) => {
        const profile = profileMap.get(entry.profile_id)
        return {
          ...entry,
          trainer_name: profile?.trainer_name || 'Unknown',
          trainer_code: profile?.trainer_code || 'No code'
        }
      }) || []

      return transformedData
    } catch (error) {
      console.error('Error in fetchStatEntries:', error)
      throw error
    }
  },

  // Update stat entry
  async updateStatEntry(id: string, updateData: Partial<StatEntry>): Promise<{ error: any }> {
    try {
      console.log('🔄 Updating stat entry:', { id, updateData })
      
      // Remove read-only fields that shouldn't be updated
      const { trainer_name, trainer_code, email, created_at, ...updatableData } = updateData

      console.log('📝 Cleaned update data:', updatableData)

      // Create a new admin client instance to ensure service role permissions
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      
      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      // First verify the entry exists using admin client
      const { data: existingEntry, error: fetchError } = await adminClient
        .from('stat_entries')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('❌ Error fetching existing entry:', fetchError)
        return { error: fetchError }
      }

      console.log('📋 Found existing entry:', existingEntry)

      // Perform the update using service role (bypasses RLS)
      const { data, error } = await adminClient
        .from('stat_entries')
        .update(updatableData)
        .eq('id', id)
        .select()

      console.log('📊 Update result:', { data, error })

      if (error) {
        console.error('❌ Error updating stat entry:', error)
        return { error }
      }

      if (!data || data.length === 0) {
        console.error('❌ No rows were updated')
        return { error: new Error('No rows were updated') }
      }

      console.log('✅ Successfully updated stat entry:', data[0])
      return { error: null }
    } catch (error) {
      console.error('❌ Error in updateStatEntry:', error)
      return { error }
    }
  },

  // Screenshot moderation functions
  async getAllScreenshots(): Promise<{ data: any[] | null; error: any }> {
    try {      
      // First get profiles with screenshots
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, trainer_name, profile_screenshot_url, created_at, is_flagged, flagged_reason, flagged_at')
        .not('profile_screenshot_url', 'is', null)
        .neq('profile_screenshot_url', '')
        .order('created_at', { ascending: false })

      if (profileError) {
        console.error('Error fetching profiles with screenshots:', profileError)
        return { data: null, error: profileError }
      }

      if (!profiles || profiles.length === 0) {
        console.log('No profiles with screenshots found')
        return { data: [], error: null }
      }

      console.log(`✅ Found ${profiles.length} profiles with screenshots`)

      // Get user emails from auth table
      const { data: authResponse, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (authError) {
        console.error('Error fetching auth users:', authError)
        return { data: null, error: authError }
      }

      const authUsers = authResponse.users

      // Create a map of user_id to email for quick lookup
      const emailMap = new Map(authUsers.map(user => [user.id, user.email || 'No email']))

      // Combine profiles with emails
      const profilesWithEmails = profiles.map(profile => ({
        ...profile,
        email: emailMap.get(profile.user_id) || 'Email not found'
      }))
      
      return { data: profilesWithEmails, error: null }
    } catch (error) {
      console.error('Error in getAllScreenshots:', error)
      return { data: null, error }
    }
  },

  async flagScreenshot(profileId: string, reason: string): Promise<{ error: any }> {
    try {
      console.log('🚩 Flagging screenshot:', { profileId, profileIdType: typeof profileId, reason })
      
      // Create admin client for consistent permissions
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      const supabaseUrlForFlag = import.meta.env.VITE_SUPABASE_URL
      const supabaseServiceRoleKeyForFlag = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      
      const adminClientForFlag = createSupabaseClient(supabaseUrlForFlag, supabaseServiceRoleKeyForFlag, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      // First verify the profile exists
      const { data: existingProfile, error: fetchError } = await adminClientForFlag
        .from('profiles')
        .select('id, trainer_name, is_flagged, profile_screenshot_url')
        .eq('id', profileId)
        .single()
      
      console.log('🔍 Profile lookup result:', { existingProfile, fetchError })
      
      if (fetchError) {
        console.error('❌ Error fetching profile for flagging:', fetchError)
        
        // Try to see what profiles exist
        const { data: allProfiles } = await adminClientForFlag
          .from('profiles')
          .select('id, trainer_name')
          .not('profile_screenshot_url', 'is', null)
          .limit(5)
        
        console.log('🔍 Sample of existing profiles with screenshots:', allProfiles)
        return { error: fetchError }
      }

      if (!existingProfile) {
        console.log('⚠️ Profile not found with ID:', profileId)
        return { error: new Error('Profile not found') }
      }

      console.log('📋 Found profile to flag:', existingProfile)
      
      const updateData = {
        is_flagged: true,
        flagged_reason: reason,
        flagged_at: new Date().toISOString()
      }
      
      console.log('📝 Update data:', updateData)

      const { data, error, count } = await adminClientForFlag
        .from('profiles')
        .update(updateData)
        .eq('id', profileId)
        .select('id, trainer_name, is_flagged, flagged_reason, flagged_at')

      console.log('📊 Flag update result:', { data, error, count, dataLength: data?.length })

      if (error) {
        console.error('❌ Error flagging screenshot in database:', error)
        return { error }
      }

      if (!data || data.length === 0) {
        console.error('❌ No profile was updated during flagging')
        
        // Verify profile still exists
        const { data: checkProfile, error: checkError } = await adminClientForFlag
          .from('profiles')
          .select('id, trainer_name')
          .eq('id', profileId)
          .single()
        
        console.log('🔍 Profile existence check after failed update:', { checkProfile, checkError })
        
        return { error: new Error('Profile not found or update failed') }
      }

      console.log('✅ Successfully flagged screenshot in database:', data[0])
      return { error: null }
    } catch (error) {
      console.error('❌ Error in flagScreenshot:', error)
      return { error }
    }
  },

  async unflagScreenshot(profileId: string): Promise<{ error: any }> {
    try {
      console.log('✅ Unflagging screenshot:', { profileId, profileIdType: typeof profileId })
      
      // Create admin client for consistent permissions
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      const supabaseUrlForUnflag = import.meta.env.VITE_SUPABASE_URL
      const supabaseServiceRoleKeyForUnflag = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      
      const adminClientForUnflag = createSupabaseClient(supabaseUrlForUnflag, supabaseServiceRoleKeyForUnflag, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      // First verify the profile exists and is currently flagged
      const { data: existingProfile, error: fetchError } = await adminClientForUnflag
        .from('profiles')
        .select('id, trainer_name, is_flagged, flagged_reason, flagged_at, profile_screenshot_url')
        .eq('id', profileId)
        .single()
      
      console.log('🔍 Profile lookup result for unflagging:', { existingProfile, fetchError })
      
      if (fetchError) {
        console.error('❌ Error fetching profile for unflagging:', fetchError)
        
        // Try to see what profiles exist
        const { data: allProfiles } = await adminClientForUnflag
          .from('profiles')
          .select('id, trainer_name, is_flagged')
          .not('profile_screenshot_url', 'is', null)
          .limit(5)
        
        console.log('🔍 Sample of existing profiles with screenshots:', allProfiles)
        return { error: fetchError }
      }

      if (!existingProfile) {
        console.log('⚠️ Profile not found with ID:', profileId)
        return { error: new Error('Profile not found') }
      }
      
      const updateData = {
        is_flagged: false,
        flagged_reason: null,
        flagged_at: null
      }
      
      console.log('📝 Unflag update data:', updateData)

      const { data, error, count } = await adminClientForUnflag
        .from('profiles')
        .update(updateData)
        .eq('id', profileId)
        .select('id, trainer_name, is_flagged, flagged_reason, flagged_at')

      console.log('📊 Unflag update result:', { data, error, count, dataLength: data?.length })

      if (error) {
        console.error('❌ Error unflagging screenshot in database:', error)
        return { error }
      }

      if (!data || data.length === 0) {
        console.error('❌ No profile was updated during unflagging')
        
        // Verify profile still exists
        const { data: checkProfile, error: checkError } = await adminClientForUnflag
          .from('profiles')
          .select('id, trainer_name, is_flagged')
          .eq('id', profileId)
          .single()
        
        console.log('🔍 Profile existence check after failed unflag update:', { checkProfile, checkError })
        
        return { error: new Error('Profile not found or update failed') }
      }

      console.log('✅ Successfully unflagged screenshot in database:', data[0])
      console.log('✅ Confirmed unflag status:', {
        is_flagged: data[0].is_flagged,
        flagged_reason: data[0].flagged_reason,
        flagged_at: data[0].flagged_at
      })
      return { error: null }
    } catch (error) {
      console.error('❌ Error in unflagScreenshot:', error)
      return { error }
    }
  },

  async deleteScreenshot(profileId: string): Promise<{ error: any }> {
    try {
      console.log('🗑️ Deleting screenshot:', { profileId, profileIdType: typeof profileId })
      
      // Create admin client first for consistent permissions
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      const supabaseUrlForDelete = import.meta.env.VITE_SUPABASE_URL
      const supabaseServiceRoleKeyForDelete = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      
      const adminClientForDelete = createSupabaseClient(supabaseUrlForDelete, supabaseServiceRoleKeyForDelete, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      // First, get the current screenshot URL to delete from storage
      const { data: profile, error: fetchError } = await adminClientForDelete
        .from('profiles')
        .select('id, user_id, trainer_name, profile_screenshot_url')
        .eq('id', profileId)
        .single()
      
      console.log('🔍 Database query result:', { profile, fetchError })

      if (fetchError) {
        console.error('❌ Error fetching profile for deletion:', fetchError)
        
        // Let's try to see what profiles actually exist
        const { data: allProfiles } = await adminClientForDelete
          .from('profiles')
          .select('id, trainer_name, profile_screenshot_url')
          .not('profile_screenshot_url', 'is', null)
          .limit(5)
        
        console.log('🔍 Sample of existing profiles with screenshots:', allProfiles)
        return { error: fetchError }
      }

      if (!profile) {
        console.log('⚠️ Profile not found with ID:', profileId)
        return { error: new Error('Profile not found') }
      }

      if (!profile.profile_screenshot_url) {
        console.log('⚠️ No screenshot URL found for profile:', profile)
        return { error: new Error('No screenshot found for this profile') }
      }

      console.log('🔍 Found screenshot URL:', profile.profile_screenshot_url)

      // Extract the file path from the URL
      // URL format is typically: https://[project].supabase.co/storage/v1/object/public/profile-screenshots/[path]
      let filePath = ''
      try {
        const url = new URL(profile.profile_screenshot_url)
        console.log('🔗 Full URL:', profile.profile_screenshot_url)
        console.log('🔗 URL pathname:', url.pathname)
        
        const pathParts = url.pathname.split('/').filter(part => part.length > 0)
        console.log('🔗 Path parts:', pathParts)
        
        // Look for the profile-screenshots bucket specifically
        const bucketIndex = pathParts.indexOf('profile-screenshots')
        if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
          // Get everything after the bucket name
          filePath = pathParts.slice(bucketIndex + 1).join('/')
        } else {
          // Fallback: look for any bucket pattern after 'public'
          const publicIndex = pathParts.indexOf('public')
          if (publicIndex >= 0 && publicIndex < pathParts.length - 2) {
            // Skip 'public' and bucket name, get the file path
            filePath = pathParts.slice(publicIndex + 2).join('/')
          } else {
            // Last resort: assume it's just the filename
            filePath = pathParts[pathParts.length - 1] || ''
          }
        }
      } catch (urlError) {
        console.error('❌ Error parsing screenshot URL:', urlError)
        // Try alternative method - assume it's just the filename
        filePath = profile.profile_screenshot_url.split('/').pop() || ''
      }

      console.log('📁 Extracted file path:', filePath)

              // Delete from storage bucket if we have a valid file path
        if (filePath) {
          console.log('🗑️ Attempting to delete from profile-screenshots bucket...')
          console.log('📁 File path to delete:', filePath)
          
          let deletionSuccess = false

          try {
            console.log('🔍 Deleting from profile-screenshots bucket...')
            const { data: deleteData, error: storageError } = await adminClientForDelete.storage
              .from('profile-screenshots')
              .remove([filePath])

            console.log('🗑️ Storage deletion result:', { deleteData, storageError })

            if (!storageError) {
              console.log('✅ Successfully deleted from profile-screenshots bucket')
              deletionSuccess = true
            } else {
              console.log('⚠️ profile-screenshots bucket deletion failed:', storageError.message)
              
              // Try with different file path variations if the first attempt fails
              const filePathVariations = [
                filePath,
                filePath.startsWith('/') ? filePath.substring(1) : '/' + filePath,
                profile.profile_screenshot_url.split('/').pop() || '', // Just filename
                `profile-screenshots/${filePath}` // With bucket prefix
              ]
              
              console.log('🔄 Trying file path variations:', filePathVariations)
              
              for (const variation of filePathVariations) {
                if (variation && variation !== filePath) {
                  try {
                    console.log(`🔍 Trying variation: ${variation}`)
                    const { error: varError } = await adminClientForDelete.storage
                      .from('profile-screenshots')
                      .remove([variation])

                    if (!varError) {
                      console.log(`✅ Successfully deleted with variation: ${variation}`)
                      deletionSuccess = true
                      break
                    } else {
                      console.log(`⚠️ Variation ${variation} failed:`, varError.message)
                    }
                  } catch (varErr) {
                    console.log(`⚠️ Variation ${variation} error:`, varErr)
                  }
                }
              }
            }
          } catch (bucketError) {
            console.log('⚠️ profile-screenshots bucket not accessible:', bucketError)
          }

          if (!deletionSuccess) {
            console.log('⚠️ Could not delete from profile-screenshots bucket, but continuing with database update')
            console.log('🔍 You may need to manually delete the file from storage')
            // Note: We still continue with database update even if storage deletion fails
            // This ensures the UI is consistent and the admin can manually clean up storage if needed
          }
        } else {
          console.log('⚠️ No valid file path extracted, skipping storage deletion')
        }

      // Update the database to remove screenshot URL and clear flags
      console.log('📝 Updating database to remove screenshot URL...')
      console.log('📝 Profile ID for update:', profileId)
      console.log('📝 Profile data before update:', profile)
      
      const updateData = {
        profile_screenshot_url: null,
        is_flagged: false,
        flagged_reason: null,
        flagged_at: null
      }
      console.log('📝 Update data:', updateData)
      
      // Create a fresh admin client to ensure we have full permissions
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      
      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      const { data, error, count } = await adminClient
        .from('profiles')
        .update(updateData)
        .eq('id', profileId)
        .select('id, trainer_name, profile_screenshot_url')

      console.log('📊 Update result:', { data, error, count, dataLength: data?.length })

      if (error) {
        console.error('❌ Error updating database during screenshot deletion:', error)
        return { error }
      }

      if (!data || data.length === 0) {
        console.error('❌ No profile was updated during deletion')
        
        // Let's verify the profile exists with this ID
        const { data: checkProfile, error: checkError } = await adminClient
          .from('profiles')
          .select('id, trainer_name')
          .eq('id', profileId)
          .single()
        
        console.log('🔍 Profile existence check:', { checkProfile, checkError })
        
        // Also try without single() to see if there are multiple or zero results
        const { data: allMatches, error: allError } = await adminClient
          .from('profiles')
          .select('id, trainer_name')
          .eq('id', profileId)
        
        console.log('🔍 All matching profiles:', { allMatches, allError, count: allMatches?.length })
        
        return { error: new Error('Profile not found or update failed') }
      }

      console.log('✅ Successfully deleted screenshot and updated database:', data[0])
      return { error: null }
    } catch (error) {
      console.error('❌ Error in deleteScreenshot:', error)
      return { error }
    }
  },

  // Get system setting
  async getSystemSetting(key: string): Promise<{ value: string | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .single();

      return { value: data?.value || null, error };
    } catch (error) {
      return { value: null, error };
    }
  },

  // Update system setting (admin only)
  async updateSystemSetting(key: string, value: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });

      return { error };
    } catch (error) {
      return { error };
    }
  },

  // Get verification screenshots for moderation
  async getAllVerificationScreenshots(): Promise<{ data: any[] | null; error: any }> {
    try {      
      // Get stat verification screenshots with associated stat entry and profile data
      const { data: verificationScreenshots, error: screenshotError } = await supabaseAdmin
        .from('stat_verification_screenshots')
        .select(`
          id,
          user_id,
          stat_entry_id,
          screenshot_url,
          entry_date,
          created_at,
          is_flagged,
          flagged_reason,
          flagged_at,
          stat_entries!inner (
            id,
            entry_date,
            total_xp,
            pokemon_caught,
            distance_walked,
            pokestops_visited,
            unique_pokedex_entries,
            trainer_level,
            profile_id,
            profiles!inner (
              id,
              trainer_name
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (screenshotError) {
        console.error('Error fetching verification screenshots:', screenshotError)
        return { data: null, error: screenshotError }
      }

      if (!verificationScreenshots || verificationScreenshots.length === 0) {
        console.log('No verification screenshots found')
        return { data: [], error: null }
      }

      console.log(`✅ Found ${verificationScreenshots.length} verification screenshots`)

      // Get user emails from auth table
      const { data: authResponse, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (authError) {
        console.error('Error fetching auth users:', authError)
        return { data: null, error: authError }
      }

      const authUsers = authResponse.users

      // Create a map of user_id to email for quick lookup
      const emailMap = new Map(authUsers.map(user => [user.id, user.email || 'No email']))

             // Transform the data to match expected structure
       const transformedData = verificationScreenshots.map((screenshot: any) => {
         const statEntry = screenshot.stat_entries
         const profile = statEntry.profiles
         
         return {
           id: screenshot.id,
           user_id: screenshot.user_id,
           trainer_name: profile.trainer_name,
           email: emailMap.get(screenshot.user_id) || 'Email not found',
           screenshot_url: screenshot.screenshot_url,
           created_at: screenshot.created_at,
           entry_date: screenshot.entry_date,
           type: 'verification',
           // Add stat context
           stat_data: {
             total_xp: statEntry.total_xp,
             pokemon_caught: statEntry.pokemon_caught,
             distance_walked: statEntry.distance_walked,
             pokestops_visited: statEntry.pokestops_visited,
             unique_pokedex_entries: statEntry.unique_pokedex_entries,
             trainer_level: statEntry.trainer_level
           },
           // Add flagging support
           is_flagged: screenshot.is_flagged || false,
           flagged_reason: screenshot.flagged_reason || null,
           flagged_at: screenshot.flagged_at || null
         }
       })
      
      return { data: transformedData, error: null }
    } catch (error) {
      console.error('Error in getAllVerificationScreenshots:', error)
      return { data: null, error }
    }
  },

  // Get all screenshots (both profile and verification)
  async getAllScreenshotsForModeration(): Promise<{ data: any[] | null; error: any }> {
    try {
      // Get both types of screenshots
      const [profileScreenshots, verificationScreenshots] = await Promise.all([
        this.getAllScreenshots(),
        this.getAllVerificationScreenshots()
      ])

      if (profileScreenshots.error) {
        console.error('Error fetching profile screenshots:', profileScreenshots.error)
        return { data: null, error: profileScreenshots.error }
      }

      if (verificationScreenshots.error) {
        console.error('Error fetching verification screenshots:', verificationScreenshots.error)
        return { data: null, error: verificationScreenshots.error }
      }

      // Transform profile screenshots to match expected structure
      const transformedProfileScreenshots = (profileScreenshots.data || []).map(screenshot => ({
        ...screenshot,
        screenshot_url: screenshot.profile_screenshot_url,
        type: 'profile',
        stat_data: null
      }))

      // Combine and sort by creation date
      const allScreenshots = [
        ...transformedProfileScreenshots,
        ...(verificationScreenshots.data || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      return { data: allScreenshots, error: null }
    } catch (error) {
      console.error('Error in getAllScreenshotsForModeration:', error)
      return { data: null, error }
    }
  },

  // Flag verification screenshot
  async flagVerificationScreenshot(screenshotId: string, reason: string): Promise<{ error: any }> {
    try {
      console.log('🚩 Flagging verification screenshot:', { screenshotId, screenshotIdType: typeof screenshotId, reason })
      
      // Create admin client for consistent permissions
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      const supabaseUrlForFlag = import.meta.env.VITE_SUPABASE_URL
      const supabaseServiceRoleKeyForFlag = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      
      const adminClientForFlag = createSupabaseClient(supabaseUrlForFlag, supabaseServiceRoleKeyForFlag, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      // First verify the verification screenshot exists
      const { data: existingScreenshot, error: fetchError } = await adminClientForFlag
        .from('stat_verification_screenshots')
        .select('id, user_id, screenshot_url, is_flagged')
        .eq('id', screenshotId)
        .single()
      
      console.log('🔍 Verification screenshot lookup result:', { existingScreenshot, fetchError })
      
      if (fetchError) {
        console.error('❌ Error fetching verification screenshot for flagging:', fetchError)
        
        // Try to see what verification screenshots exist
        const { data: allScreenshots } = await adminClientForFlag
          .from('stat_verification_screenshots')
          .select('id, user_id')
          .limit(5)
        
        console.log('🔍 Sample of existing verification screenshots:', allScreenshots)
        return { error: fetchError }
      }

      if (!existingScreenshot) {
        console.log('⚠️ Verification screenshot not found with ID:', screenshotId)
        return { error: new Error('Verification screenshot not found') }
      }

      console.log('📋 Found verification screenshot to flag:', existingScreenshot)
      
      const updateData = {
        is_flagged: true,
        flagged_reason: reason,
        flagged_at: new Date().toISOString()
      }
      
      console.log('📝 Update data:', updateData)

      const { data, error, count } = await adminClientForFlag
        .from('stat_verification_screenshots')
        .update(updateData)
        .eq('id', screenshotId)
        .select('id, user_id, is_flagged, flagged_reason, flagged_at')

      console.log('📊 Flag update result:', { data, error, count, dataLength: data?.length })

      if (error) {
        console.error('❌ Error flagging verification screenshot in database:', error)
        return { error }
      }

      if (!data || data.length === 0) {
        console.error('❌ No verification screenshot was updated during flagging')
        
        // Verify screenshot still exists
        const { data: checkScreenshot, error: checkError } = await adminClientForFlag
          .from('stat_verification_screenshots')
          .select('id, user_id')
          .eq('id', screenshotId)
          .single()
        
        console.log('🔍 Verification screenshot existence check after failed update:', { checkScreenshot, checkError })
        
        return { error: new Error('Verification screenshot not found or update failed') }
      }

      console.log('✅ Successfully flagged verification screenshot in database:', data[0])
      return { error: null }
    } catch (error) {
      console.error('❌ Error in flagVerificationScreenshot:', error)
      return { error }
    }
  },

  // Unflag verification screenshot
  async unflagVerificationScreenshot(screenshotId: string): Promise<{ error: any }> {
    try {
      console.log('✅ Unflagging verification screenshot:', { screenshotId, screenshotIdType: typeof screenshotId })
      
      // Create admin client for consistent permissions
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      const supabaseUrlForUnflag = import.meta.env.VITE_SUPABASE_URL
      const supabaseServiceRoleKeyForUnflag = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      
      const adminClientForUnflag = createSupabaseClient(supabaseUrlForUnflag, supabaseServiceRoleKeyForUnflag, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      // First verify the verification screenshot exists and is currently flagged
      const { data: existingScreenshot, error: fetchError } = await adminClientForUnflag
        .from('stat_verification_screenshots')
        .select('id, user_id, is_flagged, flagged_reason, flagged_at, screenshot_url')
        .eq('id', screenshotId)
        .single()
      
      console.log('🔍 Verification screenshot lookup result for unflagging:', { existingScreenshot, fetchError })
      
      if (fetchError) {
        console.error('❌ Error fetching verification screenshot for unflagging:', fetchError)
        
        // Try to see what verification screenshots exist
        const { data: allScreenshots } = await adminClientForUnflag
          .from('stat_verification_screenshots')
          .select('id, user_id, is_flagged')
          .limit(5)
        
        console.log('🔍 Sample of existing verification screenshots:', allScreenshots)
        return { error: fetchError }
      }

      if (!existingScreenshot) {
        console.log('⚠️ Verification screenshot not found with ID:', screenshotId)
        return { error: new Error('Verification screenshot not found') }
      }
      
      const updateData = {
        is_flagged: false,
        flagged_reason: null,
        flagged_at: null
      }
      
      console.log('📝 Unflag update data:', updateData)

      const { data, error, count } = await adminClientForUnflag
        .from('stat_verification_screenshots')
        .update(updateData)
        .eq('id', screenshotId)
        .select('id, user_id, is_flagged, flagged_reason, flagged_at')

      console.log('📊 Unflag update result:', { data, error, count, dataLength: data?.length })

      if (error) {
        console.error('❌ Error unflagging verification screenshot in database:', error)
        return { error }
      }

      if (!data || data.length === 0) {
        console.error('❌ No verification screenshot was updated during unflagging')
        
        // Verify screenshot still exists
        const { data: checkScreenshot, error: checkError } = await adminClientForUnflag
          .from('stat_verification_screenshots')
          .select('id, user_id, is_flagged')
          .eq('id', screenshotId)
          .single()
        
        console.log('🔍 Verification screenshot existence check after failed unflag update:', { checkScreenshot, checkError })
        
        return { error: new Error('Verification screenshot not found or update failed') }
      }

      console.log('✅ Successfully unflagged verification screenshot in database:', data[0])
      console.log('✅ Confirmed unflag status:', {
        is_flagged: data[0].is_flagged,
        flagged_reason: data[0].flagged_reason,
        flagged_at: data[0].flagged_at
      })
      return { error: null }
    } catch (error) {
      console.error('❌ Error in unflagVerificationScreenshot:', error)
      return { error }
    }
  },

  // Delete verification screenshot
  async deleteVerificationScreenshot(screenshotId: string): Promise<{ error: any }> {
    try {
      console.log('🗑️ Deleting verification screenshot:', { screenshotId })
      
      // Create admin client
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      
      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      // First, get the screenshot URL to delete from storage
      const { data: screenshot, error: fetchError } = await adminClient
        .from('stat_verification_screenshots')
        .select('screenshot_url')
        .eq('id', screenshotId)
        .single()
      
      if (fetchError) {
        console.error('❌ Error fetching verification screenshot for deletion:', fetchError)
        return { error: fetchError }
      }

      if (!screenshot?.screenshot_url) {
        console.log('⚠️ No screenshot URL found')
        return { error: new Error('Screenshot not found') }
      }

      // Extract file path from URL and delete from storage
      let filePath = ''
      try {
        const url = new URL(screenshot.screenshot_url)
        const pathParts = url.pathname.split('/').filter(part => part.length > 0)
        const bucketIndex = pathParts.indexOf('stat-verification-screenshots')
        if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
          filePath = pathParts.slice(bucketIndex + 1).join('/')
        }
      } catch (urlError) {
        console.error('❌ Error parsing screenshot URL:', urlError)
        filePath = screenshot.screenshot_url.split('/').pop() || ''
      }

      // Delete from storage
      if (filePath) {
        const { error: storageError } = await adminClient.storage
          .from('stat-verification-screenshots')
          .remove([filePath])

        if (storageError) {
          console.log('⚠️ Storage deletion failed, continuing with database deletion:', storageError)
        }
      }

      // Delete from database
      const { error: deleteError } = await adminClient
        .from('stat_verification_screenshots')
        .delete()
        .eq('id', screenshotId)

      if (deleteError) {
        console.error('❌ Error deleting verification screenshot from database:', deleteError)
        return { error: deleteError }
      }

      console.log('✅ Successfully deleted verification screenshot')
      return { error: null }
    } catch (error) {
      console.error('❌ Error in deleteVerificationScreenshot:', error)
      return { error }
    }
  },

  // Get max Pokédex entries
  async getMaxPokedexEntries(): Promise<{ value: number; error: any }> {
    try {
      const { value, error } = await this.getSystemSetting('max_pokedex_entries');
      return { value: parseInt(value || '1000'), error };
    } catch (error) {
      return { value: 1000, error }; // Default fallback
    }
  },

  // Update max Pokédex entries (admin only)
  async updateMaxPokedexEntries(maxEntries: number): Promise<{ error: any }> {
    return await this.updateSystemSetting('max_pokedex_entries', maxEntries.toString());
  }
} 