import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { dashboardService, type LeaderboardEntry } from '../../services/dashboardService'

interface LeaderboardsProps {
  isPaidUser: boolean
}

export const Leaderboards = ({ isPaidUser }: LeaderboardsProps) => {
  const navigate = useNavigate()
  const trialStatus = useTrialStatus()
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all-time'>('weekly')
  const [sortBy, setSortBy] = useState<'xp' | 'catches' | 'distance' | 'pokestops'>('xp')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Always load leaderboard for browse access
    loadLeaderboard()
  }, [period, sortBy])

  const loadLeaderboard = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data } = await dashboardService.getLeaderboard(period, sortBy)
      setLeaderboard(data || [])
    } catch (err: any) {
      console.error('Leaderboard error:', err)
      setError(err.message || 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const handleTrainerClick = (entry: LeaderboardEntry) => {
    if (!trialStatus.canClickIntoProfiles) {
      // Show upgrade prompt instead of navigating
      navigate('/upgrade')
      return
    }
    // Navigate to public profile using profile ID
    navigate(`/profile/${entry.profile_id}`)
  }

  const handleUpgradeClick = () => {
    navigate('/upgrade')
  }

  const getTeamColor = (teamColor: string) => {
    const colors: { [key: string]: string } = {
      'red': '#FF4136',
      'blue': '#0074D9',
      'yellow': '#FFDC00',
      'black': '#111111',
      'green': '#2ECC40',
      'orange': '#FF851B',
      'purple': '#B10DC9',
      'pink': '#F012BE'
    }
    return colors[teamColor] || '#666666'
  }

  const formatSortValue = (entry: LeaderboardEntry, sortBy: string) => {
    const getValue = () => {
      switch (sortBy) {
        case 'xp':
          return period === 'all-time' ? entry.total_xp : entry.xp_delta
        case 'catches':
          return period === 'all-time' ? entry.pokemon_caught : entry.catches_delta
        case 'distance':
          return period === 'all-time' ? entry.distance_walked : entry.distance_delta
        case 'pokestops':
          return period === 'all-time' ? entry.pokestops_visited : entry.pokestops_delta
        default:
          return 0
      }
    }

    const value = getValue() || 0
    
    if (sortBy === 'distance') {
      return `${value.toFixed(1)} km`
    }
    
    return value.toLocaleString()
  }

  return (
    <div className="leaderboards-container">
      <div className="leaderboards-header">
        <h2>🏆 Community Leaderboards</h2>
        <p>See how the top trainers are performing</p>
        {!trialStatus.isPaidUser && (
          <div className="browse-notice">
            <span className="browse-badge">
              👀 Browse Only {!trialStatus.canClickIntoProfiles && '• Upgrade to view profiles'}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="leaderboard-filters">
        <div className="filter-group">
          <label>Time Period</label>
          <div className="period-tabs">
            <button
              className={`period-tab ${period === 'weekly' ? 'active' : ''}`}
              onClick={() => setPeriod('weekly')}
            >
              📅 Weekly
            </button>
            <button
              className={`period-tab ${period === 'monthly' ? 'active' : ''}`}
              onClick={() => setPeriod('monthly')}
            >
              📊 Monthly
            </button>
            <button
              className={`period-tab ${period === 'all-time' ? 'active' : ''}`}
              onClick={() => setPeriod('all-time')}
            >
              🌟 All-Time
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="xp">⚡ XP {period === 'all-time' ? 'Total' : 'Gained'}</option>
            <option value="catches">🔴 Pokémon {period === 'all-time' ? 'Total' : 'Caught'}</option>
            <option value="distance">🚶 Distance {period === 'all-time' ? 'Total' : 'Walked'}</option>
            <option value="pokestops">📍 PokéStops {period === 'all-time' ? 'Total' : 'Visited'}</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="leaderboard-content">
        {loading ? (
          <div className="leaderboard-loading">
            <div className="loading-spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="leaderboard-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        ) : (
          <div className="leaderboard-list">
            {leaderboard.length === 0 ? (
              <div className="empty-leaderboard">
                <div className="empty-icon">📊</div>
                <h3>No Premium Members Yet</h3>
                <p>Be the first to upgrade and claim the top spot!</p>
                <button 
                  className="upgrade-cta"
                  onClick={handleUpgradeClick}
                >
                  ✨ Upgrade to Premium
                </button>
              </div>
            ) : (
              <>
                <div className="leaderboard-header-row">
                  <div className="header-rank">Rank</div>
                  <div className="header-trainer">Trainer</div>
                  <div className="header-stats">
                    {period === 'all-time' ? 'Total' : 'Progress'} 
                    {sortBy === 'xp' && ' XP'}
                    {sortBy === 'catches' && ' Caught'}
                    {sortBy === 'distance' && ' Distance'}
                    {sortBy === 'pokestops' && ' PokéStops'}
                  </div>
                  <div className="header-avatar">Profile</div>
                </div>
                
                {leaderboard.map((entry, index) => (
                  <div
                    key={`${entry.trainer_name}-${index}`}
                    className={`leaderboard-entry ${index < 3 ? 'top-3' : ''}`}
                  >
                    <div className="rank-section">
                      <span className={`rank rank-${index + 1}`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                    </div>

                    <div className="trainer-section">
                      <div className="trainer-info">
                        <span 
                          className={`trainer-name ${trialStatus.canClickIntoProfiles ? 'clickable' : 'browse-only'}`}
                          onClick={() => handleTrainerClick(entry)}
                          style={{
                            cursor: trialStatus.canClickIntoProfiles ? 'pointer' : 'default',
                            color: trialStatus.canClickIntoProfiles ? '#00d4aa' : '#888',
                            textDecoration: 'none',
                            transition: 'color 0.2s ease',
                            fontWeight: 'bold'
                          }}
                          onMouseEnter={(e) => {
                            if (trialStatus.canClickIntoProfiles) {
                              e.currentTarget.style.color = '#00b894'
                              e.currentTarget.style.textDecoration = 'underline'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (trialStatus.canClickIntoProfiles) {
                              e.currentTarget.style.color = '#00d4aa'
                              e.currentTarget.style.textDecoration = 'none'
                            }
                          }}
                          title={trialStatus.canClickIntoProfiles ? `View ${entry.trainer_name}'s profile` : 'Upgrade to view profiles'}
                        >
                          {entry.trainer_name}
                          {!trialStatus.canClickIntoProfiles && <span className="locked-indicator">🔒</span>}
                        </span>
                        <div className="trainer-meta">
                          <span 
                            className="team-dot"
                            style={{ backgroundColor: getTeamColor(entry.team_color) }}
                            title={`Team ${entry.team_color}`}
                          ></span>
                          <span className="country">{entry.country}</span>
                          <span className="premium-badge">👑 Premium</span>
                        </div>
                      </div>
                    </div>

                    <div className="stats-section">
                      <div className="primary-stat">
                        {formatSortValue(entry, sortBy)}
                      </div>
                      <div className="last-update">
                        Updated {new Date(entry.last_update).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="avatar-section">
                      {entry.profile_screenshot_url ? (
                        <img
                          src={entry.profile_screenshot_url}
                          alt={`${entry.trainer_name}'s profile`}
                          className="trainer-avatar"
                          style={{
                            cursor: trialStatus.canClickIntoProfiles ? 'pointer' : 'default',
                            opacity: trialStatus.canClickIntoProfiles ? 1 : 0.6
                          }}
                          onClick={() => handleTrainerClick(entry)}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          <span>👤</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
      
      {!trialStatus.isPaidUser && (
        <div className="leaderboard-upgrade-prompt">
          <div className="upgrade-prompt-content">
            <h3>🚀 Want to do more?</h3>
            <p>
              {trialStatus.isInTrial 
                ? `You have ${trialStatus.timeRemaining.days > 0 
                    ? `${trialStatus.timeRemaining.days} day${trialStatus.timeRemaining.days !== 1 ? 's' : ''}, ${trialStatus.timeRemaining.hours} hour${trialStatus.timeRemaining.hours !== 1 ? 's' : ''}, and ${trialStatus.timeRemaining.minutes} minute${trialStatus.timeRemaining.minutes !== 1 ? 's' : ''}` 
                    : trialStatus.timeRemaining.hours > 0 
                    ? `${trialStatus.timeRemaining.hours} hour${trialStatus.timeRemaining.hours !== 1 ? 's' : ''} and ${trialStatus.timeRemaining.minutes} minute${trialStatus.timeRemaining.minutes !== 1 ? 's' : ''}`
                    : `${trialStatus.timeRemaining.minutes} minute${trialStatus.timeRemaining.minutes !== 1 ? 's' : ''}`
                  } left in your trial. Upgrade now to continue accessing premium features!`
                : 'Upgrade to Premium to view detailed profiles, appear on leaderboards, and unlock all features!'
              }
            </p>
            <button className="upgrade-button" onClick={handleUpgradeClick}>
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 