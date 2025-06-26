import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { profileService } from '../services/profileService'

export interface TrialTimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalHours: number
  totalMinutes: number
  totalSeconds: number
}

export interface TrialStatus {
  isInTrial: boolean
  daysRemaining: number
  timeRemaining: TrialTimeRemaining
  isPaidUser: boolean
  canGenerateAllTimeCard: boolean
  canShareGrindCard: boolean
  canViewWeeklyMonthlyCards: boolean
  canAppearOnLeaderboard: boolean
  canViewLeaderboard: boolean
  canClickIntoProfiles: boolean
  canShowTrainerCode: boolean
  canShowSocialLinks: boolean
  loading: boolean
}

export const useTrialStatus = (): TrialStatus => {
  const { user } = useAuth()
  const [isPaidUser, setIsPaidUser] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user) {
      checkPaidStatus()
    } else {
      setIsPaidUser(false)
      setLoading(false)
    }
  }, [user])

  const checkPaidStatus = async () => {
    try {
      setLoading(true)
      const { isPaid } = await profileService.isPaidUser()
      setIsPaidUser(isPaid)
    } catch (error) {
      console.error('Error checking paid status:', error)
      setIsPaidUser(false)
    } finally {
      setLoading(false)
    }
  }

  const calculateTrialStatus = (): TrialStatus => {
    // Default values for logged out users or while loading
    if (!user || loading) {
      return {
        isInTrial: false,
        daysRemaining: 0,
        timeRemaining: { days: 0, hours: 0, minutes: 0, seconds: 0, totalHours: 0, totalMinutes: 0, totalSeconds: 0 },
        isPaidUser: false,
        canGenerateAllTimeCard: false,
        canShareGrindCard: false,
        canViewWeeklyMonthlyCards: false,
        canAppearOnLeaderboard: false,
        canViewLeaderboard: false,
        canClickIntoProfiles: false,
        canShowTrainerCode: false,
        canShowSocialLinks: false,
        loading
      }
    }
    
    // Calculate trial status based on created_at timestamp (signup date)
    const createdAt = new Date(user.created_at)
    const trialEndDate = new Date(createdAt.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days from signup
    const now = currentTime
    
    const isInTrial = now < trialEndDate
    const timeLeftMs = Math.max(0, trialEndDate.getTime() - now.getTime())
    
    // Calculate detailed time remaining including seconds
    const timeRemaining: TrialTimeRemaining = {
      days: Math.floor(timeLeftMs / (1000 * 60 * 60 * 24)),
      hours: Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((timeLeftMs % (1000 * 60)) / 1000),
      totalHours: Math.floor(timeLeftMs / (1000 * 60 * 60)),
      totalMinutes: Math.floor(timeLeftMs / (1000 * 60)),
      totalSeconds: Math.floor(timeLeftMs / 1000)
    }
    
    const daysRemaining = timeRemaining.days

    // Premium users (from profiles table) get COMPLETE access to ALL features
    if (isPaidUser) {
      return {
        isInTrial,
        daysRemaining,
        timeRemaining,
        isPaidUser: true,
        canGenerateAllTimeCard: true, // Premium: Full access
        canShareGrindCard: true, // Premium: Full access
        canViewWeeklyMonthlyCards: true, // Premium: Full access
        canAppearOnLeaderboard: true, // Premium: Full access
        canViewLeaderboard: true, // Premium: Full access
        canClickIntoProfiles: true, // Premium: Full access
        canShowTrainerCode: true, // Premium: Full access
        canShowSocialLinks: true, // Premium: Full access
        loading: false
      }
    }

    // Free users: Trial-based restrictions (based on signup date)
    return {
      isInTrial,
      daysRemaining,
      timeRemaining,
      isPaidUser: false,
      canGenerateAllTimeCard: isInTrial, // Trial only (30 days from signup)
      canShareGrindCard: isInTrial, // Trial only (30 days from signup)
      canViewWeeklyMonthlyCards: false, // Never for free users
      canAppearOnLeaderboard: false, // Never for free users
      canViewLeaderboard: true, // Browse only (always allowed)
      canClickIntoProfiles: false, // Never for free users
      canShowTrainerCode: false, // Never for free users
      canShowSocialLinks: false, // Never for free users
      loading: false
    }
  }

  return calculateTrialStatus()
} 