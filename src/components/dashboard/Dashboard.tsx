import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { profileService, type ProfileWithMetadata } from '../../services/profileService'
import { StatCalculators } from './StatCalculators'
import { Leaderboards } from './Leaderboards'
import { VisualExport } from './VisualExport'
import { RadarChart } from './RadarChart'
import { StatUpdater } from './StatUpdater'

type DashboardTab = 'calculators' | 'leaderboards' | 'export' | 'performance' | 'update'

export const Dashboard = () => {
  const { user, userMetadata } = useAuth()
  const [activeTab, setActiveTab] = useState<DashboardTab>('calculators')
  const [profile, setProfile] = useState<ProfileWithMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPaidUser, setIsPaidUser] = useState(false)

  useEffect(() => {
    loadProfile()
    checkPaidStatus()
  }, [userMetadata])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await profileService.getProfile()
      setProfile(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const checkPaidStatus = async () => {
    try {
      // Check auth metadata first
      const authIsPaid = userMetadata?.role === 'paid'
      
      // Check database profile for subscription status
      const { isPaid: dbIsPaid } = await profileService.isPaidUser()
      
      // User is paid if either auth metadata OR database says they are
      const finalIsPaid = authIsPaid || dbIsPaid
      setIsPaidUser(finalIsPaid)
      
      console.log('Paid status check:', { authIsPaid, dbIsPaid, finalIsPaid })
    } catch (error) {
      console.error('Error checking paid status:', error)
      // Default to auth metadata if database check fails
      setIsPaidUser(userMetadata?.role === 'paid')
    }
  }

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="dashboard-error">
          <p>❌ {error}</p>
        </div>
      )
    }

    if (!profile) {
      return (
        <div className="dashboard-error">
          <p>❌ Profile not found. Please complete your profile setup first.</p>
        </div>
      )
    }

    switch (activeTab) {
      case 'calculators':
        return <StatCalculators />
      case 'leaderboards':
        return <Leaderboards isPaidUser={isPaidUser} />
      case 'export':
        return <VisualExport profile={profile} isPaidUser={isPaidUser} />
      case 'performance':
        return <RadarChart profile={profile} isPaidUser={isPaidUser} />
      case 'update':
        return <StatUpdater onStatsUpdated={handleStatsUpdated} />
      default:
        return <StatCalculators />
    }
  }

  const handleStatsUpdated = (updatedProfile: any) => {
    // Refresh the profile data
    loadProfile()
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>PlayerZERO Dashboard</h1>
        <p>Track your progress, compete with others, and level up your game</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'calculators' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculators')}
        >
          🧮 Calculators
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'update' ? 'active' : ''}`}
          onClick={() => setActiveTab('update')}
        >
          📊 Update Stats
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'leaderboards' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboards')}
        >
          🏆 Leaderboards
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          📤 Visual Export
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          📈 Performance
        </button>
      </div>

      <div className="dashboard-content">
        {renderTabContent()}
      </div>
    </div>
  )
} 