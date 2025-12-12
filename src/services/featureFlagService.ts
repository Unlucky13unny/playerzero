import { supabase, supabaseAdmin } from '../supabaseClient'

// Check if admin client is available (has service role key)
const hasAdminClient = !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

/**
 * Feature Flag Types
 * Add new feature flags here as the system grows
 */
export interface FeatureFlags {
  is_free_mode: boolean
  // Add more feature flags here in the future
  // e.g., enable_new_dashboard: boolean
  // e.g., maintenance_mode: boolean
}

export interface FeatureFlagRecord {
  id: string
  key: string
  value: boolean
  description: string
  updated_at: string
  updated_by: string | null
}

// Default values for feature flags
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  is_free_mode: false
}

// Cache keys for localStorage
const FEATURE_FLAGS_CACHE_KEY = 'playerzero_feature_flags'
const FEATURE_FLAGS_CACHE_TIMESTAMP_KEY = 'playerzero_feature_flags_timestamp'
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes cache duration

/**
 * Feature Flag Service
 * Handles all feature flag operations including fetching, caching, and updating
 */
export const featureFlagService = {
  /**
   * Get cached feature flags from localStorage
   */
  getCachedFlags(): FeatureFlags | null {
    try {
      const cached = localStorage.getItem(FEATURE_FLAGS_CACHE_KEY)
      const timestamp = localStorage.getItem(FEATURE_FLAGS_CACHE_TIMESTAMP_KEY)
      
      if (!cached || !timestamp) return null
      
      // Check if cache is still valid
      const cacheTime = parseInt(timestamp, 10)
      if (Date.now() - cacheTime > CACHE_DURATION_MS) {
        // Cache expired
        return null
      }
      
      return JSON.parse(cached) as FeatureFlags
    } catch (error) {
      console.error('Error reading feature flags cache:', error)
      return null
    }
  },

  /**
   * Set feature flags cache in localStorage
   */
  setCachedFlags(flags: FeatureFlags): void {
    try {
      localStorage.setItem(FEATURE_FLAGS_CACHE_KEY, JSON.stringify(flags))
      localStorage.setItem(FEATURE_FLAGS_CACHE_TIMESTAMP_KEY, Date.now().toString())
    } catch (error) {
      console.error('Error setting feature flags cache:', error)
    }
  },

  /**
   * Clear the feature flags cache
   */
  clearCache(): void {
    try {
      localStorage.removeItem(FEATURE_FLAGS_CACHE_KEY)
      localStorage.removeItem(FEATURE_FLAGS_CACHE_TIMESTAMP_KEY)
    } catch (error) {
      console.error('Error clearing feature flags cache:', error)
    }
  },

  /**
   * Fetch all feature flags from the database
   * Uses caching to minimize database calls
   */
  async getAllFlags(forceRefresh = false): Promise<{ data: FeatureFlags; error: any }> {
    try {
      // Check cache first unless force refresh is requested
      if (!forceRefresh) {
        const cached = this.getCachedFlags()
        if (cached) {
          return { data: cached, error: null }
        }
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('feature_flags')
        .select('key, value')

      if (error) {
        console.error('Error fetching feature flags:', error)
        // Return cached values or defaults on error
        const cached = this.getCachedFlags()
        return { 
          data: cached || DEFAULT_FEATURE_FLAGS, 
          error 
        }
      }

      // Transform array to object
      const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS }
      if (data) {
        data.forEach((flag: { key: string; value: boolean }) => {
          if (flag.key in flags) {
            (flags as any)[flag.key] = flag.value
          }
        })
      }

      // Update cache
      this.setCachedFlags(flags)

      return { data: flags, error: null }
    } catch (error) {
      console.error('Error in getAllFlags:', error)
      return { data: DEFAULT_FEATURE_FLAGS, error }
    }
  },

  /**
   * Get a specific feature flag value
   */
  async getFlag(key: keyof FeatureFlags): Promise<{ value: boolean; error: any }> {
    const { data, error } = await this.getAllFlags()
    return { value: data[key], error }
  },

  /**
   * Check if free mode is enabled
   * This is the main function to determine if the app should bypass all payment checks
   */
  async isFreeMode(): Promise<{ isFreeMode: boolean; error: any }> {
    const { value, error } = await this.getFlag('is_free_mode')
    return { isFreeMode: value, error }
  },

  /**
   * Update a feature flag (admin only)
   * Uses supabaseAdmin to bypass RLS policies
   */
  async updateFlag(
    key: keyof FeatureFlags, 
    value: boolean, 
    userId?: string
  ): Promise<{ success: boolean; error: any }> {
    try {
      const client = hasAdminClient ? supabaseAdmin : supabase
      
      const { data: existingFlag, error: selectError } = await client
        .from('feature_flags')
        .select('id, key, value')
        .eq('key', key)
        .maybeSingle()

      if (selectError) {
        return { success: false, error: selectError }
      }

      let result;
      
      if (existingFlag) {
        result = await client
          .from('feature_flags')
          .update({
            value,
            updated_at: new Date().toISOString(),
            updated_by: userId || null
          })
          .eq('key', key)
          .select()
      } else {
        result = await client
          .from('feature_flags')
          .insert({
            key,
            value,
            description: this.getFlagDescription(key),
            updated_at: new Date().toISOString(),
            updated_by: userId || null
          })
          .select()
      }

      if (result.error) {
        return { success: false, error: result.error }
      }

      this.clearCache()
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error }
    }
  },

  /**
   * Toggle free mode (admin only)
   */
  async toggleFreeMode(userId?: string): Promise<{ success: boolean; newValue: boolean; error: any }> {
    try {
      // Get current value
      const { isFreeMode, error: fetchError } = await this.isFreeMode()
      if (fetchError) {
        return { success: false, newValue: false, error: fetchError }
      }

      // Toggle the value
      const newValue = !isFreeMode
      const { success, error } = await this.updateFlag('is_free_mode', newValue, userId)

      return { success, newValue, error }
    } catch (error) {
      return { success: false, newValue: false, error }
    }
  },

  /**
   * Set free mode to a specific value (admin only)
   */
  async setFreeMode(enabled: boolean, userId?: string): Promise<{ success: boolean; error: any }> {
    return this.updateFlag('is_free_mode', enabled, userId)
  },

  /**
   * Get all feature flags with full details (for admin panel)
   * Uses supabaseAdmin if available to ensure we can read all data
   */
  async getAllFlagsDetailed(): Promise<{ data: FeatureFlagRecord[] | null; error: any }> {
    try {
      const client = hasAdminClient ? supabaseAdmin : supabase
      
      const { data, error } = await client
        .from('feature_flags')
        .select('*')
        .order('key')

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  /**
   * Initialize feature flags table with default values
   * Should be called once during database setup
   * Uses supabaseAdmin to bypass RLS policies
   */
  async initializeFlags(): Promise<{ success: boolean; error: any }> {
    try {
      const client = hasAdminClient ? supabaseAdmin : supabase
      
      const flagsToInsert = Object.entries(DEFAULT_FEATURE_FLAGS).map(([key, value]) => ({
        key,
        value,
        description: this.getFlagDescription(key as keyof FeatureFlags),
        updated_at: new Date().toISOString()
      }))

      const { error } = await client
        .from('feature_flags')
        .upsert(flagsToInsert, { onConflict: 'key' })

      if (error) {
        return { success: false, error }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error }
    }
  },

  /**
   * Get description for a feature flag
   */
  getFlagDescription(key: keyof FeatureFlags): string {
    const descriptions: Record<keyof FeatureFlags, string> = {
      is_free_mode: 'When enabled, all users get full access without trial or payment restrictions. Bypasses all paywall and subscription checks.'
    }
    return descriptions[key] || 'No description available'
  }
}

