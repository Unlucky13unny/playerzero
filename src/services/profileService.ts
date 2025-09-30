import { supabase } from '../supabaseClient'

export type ProfileData = {
  // Trainer Information
  trainer_name: string
  trainer_code: string
  trainer_code_private: boolean
  social_links_private: boolean
  trainer_level: number
  start_date: string
  country: string
  team_color: string
  average_daily_xp: number
  last_name_change_date?: string
  is_profile_setup?: boolean
  
  // Subscription Status
  is_paid_user?: boolean
  subscription_type?: string
  subscription_expires_at?: string
  
  // User Role
  role?: 'user' | 'admin' | 'moderator'
  
  // Core Statistics
  distance_walked?: number
  pokemon_caught?: number
  pokestops_visited?: number
  total_xp?: number
  unique_pokedex_entries?: number
  
  // Profile Screenshot
  profile_screenshot_url: string
  
  // Social Media (optional)
  instagram?: string
  tiktok?: string
  twitter?: string
  youtube?: string
  twitch?: string
  reddit?: string
  facebook?: string
  snapchat?: string
  github?: string
  vimeo?: string
  discord?: string
  telegram?: string
  whatsapp?: string
}

export interface ProfileWithMetadata extends ProfileData {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

// Public profile data (excludes private fields)
export interface PublicProfileData {
  id: string
  user_id: string
  trainer_name: string
  trainer_level: number
  country: string
  team_color: string
  start_date: string
  social_links_private: boolean
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
  facebook: string
  snapchat: string
  github: string
  vimeo: string
  discord: string
  telegram: string
  whatsapp: string
  created_at: string
  updated_at: string
  is_paid_user: boolean
  trainer_code?: string
  trainer_code_private: boolean
  average_daily_xp: number
  role: 'user' | 'admin' | 'moderator'
}

// XP requirements for each level
const LEVEL_50_XP = 176_000_000;

// Calculate summit date based on current XP and start date (more accurate than stored average)
export const calculateSummitDate = (currentXp: number, averageDailyXp: number, startDate?: string): string => {
  // If already level 50
  if (currentXp >= LEVEL_50_XP) {
    return 'Complete';
  }
  
  // If we have a start date, calculate more accurate daily XP rate
  let dailyXpRate = averageDailyXp;
  
  if (startDate) {
    const start = new Date(startDate);
    const daysSinceStart = Math.max(1, Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    dailyXpRate = currentXp / daysSinceStart;
  }
  
  if (!dailyXpRate || dailyXpRate <= 0) {
    return 'Calculating...';
  }

  // Calculate days needed
  const xpNeeded = LEVEL_50_XP - currentXp;
  const daysNeeded = Math.ceil(xpNeeded / dailyXpRate);
  
  // Calculate future date
  const summitDate = new Date();
  summitDate.setDate(summitDate.getDate() + daysNeeded);
  
  // Format date as Month Day, Year
  return summitDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

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
      } else {
        console.log(data);
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

      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update({
            ...profileData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single()
      } else {
        // Insert new profile
        result = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            ...profileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
      }

      return { data: result.data, error: result.error }
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
          user_id,
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
          facebook,
          snapchat,
          github,
          vimeo,
          discord,
          telegram,
          whatsapp,
          created_at,
          updated_at,
          is_paid_user,
          trainer_code,
          trainer_code_private,
          average_daily_xp
        `)
        .eq('id', profileId)
        .maybeSingle()

      // If profile is found and trainer code is private, remove it from the response
      if (data && data.trainer_code_private) {
        data.trainer_code = undefined;
      }

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
          user_id,
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
          is_paid_user,
          trainer_code,
          average_daily_xp
        `)
        .eq('trainer_name', trainerName)
        .maybeSingle()

      return { data: data as PublicProfileData | null, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Check if user has a profile
  async hasProfile(): Promise<{ hasProfile: boolean; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { hasProfile: false, error: new Error('User not authenticated') }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('is_profile_setup')
        .eq('user_id', user.id)
        .single()

      if (error) {
        return { hasProfile: false, error }
      }

      return { hasProfile: data?.is_profile_setup ?? false, error: null }
    } catch (error) {
      return { hasProfile: false, error }
    }
  },

  getQuickProfileView: async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          trainer_name,
          team_color,
          trainer_level,
          country,
          total_xp,
          pokemon_caught,
          distance_walked,
          pokestops_visited,
          profile_screenshot_url,
          facebook,
          instagram,
          snapchat,
          is_paid_user,
          social_links_private
        `)
        .eq('id', profileId)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Search users by trainer name with pagination and preview data
  async searchUsers(query: string, limit: number = 10, offset: number = 0): Promise<{ data: PublicProfileData[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          trainer_name,
          trainer_level,
          team_color,
          country,
          total_xp,
          pokemon_caught,
          distance_walked,
          profile_screenshot_url
        `)
        .ilike('trainer_name', `%${query}%`)
        .order('trainer_name', { ascending: true })
        .range(offset, offset + limit - 1)

      return { data: data as PublicProfileData[], error }
    } catch (error) {
      return { data: null, error }
    }
  }
}; 