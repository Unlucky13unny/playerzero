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

type DashboardTab = 'calculators' | 'leaderboards' | 'analytics' | 'update'
type AnalyticsTab = 'performance' | 'export'

const TEAM_COLORS = {
  blue: { name: 'Blue', color: '#0074D9' },
  red: { name: 'Red', color: '#FF4136' },
  yellow: { name: 'Yellow', color: '#FFDC00' },
  black: { name: 'Black', color: '#111111' },
  green: { name: 'Green', color: '#2ECC40' },
  orange: { name: 'Orange', color: '#FF851B' },
  purple: { name: 'Purple', color: '#B10DC9' },
  pink: { name: 'Pink', color: '#F012BE' }
}

export const Dashboard = () => {
  const { user } = useAuth()
  const trialStatus = useTrialStatus()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<DashboardTab>('calculators')
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<AnalyticsTab>('performance')
  const [profile, setProfile] = useState<ProfileWithMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    loadProfile()
    checkUpgradeSuccess()
  }, [user])

  // Handle tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && isValidTab(tabParam)) {
      setActiveTab(tabParam as DashboardTab)
    }
    const analyticsTabParam = searchParams.get('analyticsTab')
    if (analyticsTabParam && isValidAnalyticsTab(analyticsTabParam)) {
      setActiveAnalyticsTab(analyticsTabParam as AnalyticsTab)
    }
  }, [searchParams])

  const isValidTab = (tab: string): tab is DashboardTab => {
    return ['calculators', 'leaderboards', 'analytics', 'update'].includes(tab)
  }

  const isValidAnalyticsTab = (tab: string): tab is AnalyticsTab => {
    return ['performance', 'export'].includes(tab)
  }

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

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab)
    searchParams.set('tab', tab)
    setSearchParams(searchParams)
  }

  const handleAnalyticsTabChange = (tab: AnalyticsTab) => {
    setActiveAnalyticsTab(tab)
    searchParams.set('analyticsTab', tab)
    setSearchParams(searchParams)
  }

  const renderAnalyticsContent = () => {
    if (!profile) return null;
    
    return (
      <div className="analytics-section">
        <div className="analytics-tabs">
          <button
            className={`analytics-tab ${activeAnalyticsTab === 'performance' ? 'active' : ''}`}
            onClick={() => handleAnalyticsTabChange('performance')}
          >
            <span className="tab-icon">📈</span>
            Performance
          </button>
          <button
            className={`analytics-tab ${activeAnalyticsTab === 'export' ? 'active' : ''}`}
            onClick={() => handleAnalyticsTabChange('export')}
          >
            <span className="tab-icon">📤</span>
            Visual Export
          </button>
        </div>

        <div className="analytics-content">
          {activeAnalyticsTab === 'performance' ? (
            <RadarChart profile={profile} isPaidUser={trialStatus.isPaidUser} />
          ) : (
            <VisualExport profile={profile} isPaidUser={trialStatus.isPaidUser} />
          )}
        </div>
      </div>
    )
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
        return <StatCalculators initialCalculator={searchParams.get('calc') === 'community' ? 'community' : 'grind'} />
      case 'leaderboards':
        return <Leaderboards isPaidUser={trialStatus.isPaidUser} />
      case 'analytics':
        return renderAnalyticsContent()
      case 'update':
        return <StatUpdater onStatsUpdated={handleStatsUpdated} />
      default:
        return <StatCalculators initialCalculator="grind" />
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

      {/* Private Mode Status Banner for Free Users */}
      {!trialStatus.isPaidUser && !trialStatus.loading && (
        <div className={`private-mode-banner ${trialStatus.isInTrial ? 'active' : 'expired'}`}>
          <div className="private-mode-content">
            {trialStatus.isInTrial ? (
              <p className="private-mode-status">
                Private Mode: {trialStatus.timeRemaining.days} day{trialStatus.timeRemaining.days !== 1 ? 's' : ''} remaining
              </p>
            ) : (
              <p className="private-mode-status">
                Private Mode Ended - To keep tracking your grind and unlock your leaderboard placement, upgrade for $5.99.
                <button 
                  className="upgrade-button"
                  onClick={() => window.location.href = '/upgrade'}
                >
                  Upgrade Now
                </button>
              </p>
            )}
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
          onClick={() => handleTabChange('calculators')}
        >
          🧮 Calculators
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'update' ? 'active' : ''}`}
          onClick={() => handleTabChange('update')}
        >
          📊 Update Stats
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'leaderboards' ? 'active' : ''}`}
          onClick={() => handleTabChange('leaderboards')}
        >
          🏆 Leaderboards
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => handleTabChange('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      <div className="dashboard-content">
        {renderTabContent()}
      </div>
    </div>
  )
} 