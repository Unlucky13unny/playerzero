import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { useValuePropModal } from '../../hooks/useValuePropModal'
import { ValuePropModal } from '../upgrade/ValuePropModal'
import { QuickProfileView } from '../profile/QuickProfileView'
import { dashboardService, type LeaderboardEntry } from '../../services/dashboardService'
import { FaMedal, FaGlobe, FaUsers, FaShieldAlt, FaSearch } from 'react-icons/fa'

// Import country list from profile setup
const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 
  'Japan', 'South Korea', 'Brazil', 'Mexico', 'Italy', 'Spain', 'Netherlands',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Other'
]

// Import team colors from profile setup
const TEAM_COLORS = [
  { value: 'blue', label: 'Blue', color: '#0074D9', team: 'Team Blue' },
  { value: 'red', label: 'Red', color: '#FF4136', team: 'Team Red' },
  { value: 'yellow', label: 'Yellow', color: '#FFDC00', team: 'Team Yellow' },
  { value: 'black', label: 'Black', color: '#111111', team: 'Team Black' },
  { value: 'green', label: 'Green', color: '#2ECC40', team: 'Team Green' },
  { value: 'orange', label: 'Orange', color: '#FF851B', team: 'Team Orange' },
  { value: 'purple', label: 'Purple', color: '#B10DC9', team: 'Team Purple' },
  { value: 'pink', label: 'Pink', color: '#F012BE', team: 'Team Pink' }
]

interface LeaderboardsProps {
  isPaidUser: boolean
}

