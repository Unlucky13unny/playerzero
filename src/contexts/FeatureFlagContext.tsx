import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { featureFlagService, DEFAULT_FEATURE_FLAGS } from '../services/featureFlagService'
import type { FeatureFlags } from '../services/featureFlagService'

interface FeatureFlagContextType {
  // Feature flags state
  flags: FeatureFlags
  loading: boolean
  error: any | null
  
  // Convenience getters
  isFreeMode: boolean
  
  // Actions
  refreshFlags: () => Promise<void>
  updateFlag: (key: keyof FeatureFlags, value: boolean) => Promise<boolean>
  toggleFreeMode: () => Promise<boolean>
  setFreeMode: (enabled: boolean) => Promise<boolean>
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined)

interface FeatureFlagProviderProps {
  children: ReactNode
}

export const FeatureFlagProvider = ({ children }: FeatureFlagProviderProps) => {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any | null>(null)

  /**
   * Fetch feature flags from the service
   */
  const fetchFlags = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await featureFlagService.getAllFlags(forceRefresh)
      
      if (fetchError) {
        console.error('Error fetching feature flags:', fetchError)
        setError(fetchError)
      } else {
        setFlags(data)
        setError(null)
      }
    } catch (err) {
      console.error('Error in fetchFlags:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Refresh flags from the database (bypasses cache)
   */
  const refreshFlags = useCallback(async () => {
    await fetchFlags(true)
  }, [fetchFlags])

  /**
   * Update a specific feature flag
   */
  const updateFlag = useCallback(async (key: keyof FeatureFlags, value: boolean): Promise<boolean> => {
    try {
      const { success, error: updateError } = await featureFlagService.updateFlag(key, value)
      
      if (success) {
        // Update local state immediately
        setFlags(prev => ({ ...prev, [key]: value }))
        return true
      } else {
        console.error('Error updating flag:', updateError)
        return false
      }
    } catch (err) {
      console.error('Error in updateFlag:', err)
      return false
    }
  }, [])

  /**
   * Toggle free mode on/off
   */
  const toggleFreeMode = useCallback(async (): Promise<boolean> => {
    const newValue = !flags.is_free_mode
    return updateFlag('is_free_mode', newValue)
  }, [flags.is_free_mode, updateFlag])

  /**
   * Set free mode to a specific value
   */
  const setFreeMode = useCallback(async (enabled: boolean): Promise<boolean> => {
    return updateFlag('is_free_mode', enabled)
  }, [updateFlag])

  // Fetch flags on mount
  useEffect(() => {
    fetchFlags()
  }, [fetchFlags])

  // Set up periodic refresh (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFlags(true) // Force refresh to get latest from DB
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [fetchFlags])

  // Listen for visibility changes to refresh flags when app becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchFlags(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchFlags])

  const value: FeatureFlagContextType = {
    flags,
    loading,
    error,
    isFreeMode: flags.is_free_mode,
    refreshFlags,
    updateFlag,
    toggleFreeMode,
    setFreeMode
  }

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

/**
 * Hook to access feature flags
 */
export const useFeatureFlags = (): FeatureFlagContextType => {
  const context = useContext(FeatureFlagContext)
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider')
  }
  return context
}

/**
 * Hook to check if the app is in free mode
 * Provides a simple boolean value for components that only need this check
 */
export const useIsFreeMode = (): { isFreeMode: boolean; loading: boolean } => {
  const { isFreeMode, loading } = useFeatureFlags()
  return { isFreeMode, loading }
}

