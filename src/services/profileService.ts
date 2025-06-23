import { supabase } from '../supabaseClient'

export type ProfileData = {
  // Trainer Information
  trainer_name: string
  trainer_code: string
  trainer_code_private: boolean
  trainer_level: number
  start_date: string
  country: string
  team_color: string
  
  // Subscription Status
  is_paid_user?: boolean
  subscription_type?: string
  subscription_expires_at?: string
  
  // Core Statistics
  distance_walked: number
  pokemon_caught: number
  pokestops_visited: number
  total_xp: number
  unique_pokedex_entries: number
  
  // Profile Screenshot
  profile_screenshot_url?: string
  
  // Social Media (optional)
  instagram: string
  tiktok: string
  twitter: string
  youtube: string
  twitch: string
  reddit: string
}

export interface ProfileWithMetadata extends ProfileData {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

// Public profile data (excludes private fields like trainer_code)
export interface PublicProfileData {
  id: string
  trainer_name: string
  trainer_level: number
  country: string
  team_color: string
  start_date: string
  total_xp: number
  pokemon_caught: number
  distance_walked: number
  pokestops_visited: number
  unique_pokedex_entries: number
  profile_screenshot_url: string
  instagram: string
  tiktok: string
  twitter: string
  youtube: string
  twitch: string
  reddit: string
  created_at: string
  updated_at: string
  is_paid_user: boolean
}

export const profileService = {
  // Get current user's profile
  async getProfile(): Promise<{ data: ProfileWithMetadata | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: new Error('User not authenticated') }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Create a new profile
  async createProfile(profileData: ProfileData): Promise<{ data: ProfileWithMetadata | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: new Error('User not authenticated') }
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          ...profileData
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update existing profile
  async updateProfile(profileData: Partial<ProfileData>): Promise<{ data: ProfileWithMetadata | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: new Error('User not authenticated') }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Upload profile screenshot
  async uploadProfileScreenshot(file: File): Promise<{ data: string | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: new Error('User not authenticated') }
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/profile-screenshot.${fileExt}`

      // Upload file to storage
      const { data, error } = await supabase.storage
        .from('profile-screenshots')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        })

      if (error) {
        return { data: null, error }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-screenshots')
        .getPublicUrl(fileName)

      return { data: publicUrl, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Delete profile screenshot
  async deleteProfileScreenshot(): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { error: new Error('User not authenticated') }
      }

      // Delete from storage
      const { error } = await supabase.storage
        .from('profile-screenshots')
        .remove([`${user.id}/profile-screenshot.jpg`, `${user.id}/profile-screenshot.png`])

      return { error }
    } catch (error) {
      return { error }
    }
  },

  // Upsert profile (create or update)
  async upsertProfile(profileData: ProfileData): Promise<{ data: ProfileWithMetadata | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: new Error('User not authenticated') }
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...profileData
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Check if user has active paid subscription
  async isPaidUser(): Promise<{ isPaid: boolean; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { isPaid: false, error: new Error('User not authenticated') }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('is_paid_user, subscription_expires_at')
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        return { isPaid: false, error }
      }

      // Check if subscription is active
      const isPaid = data.is_paid_user && 
        (!data.subscription_expires_at || new Date(data.subscription_expires_at) > new Date())

      return { isPaid, error: null }
    } catch (error) {
      return { isPaid: false, error }
    }
  },

  // Update subscription status
  async updateSubscription(subscriptionData: {
    is_paid_user: boolean
    subscription_type: string
    subscription_expires_at?: string
  }): Promise<{ data: ProfileWithMetadata | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: new Error('User not authenticated') }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(subscriptionData)
        .eq('user_id', user.id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get public profile by profile ID (for viewing other users)
  async getPublicProfile(profileId: string): Promise<{ data: PublicProfileData | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          trainer_name,
          trainer_level,
          country,
          team_color,
          start_date,
          total_xp,
          pokemon_caught,
          distance_walked,
          pokestops_visited,
          unique_pokedex_entries,
          profile_screenshot_url,
          instagram,
          tiktok,
          twitter,
          youtube,
          twitch,
          reddit,
          created_at,
          updated_at,
          is_paid_user
        `)
        .eq('id', profileId)
        .maybeSingle()

      return { data: data as PublicProfileData | null, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get public profile by trainer name (alternative lookup)
  async getPublicProfileByName(trainerName: string): Promise<{ data: PublicProfileData | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          trainer_name,
          trainer_level,
          country,
          team_color,
          start_date,
          total_xp,
          pokemon_caught,
          distance_walked,
          pokestops_visited,
          unique_pokedex_entries,
          profile_screenshot_url,
          instagram,
          tiktok,
          twitter,
          youtube,
          twitch,
          reddit,
          created_at,
          updated_at,
          is_paid_user
        `)
        .eq('trainer_name', trainerName)
        .maybeSingle()

      return { data: data as PublicProfileData | null, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Check if current user has a profile (lightweight check)
  async hasProfile(): Promise<{ hasProfile: boolean; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { hasProfile: false, error: new Error('User not authenticated') }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        return { hasProfile: false, error }
      }

      return { hasProfile: !!data, error: null }
    } catch (error) {
      return { hasProfile: false, error }
    }
  }
} 