import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { profileService } from '../services/profileService'

export interface PrivateModeTimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalHours: number
  totalMinutes: number
  totalSeconds: number
}

export interface PrivateModeStatus {
  isInTrial: boolean
  daysRemaining: number
  timeRemaining: PrivateModeTimeRemaining
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

export const useTrialStatus = (): PrivateModeStatus => {
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

  const calculatePrivateModeStatus = (): PrivateModeStatus => {
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
    
    // Calculate private mode status based on created_at timestamp (signup date)
    const createdAt = new Date(user.created_at)
    const privateEndDate = new Date(createdAt.getTime() + (7 * 24 * 60 * 60 * 1000)) // 7 days from signup
    const now = currentTime
    
    const isInTrial = now < privateEndDate
    const timeLeftMs = Math.max(0, privateEndDate.getTime() - now.getTime())
    
    // Calculate detailed time remaining including seconds
    const timeRemaining: PrivateModeTimeRemaining = {
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
        canGenerateAllTimeCard: true,
        canShareGrindCard: true,
        canViewWeeklyMonthlyCards: true,
        canAppearOnLeaderboard: true,
        canViewLeaderboard: true,
        canClickIntoProfiles: true,
        canShowTrainerCode: true,
        canShowSocialLinks: true,
        loading: false
      }
    }

    // Free users in private mode: Limited access based on private mode rules
    return {
      isInTrial,
      daysRemaining,
      timeRemaining,
      isPaidUser: false,
      canGenerateAllTimeCard: isInTrial, // Can generate cards during private mode
      canShareGrindCard: isInTrial, // Can share cards during private mode
      canViewWeeklyMonthlyCards: isInTrial, // Can view their own stats during private mode
      canAppearOnLeaderboard: false, // Never appear on leaderboard (even during private mode)
      canViewLeaderboard: true, // Can always browse leaderboard
      canClickIntoProfiles: false, // Can't view other profiles' details
      canShowTrainerCode: false, // Trainer code remains private
      canShowSocialLinks: false, // Social links remain private
      loading: false
    }
  }

  return calculatePrivateModeStatus()
} 