export const Leaderboards = ({ isPaidUser }: LeaderboardsProps) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const trialStatus = useTrialStatus()
  const { isOpen, showValueProp, closeValueProp, daysRemaining } = useValuePropModal()
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all-time'>('weekly')
  const [sortBy, setSortBy] = useState<'xp' | 'catches' | 'distance' | 'pokestops'>('xp')
  const [view, setView] = useState<'all' | 'country' | 'team' | 'search'>(
    (searchParams.get('view') as 'all' | 'country' | 'team' | 'search') || 'all'
  )
  const [filterValue, setFilterValue] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [quickViewAnchor, setQuickViewAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Update view when URL parameter changes
    const viewParam = searchParams.get('view') as 'all' | 'country' | 'team' | 'search'
    if (viewParam && ['all', 'country', 'team', 'search'].includes(viewParam)) {
      setView(viewParam)
    }
    loadLeaderboard()
  }, [period, sortBy, view, filterValue, searchQuery])

  const loadLeaderboard = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data } = await dashboardService.getLeaderboard({
        period,
        sortBy,
        view,
        filterValue: view === 'search' ? searchQuery : filterValue
      })
      setLeaderboard(data || [])
    } catch (err: any) {
      console.error('Leaderboard error:', err)
      setError(err.message || 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const handleTrainerClick = (entry: LeaderboardEntry, event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setSelectedProfile(entry.profile_id);
    setQuickViewAnchor(event.currentTarget);
  };

  const handleCloseQuickView = () => {
    setSelectedProfile(null);
    setQuickViewAnchor(null);
  };

  const handleUpgradeClick = () => {
    navigate('/upgrade')
  }

  const getTeamColor = (teamColor: string) => {
    const team = TEAM_COLORS.find(t => t.value === teamColor)
    return team?.color || '#666666'
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

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <FaMedal className="rank-icon gold" />
    if (rank === 1) return <FaMedal className="rank-icon silver" />
    if (rank === 2) return <FaMedal className="rank-icon bronze" />
    return <span className="rank-number">{rank + 1}</span>
  }

  return (
    <div className="leaderboards-container">
      <ValuePropModal 
        isOpen={isOpen} 
        onClose={closeValueProp} 
        daysRemaining={daysRemaining} 
      />
      
      <QuickProfileView
        profileId={selectedProfile || ''}
        isOpen={!!selectedProfile}
        onClose={handleCloseQuickView}
        anchorEl={quickViewAnchor}
      />

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

      {/* View Filters */}
      <div className="view-filters">
        <button
          className={`view-tab ${view === 'all' ? 'active' : ''}`}
          onClick={() => {
            setView('all')
            setFilterValue('')
            setSearchQuery('')
          }}
        >
          <FaUsers className="view-icon" /> All Trainers
        </button>
        <button
          className={`view-tab ${view === 'country' ? 'active' : ''}`}
          onClick={() => {
            setView('country')
            setSearchQuery('')
          }}
        >
          <FaGlobe className="view-icon" /> By Country
        </button>
        <button
          className={`view-tab ${view === 'team' ? 'active' : ''}`}
          onClick={() => {
            setView('team')
            setSearchQuery('')
          }}
        >
          <FaShieldAlt className="view-icon" /> By Team
        </button>
        <button
          className={`view-tab ${view === 'search' ? 'active' : ''}`}
          onClick={() => {
            setView('search')
            setFilterValue('')
          }}
        >
          <FaSearch className="view-icon" /> Search
        </button>
      </div>

      {/* Secondary Filters */}
      <div className="secondary-filters">
        {view === 'country' && (
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="filter-select"
          >
            <option value="">Select Country</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        )}
        {view === 'team' && (
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="filter-select"
          >
            <option value="">Select Team</option>
            {TEAM_COLORS.map((team) => (
              <option 
                key={team.value} 
                value={team.value}
                style={{ color: team.color }}
              >
                {team.team}
              </option>
            ))}
          </select>
        )}
        {view === 'search' && (
          <div className="search-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by trainer name..."
              className="search-input"
            />
          </div>
        )}
      </div>

      {/* Time Period Filters */}
      <div className="leaderboard-filters">
        <div className="filter-group">
          <div className="period-tabs">
            <button
              className={`period-tab ${period === 'weekly' ? 'active' : ''}`}
              onClick={() => setPeriod('weekly')}
            >
              Weekly
            </button>
            <button
              className={`period-tab ${period === 'monthly' ? 'active' : ''}`}
              onClick={() => setPeriod('monthly')}
            >
              Monthly
            </button>
            <button
              className={`period-tab ${period === 'all-time' ? 'active' : ''}`}
              onClick={() => setPeriod('all-time')}
            >
              All-Time
            </button>
          </div>
        </div>

        <div className="filter-group">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="xp">XP {period === 'all-time' ? 'Total' : 'Gained'}</option>
            <option value="catches">Pokémon {period === 'all-time' ? 'Total' : 'Caught'}</option>
            <option value="distance">Distance {period === 'all-time' ? 'Total' : 'Walked'}</option>
            <option value="pokestops">PokéStops {period === 'all-time' ? 'Total' : 'Visited'}</option>
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
                {view === 'search' ? (
                  <>
                    <h3>No Trainers Found</h3>
                    {isPaidUser ? (
                      <p>Try adjusting your search terms or check back later.</p>
                    ) : (
                      <>
                        <p>Upgrade to Premium to unlock full search capabilities!</p>
                        <button 
                          className="upgrade-cta"
                          onClick={handleUpgradeClick}
                        >
                          ✨ Upgrade to Premium
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h3>No Premium Members Yet</h3>
                    <p>Be the first to upgrade and claim the top spot!</p>
                    <button 
                      className="upgrade-cta"
                      onClick={handleUpgradeClick}
                    >
                      ✨ Upgrade to Premium
                    </button>
                  </>
                )}
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
                      {getRankIcon(index)}
                    </div>

                    <div className="trainer-section">
                      <div className="trainer-info">
                        <span 
                          className={`trainer-name ${trialStatus.canClickIntoProfiles ? 'clickable' : 'browse-only'}`}
                          onClick={(e) => handleTrainerClick(entry, e)}
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
                          <span className="country">
                            {entry.country}
                          </span>
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
                          onClick={(e) => handleTrainerClick(entry, e)}
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
      
      {!trialStatus.isPaidUser && !trialStatus.isInTrial && (
        <div className="leaderboard-upgrade-prompt">
          <div className="upgrade-prompt-content">
            <h3>Private Mode Ended</h3>
            <p>To keep tracking your grind and unlock your leaderboard placement, upgrade for $5.99.</p>
            <button className="upgrade-button" onClick={handleUpgradeClick}>
              Upgrade Now
            </button>
          </div>
        </div>
      )}
      {!trialStatus.isPaidUser && trialStatus.isInTrial && (
        <div className="leaderboard-upgrade-prompt">
          <div className="upgrade-prompt-content">
            <h3>🔒 Private Mode Active</h3>
            <p>
              You have {trialStatus.timeRemaining.days > 0 
                ? `${trialStatus.timeRemaining.days} day${trialStatus.timeRemaining.days !== 1 ? 's' : ''}, ${trialStatus.timeRemaining.hours} hour${trialStatus.timeRemaining.hours !== 1 ? 's' : ''}, and ${trialStatus.timeRemaining.minutes} minute${trialStatus.timeRemaining.minutes !== 1 ? 's' : ''}` 
                : trialStatus.timeRemaining.hours > 0 
                ? `${trialStatus.timeRemaining.hours} hour${trialStatus.timeRemaining.hours !== 1 ? 's' : ''} and ${trialStatus.timeRemaining.minutes} minute${trialStatus.timeRemaining.minutes !== 1 ? 's' : ''}`
                : `${trialStatus.timeRemaining.minutes} minute${trialStatus.timeRemaining.minutes !== 1 ? 's' : ''}`
              } left in private mode. Upgrade now to continue accessing premium features!
            </p>
            <button className="upgrade-button" onClick={handleUpgradeClick}>
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 