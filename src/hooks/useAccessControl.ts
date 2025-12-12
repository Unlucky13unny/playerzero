import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useFeatureFlags } from '../contexts/FeatureFlagContext'
import { profileService } from '../services/profileService'

export interface AccessControlTimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalHours: number
  totalMinutes: number
  totalSeconds: number
}

export interface AccessControlStatus {
  // Free mode flag
  isFreeMode: boolean
  
  // Trial status
  isInTrial: boolean
  daysRemaining: number
  timeRemaining: AccessControlTimeRemaining
  
  // Payment status
  isPaidUser: boolean
  
  // Permission checks - all centralized here
  hasFullAccess: boolean
  canGenerateAllTimeCard: boolean
  canShareGrindCard: boolean
  canViewWeeklyMonthlyCards: boolean
  canAppearOnLeaderboard: boolean
  canViewLeaderboard: boolean
  canClickIntoProfiles: boolean
  canShowTrainerCode: boolean
  canShowSocialLinks: boolean
  
  // Loading state
  loading: boolean
}

/**
 * Central access control hook
 * ALL access decisions in the app should go through this hook
 * 
 * Priority order:
 * 1. If is_free_mode is TRUE → Full access for everyone
 * 2. If user is a paid subscriber → Full access
 * 3. If user is in trial period → Limited access based on trial rules
 * 4. Otherwise → Restricted access
 */
export const useAccessControl = (): AccessControlStatus => {
  const { user } = useAuth()
  const { isFreeMode, loading: flagsLoading } = useFeatureFlags()
  
  // Initialize from localStorage to prevent badge flashing
  const getInitialPaidStatus = () => {
    try {
      const userId = user?.id
      if (!userId) return false
      const cached = localStorage.getItem(`paid_status_${userId}`)
      return cached ? JSON.parse(cached) : false
    } catch {
      return false
    }
  }
  
  const [isPaidUser, setIsPaidUser] = useState(getInitialPaidStatus)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastUpdateTime, setLastUpdateTime] = useState(0)

  const checkPaidStatus = useCallback(async () => {
    try {
      setLoading(true)
      const { isPaid } = await profileService.isPaidUser()
      setIsPaidUser(isPaid)
      
      // Cache the paid status to prevent flashing on refresh
      if (user?.id) {
        localStorage.setItem(`paid_status_${user.id}`, JSON.stringify(isPaid))
      }
    } catch (error) {
      console.error('Error checking paid status:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Update current time every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      if (now - lastUpdateTime > 5000) {
        setCurrentTime(new Date())
        setLastUpdateTime(now)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [lastUpdateTime])

  useEffect(() => {
    if (user) {
      try {
        const cached = localStorage.getItem(`paid_status_${user.id}`)
        if (cached) {
          setIsPaidUser(JSON.parse(cached))
        }
      } catch {
        // If cache read fails, let the API call update it
      }
      checkPaidStatus()
    } else {
      setIsPaidUser(false)
      setLoading(false)
    }
  }, [user, checkPaidStatus])

  const calculateAccessStatus = useCallback((): AccessControlStatus => {
    const baseStatus = {
      isFreeMode,
      loading: loading || flagsLoading
    }

    // Default values for logged out users
    if (!user) {
      return {
        ...baseStatus,
        isInTrial: false,
        daysRemaining: 0,
        timeRemaining: { days: 0, hours: 0, minutes: 0, seconds: 0, totalHours: 0, totalMinutes: 0, totalSeconds: 0 },
        isPaidUser: false,
        hasFullAccess: false,
        canGenerateAllTimeCard: false,
        canShareGrindCard: false,
        canViewWeeklyMonthlyCards: false,
        canAppearOnLeaderboard: false,
        canViewLeaderboard: false,
        canClickIntoProfiles: false,
        canShowTrainerCode: false,
        canShowSocialLinks: false
      }
    }

    // Calculate trial period
    const createdAt = new Date(user.created_at)
    const trialEndDate = new Date(createdAt.getTime() + (7 * 24 * 60 * 60 * 1000))
    const now = currentTime
    
    const isInTrial = now < trialEndDate
    const timeLeftMs = Math.max(0, trialEndDate.getTime() - now.getTime())
    
    const timeRemaining: AccessControlTimeRemaining = {
      days: Math.floor(timeLeftMs / (1000 * 60 * 60 * 24)),
      hours: Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((timeLeftMs % (1000 * 60)) / 1000),
      totalHours: Math.floor(timeLeftMs / (1000 * 60 * 60)),
      totalMinutes: Math.floor(timeLeftMs / (1000 * 60)),
      totalSeconds: Math.floor(timeLeftMs / 1000)
    }
    
    const daysRemaining = timeRemaining.days

    // ==================================================
    // PRIORITY 1: FREE MODE - Bypass all payment checks
    // ==================================================
    if (isFreeMode) {
      return {
        ...baseStatus,
        isInTrial,
        daysRemaining,
        timeRemaining,
        isPaidUser: true, // Treat everyone as paid in free mode
        hasFullAccess: true,
        canGenerateAllTimeCard: true,
        canShareGrindCard: true,
        canViewWeeklyMonthlyCards: true,
        canAppearOnLeaderboard: true,
        canViewLeaderboard: true,
        canClickIntoProfiles: true,
        canShowTrainerCode: true,
        canShowSocialLinks: true
      }
    }

    // ==================================================
    // PRIORITY 2: PAID USER - Full access
    // ==================================================
    if (isPaidUser) {
      return {
        ...baseStatus,
        isInTrial,
        daysRemaining,
        timeRemaining,
        isPaidUser: true,
        hasFullAccess: true,
        canGenerateAllTimeCard: true,
        canShareGrindCard: true,
        canViewWeeklyMonthlyCards: true,
        canAppearOnLeaderboard: true,
        canViewLeaderboard: true,
        canClickIntoProfiles: true,
        canShowTrainerCode: true,
        canShowSocialLinks: true
      }
    }

    // ==================================================
    // PRIORITY 3: IN TRIAL - Limited access
    // ==================================================
    // Free users in trial: Limited access based on trial rules
    return {
      ...baseStatus,
      isInTrial,
      daysRemaining,
      timeRemaining,
      isPaidUser: false,
      hasFullAccess: false,
      canGenerateAllTimeCard: isInTrial,
      canShareGrindCard: isInTrial,
      canViewWeeklyMonthlyCards: false,
      canAppearOnLeaderboard: false,
      canViewLeaderboard: true,
      canClickIntoProfiles: false,
      canShowTrainerCode: false,
      canShowSocialLinks: false
    }
  }, [user, loading, flagsLoading, isPaidUser, isFreeMode, currentTime])

  return useMemo(() => calculateAccessStatus(), [calculateAccessStatus])
}

/**
 * Simple hook to check if user has full access (free mode OR paid user)
 */
export const useHasFullAccess = (): { hasFullAccess: boolean; loading: boolean } => {
  const { hasFullAccess, loading } = useAccessControl()
  return { hasFullAccess, loading }
}

