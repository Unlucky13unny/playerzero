import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { profileService, type ProfileWithMetadata } from '../../services/profileService'
import { StatCalculators } from './StatCalculators'
import { Leaderboards } from './Leaderboards'
import { VisualExport } from './VisualExport'
import { RadarChart } from './RadarChart'
import { StatUpdater } from './StatUpdater'

type DashboardTab = 'calculators' | 'leaderboards' | 'export' | 'performance' | 'update'

export const Dashboard = () => {
  const { user } = useAuth()
  const trialStatus = useTrialStatus()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<DashboardTab>('calculators')
  const [profile, setProfile] = useState<ProfileWithMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    loadProfile()
    checkUpgradeSuccess()
  }, [user])

  const checkUpgradeSuccess = () => {
    const upgradeStatus = searchParams.get('upgrade')
    if (upgradeStatus === 'success') {
      setShowSuccessMessage(true)
      // Remove the parameter from URL
      searchParams.delete('upgrade')
      setSearchParams(searchParams)
      // Auto-hide after 10 seconds
      setTimeout(() => setShowSuccessMessage(false), 10000)
    }
  }

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
        return <Leaderboards isPaidUser={trialStatus.isPaidUser} />
      case 'export':
        return <VisualExport profile={profile} isPaidUser={trialStatus.isPaidUser} />
      case 'performance':
        return <RadarChart profile={profile} isPaidUser={trialStatus.isPaidUser} />
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
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="success-banner">
          <div className="success-content">
            <span className="success-icon">🎉</span>
            <div className="success-text">
              <h3>Payment Successful!</h3>
              <p>Welcome to Premium! You now have access to all features including leaderboards, unlimited exports, and more.</p>
            </div>
            <button 
              className="success-close"
              onClick={() => setShowSuccessMessage(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Trial Status Banner for Free Users */}
      {!trialStatus.isPaidUser && !trialStatus.loading && (
        <div className={`trial-banner ${trialStatus.isInTrial ? 'trial-active' : 'trial-expired'}`}>
          <div className="trial-content">
            <span className="trial-icon">{trialStatus.isInTrial ? '⏱️' : '🔒'}</span>
            <div className="trial-text">
              {trialStatus.isInTrial ? (
                <>
                  <h3>Free Trial Active</h3>
                  <p>
                    {trialStatus.timeRemaining.days > 0 ? (
                      `${trialStatus.timeRemaining.days} day${trialStatus.timeRemaining.days !== 1 ? 's' : ''}, ${trialStatus.timeRemaining.hours} hour${trialStatus.timeRemaining.hours !== 1 ? 's' : ''}, ${trialStatus.timeRemaining.minutes} minute${trialStatus.timeRemaining.minutes !== 1 ? 's' : ''}, and ${trialStatus.timeRemaining.seconds} second${trialStatus.timeRemaining.seconds !== 1 ? 's' : ''} remaining`
                    ) : trialStatus.timeRemaining.hours > 0 ? (
                      `${trialStatus.timeRemaining.hours} hour${trialStatus.timeRemaining.hours !== 1 ? 's' : ''}, ${trialStatus.timeRemaining.minutes} minute${trialStatus.timeRemaining.minutes !== 1 ? 's' : ''}, and ${trialStatus.timeRemaining.seconds} second${trialStatus.timeRemaining.seconds !== 1 ? 's' : ''} remaining`
                    ) : trialStatus.timeRemaining.minutes > 0 ? (
                      `${trialStatus.timeRemaining.minutes} minute${trialStatus.timeRemaining.minutes !== 1 ? 's' : ''} and ${trialStatus.timeRemaining.seconds} second${trialStatus.timeRemaining.seconds !== 1 ? 's' : ''} remaining`
                    ) : (
                      `${trialStatus.timeRemaining.seconds} second${trialStatus.timeRemaining.seconds !== 1 ? 's' : ''} remaining`
                    )} to enjoy premium features like All-Time Cards and Grind Card sharing!
                  </p>
                </>
              ) : (
                <>
                  <h3>Free Trial Expired</h3>
                  <p>Upgrade to Premium to unlock All-Time Cards, Weekly/Monthly Cards, Leaderboard participation, and more!</p>
                </>
              )}
            </div>
            <button 
              className="trial-upgrade-btn"
              onClick={() => window.location.href = '/upgrade'}
            >
              {trialStatus.isInTrial ? 'Upgrade Now' : 'Get Premium'}
            </button>
          </div>
        </div>
      )}

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