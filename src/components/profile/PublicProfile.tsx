import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { profileService, type PublicProfileData } from '../../services/profileService'
import { dashboardService } from '../../services/dashboardService'
import { RadarChart } from '../dashboard/RadarChart'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { SocialIcon, SOCIAL_MEDIA } from '../common/SocialIcons'

interface TeamColor {
  value: string
  label: string
  color: string
  team: string
}

const TEAM_COLORS: TeamColor[] = [
  { value: 'blue', label: 'Blue', color: '#0074D9', team: 'Blue Team' },
  { value: 'red', label: 'Red', color: '#FF4136', team: 'Red Team' },
  { value: 'yellow', label: 'Yellow', color: '#FFDC00', team: 'Yellow Team' },
  { value: 'black', label: 'Black', color: '#111111', team: 'Black Team' },
  { value: 'green', label: 'Green', color: '#2ECC40', team: 'Green Team' },
  { value: 'orange', label: 'Orange', color: '#FF851B', team: 'Orange Team' },
  { value: 'purple', label: 'Purple', color: '#B10DC9', team: 'Purple Team' },
  { value: 'pink', label: 'Pink', color: '#F012BE', team: 'Pink Team' }
]

export const PublicProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<TeamColor | null>(null)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [verificationScreenshots, setVerificationScreenshots] = useState<any[]>([])
  const [screenshotsLoading, setScreenshotsLoading] = useState(false)
  const [showScreenshots, setShowScreenshots] = useState(false)
  const trialStatus = useTrialStatus()

  useEffect(() => {
    loadProfile()
  }, [id])

  // Anti-screenshot protection
  useEffect(() => {
    const preventScreenshots = (e: KeyboardEvent) => {
      // Prevent Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault()
        console.log('Screenshot attempt detected and blocked')
      }
      
      // Prevent common screenshot shortcuts
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        console.log('Screenshot shortcut blocked')
      }
      
      // Prevent F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault()
      }
      
      // Prevent Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault()
      }
      
      // Prevent Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault()
      }
    }

    const preventRightClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.screenshot-protected')) {
        e.preventDefault()
      }
    }

    // Blur page when switching tabs (potential screenshot attempt)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Could add additional protection here
        console.log('Page visibility changed - potential screenshot attempt')
      }
    }

    document.addEventListener('keydown', preventScreenshots)
    document.addEventListener('contextmenu', preventRightClick)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('keydown', preventScreenshots)
      document.removeEventListener('contextmenu', preventRightClick)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const loadProfile = async () => {
    if (!id) return
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await profileService.getPublicProfile(id)
      if (error) throw error

      setProfile(data)
      if (data?.team_color) {
        const team = TEAM_COLORS.find(t => t.value === data.team_color)
        setSelectedTeam(team || null)
      }
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const loadVerificationScreenshots = async () => {
    if (!profile?.user_id) return
    setScreenshotsLoading(true)

    try {
      const screenshots = await dashboardService.getVerificationScreenshots(profile.user_id, 20)
      setVerificationScreenshots(screenshots)
    } catch (err: any) {
      console.error('Error loading verification screenshots:', err)
    } finally {
      setScreenshotsLoading(false)
    }
  }

  const getSocialLink = (platform: string, value: string): string | undefined => {
    if (!value) return undefined
    
    switch (platform) {
      case 'instagram':
        return value.startsWith('@') ? `https://instagram.com/${value.slice(1)}` : `https://instagram.com/${value}`
      case 'tiktok':
        return value.startsWith('@') ? `https://tiktok.com/${value}` : `https://tiktok.com/@${value}`
      case 'twitter':
        return value.startsWith('@') ? `https://twitter.com/${value.slice(1)}` : `https://twitter.com/${value}`
      case 'youtube':
        return value.includes('youtube.com') ? value : value.startsWith('@') ? `https://youtube.com/${value}` : `https://youtube.com/c/${value}`
      case 'twitch':
        return `https://twitch.tv/${value}`
      case 'reddit':
        return value.startsWith('u/') ? `https://reddit.com/${value}` : `https://reddit.com/u/${value}`
      default:
        return value
    }
  }

  const handleCopyTrainerCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000) // Hide feedback after 2 seconds
    } catch (err) {
      console.error('Failed to copy trainer code:', err)
    }
  }

  if (loading) {
    return (
      <div className="user-home-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="user-home-container">
        <div className="error-message">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error || 'This profile could not be found or is not public.'}</span>
          <button
            onClick={() => navigate('/dashboard')}
            className="nav-button primary"
            style={{ marginTop: '0.75rem' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="user-home-container">
      {/* Page Header */}
      <div className="section-header">
        <h1 style={{ color: selectedTeam?.color || '#dc267f' }}>
          {profile.trainer_name || 'Trainer Profile'}
        </h1>
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-info">
          <div className="trainer-level">Level {profile.trainer_level || 1}</div>
          <div className="trainer-details">
            {selectedTeam && (
              <div className="team-badge">
                <div className="team-color-circle" style={{ backgroundColor: selectedTeam.color }}></div>
                <span className="team-name">{selectedTeam.team}</span>
              </div>
            )}
            {profile.country && (
              <div className="country-badge">
                <span className="country-icon">🌍</span>
                <span className="country-name">{profile.country}</span>
              </div>
            )}
            <div className="summit-badge">
              <span className="summit-icon">🏔️</span>
              <span className="summit-date">Summit: 50</span>
            </div>
            {profile.is_paid_user && (
              <div className="trainer-code-badge">
                <span className="code-icon">🎮</span>
                {profile.trainer_code_private ? (
                  <span className="code-value private">
                    <span className="private-icon">🔒</span> Hidden
                  </span>
                ) : profile.trainer_code ? (
                  <>
                    <span className="code-value">{profile.trainer_code}</span>
                    <button 
                      className="copy-button"
                      onClick={() => handleCopyTrainerCode(profile.trainer_code || '')}
                      title="Copy trainer code"
                    >
                      📋
                    </button>
                    {copyFeedback && (
                      <span className="copy-feedback">Copied!</span>
                    )}
                  </>
                ) : (
                  <span className="code-value">Not set</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Pokémon Caught</h3>
            <div className="stat-value">{profile.pokemon_caught?.toLocaleString() || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <h3>PokéStops Visited</h3>
            <div className="stat-value">{profile.pokestops_visited?.toLocaleString() || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚶</div>
          <div className="stat-content">
            <h3>Distance Walked</h3>
            <div className="stat-value">{profile.distance_walked?.toLocaleString() || 0} km</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>Total XP</h3>
            <div className="stat-value">{profile.total_xp?.toLocaleString() || 0}</div>
          </div>
        </div>
      </div>

      {/* Social Links Section */}
      <div className="section-header">
        <h2>Social Links</h2>
      </div>
      <div className="social-links-container">
        {profile.is_paid_user ? (
          <div className="social-links-grid">
            {SOCIAL_MEDIA.map(platform => {
              const value = profile[platform.key as keyof typeof profile];
              if (value && value !== '' && typeof value === 'string') {
                return (
                  <a 
                    key={platform.key}
                    href={getSocialLink(platform.key, value)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-link"
                  >
                    <SocialIcon platform={platform.key} size={24} color="currentColor" />
                    <span>{value}</span>
                  </a>
                );
              }
              return null;
            })}
          </div>
        ) : (
          <p className="private-notice">This user's social links are private</p>
        )}
      </div>

      {/* Radar Chart */}
      <div className="radar-chart-section">
        <h2>Performance Overview</h2>
        <div className="radar-chart-container">
          <RadarChart
            profile={{
              ...profile,
              user_id: profile.user_id,
              trainer_code: profile.trainer_code || '',
              trainer_code_private: !profile.is_paid_user
            }}
            isPaidUser={trialStatus.isPaidUser}
            showHeader={false}
          />
        </div>
      </div>

      {/* Verification Screenshots */}
      <div className="verification-screenshots-section">
        <div className="screenshots-section-header">
          <div className="screenshots-title-group">
            <div className="screenshots-icon">📸</div>
            <div>
              <h2>Verification Screenshots</h2>
              <p className="screenshots-subtitle">
                View stat update verification history
                {!screenshotsLoading && verificationScreenshots.length > 0 && (
                  <span className="screenshot-count"> • {verificationScreenshots.length} screenshot{verificationScreenshots.length !== 1 ? 's' : ''}</span>
                )}
              </p>
            </div>
          </div>
          <button 
            className={`toggle-screenshots-button ${showScreenshots ? 'active' : ''}`}
            onClick={() => {
              if (!showScreenshots && verificationScreenshots.length === 0 && profile) {
                loadVerificationScreenshots()
              }
              setShowScreenshots(!showScreenshots)
            }}
          >
            <span className="toggle-icon">
              {showScreenshots ? '👁️‍🗨️' : '👁️'}
            </span>
            <span className="toggle-text">
              {showScreenshots ? 'Hide' : 'View'}
            </span>
            <span className="toggle-arrow">
              {showScreenshots ? '▲' : '▼'}
            </span>
          </button>
        </div>
        
        <div className={`screenshots-content ${showScreenshots ? 'expanded' : 'collapsed'}`}>
          {showScreenshots && (
            <>
              {screenshotsLoading ? (
                <div className="screenshots-loading-state">
                  <div className="loading-spinner-large"></div>
                  <h3>Loading Screenshots</h3>
                  <p>Fetching verification history...</p>
                </div>
              ) : verificationScreenshots.length > 0 ? (
                <div className="screenshots-grid">
                  {verificationScreenshots.map((screenshot, index) => (
                    <div key={screenshot.id} className="screenshot-card screenshot-protected">
                      <div className="screenshot-card-header">
                        <div className="screenshot-date-badge">
                          <span className="date-icon">📅</span>
                          <span className="date-text">
                            {new Date(screenshot.entry_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="screenshot-index">#{verificationScreenshots.length - index}</div>
                      </div>
                      
                      <div className="screenshot-image-container">
                        <img 
                          src={screenshot.screenshot_url} 
                          alt={`Stats verification for ${screenshot.entry_date}`}
                          className="verification-screenshot"
                          onContextMenu={(e) => e.preventDefault()}
                          onDragStart={(e) => e.preventDefault()}
                          style={{ userSelect: 'none', pointerEvents: 'none' }}
                        />
                        <div className="screenshot-overlay">
                          <div className="protection-notice">
                            <span className="shield-icon">🛡️</span>
                            <span>Screenshot Protected</span>
                          </div>
                        </div>
                      </div>

                      <div className="screenshot-stats-footer">
                        <div className="stat-badges">
                          <div className="stat-badge xp-badge">
                            <span className="stat-icon">⚡</span>
                            <span className="stat-label">XP</span>
                            <span className="stat-value">{screenshot.stat_entries.total_xp?.toLocaleString()}</span>
                          </div>
                          <div className="stat-badge caught-badge">
                            <span className="stat-icon">🔴</span>
                            <span className="stat-label">Caught</span>
                            <span className="stat-value">{screenshot.stat_entries.pokemon_caught?.toLocaleString()}</span>
                          </div>
                          <div className="stat-badge distance-badge">
                            <span className="stat-icon">👣</span>
                            <span className="stat-label">Distance</span>
                            <span className="stat-value">{screenshot.stat_entries.distance_walked?.toFixed(1)}km</span>
                          </div>
                          <div className="stat-badge stops-badge">
                            <span className="stat-icon">🔵</span>
                            <span className="stat-label">Stops</span>
                            <span className="stat-value">{screenshot.stat_entries.pokestops_visited?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-screenshots-state">
                  <div className="empty-state-icon">📷</div>
                  <h3>No Verification Screenshots</h3>
                  <p>This trainer hasn't uploaded any stat verification screenshots yet.</p>
                  <div className="empty-state-hint">
                    <span className="hint-icon">💡</span>
                    <span>Screenshots are required when updating stats to maintain leaderboard integrity</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
} 