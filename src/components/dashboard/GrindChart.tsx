import { useState, useEffect } from 'react'
import { dashboardService, type StatCalculationResult } from '../../services/dashboardService'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import './GrindChart.css'

interface GrindChartProps {
  className?: string
  userId?: string // Optional userId to show stats for a specific user
}

type PeriodType = 'weekly' | 'monthly' | 'all-time'

export const GrindChart = ({ className = '', userId }: GrindChartProps) => {
  const [grindStats, setGrindStats] = useState<StatCalculationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('all-time')
  const trialStatus = useTrialStatus()

  useEffect(() => {
    loadGrindStats()
  }, [selectedPeriod, userId])

  const loadGrindStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let stats: StatCalculationResult
      
      switch (selectedPeriod) {
        case 'weekly':
          stats = await dashboardService.calculateWeeklyGrindStats(userId)
          break
        case 'monthly':
          stats = await dashboardService.calculateMonthlyGrindStats(userId)
          break
        case 'all-time':
        default:
          if (userId) {
            stats = await dashboardService.calculateGrindStatsForUser(userId)
          } else {
            stats = await dashboardService.calculateGrindStats()
          }
          break
      }
      
      setGrindStats(stats)
    } catch (err: any) {
      setError(err.message || 'Failed to load grind stats')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatDistance = (distance: number) => {
    return `${formatNumber(distance)} km`
  }

  const getDaysPlayed = () => {
    if (!grindStats) return 0
    const startDate = new Date(grindStats.startDate)
    const endDate = new Date(grindStats.endDate)
    return Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  }

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'weekly':
        return 'Week'
      case 'monthly':
        return 'Month'
      case 'all-time':
        return 'All Time'
      default:
        return 'All Time'
    }
  }

  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period)
  }

  if (loading) {
    return (
      <div className={`grind-chart-container ${className}`}>
        <div className="grind-chart-header">
          <h3>Grind Progress</h3>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`grind-chart-container ${className}`}>
        <div className="grind-chart-header">
          <h3>Grind Progress</h3>
        </div>
        <div className="error-message">
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!grindStats) {
    return (
      <div className={`grind-chart-container ${className}`}>
        <div className="grind-chart-header">
          <h3>Grind Progress</h3>
        </div>
        <div className="no-data-message">
          <span>No grind data available</span>
        </div>
      </div>
    )
  }

  const daysPlayed = getDaysPlayed()

  return (
    <div className={`grind-chart-container ${className}`}>
      <div className="grind-chart-header">
        <div className="grind-chart-title">
          <span className="grind-icon">📈</span>
          <h3>Grind Progress</h3>
        </div>
        
        {/* Period Selection Buttons */}
        <div className="period-selector">
          <button
            className={`period-button ${selectedPeriod === 'weekly' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('weekly')}
          >
            <span className="period-icon">📅</span>
            <span className="period-text">Week</span>
          </button>
          <button
            className={`period-button ${selectedPeriod === 'monthly' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('monthly')}
          >
            <span className="period-icon">📊</span>
            <span className="period-text">Month</span>
          </button>
          <button
            className={`period-button ${selectedPeriod === 'all-time' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('all-time')}
          >
            <span className="period-icon">🏆</span>
            <span className="period-text">All Time</span>
          </button>
        </div>

        <div className="grind-period">
          <span className="period-label">{getPeriodLabel()} Period:</span>
          <span className="period-dates">
            {new Date(grindStats.startDate).toLocaleDateString()} - {new Date(grindStats.endDate).toLocaleDateString()}
          </span>
          <span className="days-played">({daysPlayed} days)</span>
        </div>
      </div>

      <div className="grind-stats-grid">
        <div className="grind-stat-card total-stats">
          <div className="stat-header">
            <span className="stat-icon">🎯</span>
            <span className="stat-label">Total Stats</span>
          </div>
          <div className="stat-values">
            <div className="stat-row">
              <span className="stat-name">Total XP:</span>
              <span className="stat-value">{formatNumber(grindStats.totalXP)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-name">Pokémon Caught:</span>
              <span className="stat-value">{formatNumber(grindStats.pokemonCaught)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-name">Distance Walked:</span>
              <span className="stat-value">{formatDistance(grindStats.distanceWalked)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-name">PokéStops Visited:</span>
              <span className="stat-value">{formatNumber(grindStats.pokestopsVisited)}</span>
            </div>
          </div>
        </div>

        <div className="grind-stat-card daily-averages">
          <div className="stat-header">
            <span className="stat-icon">📊</span>
            <span className="stat-label">Daily Averages</span>
          </div>
          <div className="stat-values">
            <div className="stat-row">
              <span className="stat-name">XP per Day:</span>
              <span className="stat-value">{formatNumber(grindStats.xpPerDay)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-name">Catches per Day:</span>
              <span className="stat-value">{formatNumber(grindStats.catchesPerDay)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-name">Distance per Day:</span>
              <span className="stat-value">{formatDistance(grindStats.distancePerDay)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-name">Stops per Day:</span>
              <span className="stat-value">{formatNumber(grindStats.stopsPerDay)}</span>
            </div>
          </div>
        </div>
      </div>

      {!trialStatus.isPaidUser && (
        <div className="upgrade-notice">
          <div className="upgrade-content">
            <span className="upgrade-icon">✨</span>
            <span className="upgrade-text">Upgrade to Premium for advanced grind analytics and detailed progress tracking</span>
          </div>
        </div>
      )}
    </div>
  )
} 