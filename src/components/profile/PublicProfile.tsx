import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { profileService, type PublicProfileData } from '../../services/profileService'
import { dashboardService } from '../../services/dashboardService'
import { PerformanceRadarChart } from '../dashboard/RadarChart'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { SocialIcon, SOCIAL_MEDIA } from '../common/SocialIcons'
import { CountryFlag } from '../common/CountryFlag'
import { VerificationScreenshotsModal } from '../shareables/VerificationScreenshotsModal'

// Social platform definitions matching ProfileInfo
const getSocialPlatformsConfig = () => [
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'snapchat', name: 'Snapchat' },
  { id: 'twitter', name: 'Twitter' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'twitch', name: 'Twitch' },
  { id: 'github', name: 'GitHub' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'discord', name: 'Discord' },
  { id: 'telegram', name: 'Telegram' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'vimeo', name: 'Vimeo' },
]

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
  const [selectedTimeframe, setSelectedTimeframe] = useState<'weekly' | 'monthly' | 'alltime'>('monthly')
  const [showAllSocial, setShowAllSocial] = useState(false)

  const [verificationScreenshots, setVerificationScreenshots] = useState<any[]>([])
  const [screenshotsLoading, setScreenshotsLoading] = useState(false)
  const [showScreenshots, setShowScreenshots] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const trialStatus = useTrialStatus()
  
  // Determine if trainer code should be shown based on viewer status
  const shouldShowTrainerCode = () => {
    // Trial users can never see trainer codes
    if (!trialStatus.isPaidUser) {
      return false
    }
    // Paid users see trainer codes if the profile owner has made it public
    return profile?.is_paid_user && profile?.trainer_code && !profile?.trainer_code_private
  }
  
  // Determine if social links should be shown based on viewer status
  const shouldShowSocialLinks = () => {
    // Trial users can never see social links
    if (!trialStatus.isPaidUser) {
      return false
    }
    // Paid users see social links if the profile owner has made them public
    return profile?.is_paid_user && !profile?.social_links_private
  }

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
      const screenshots = await dashboardService.getVerificationScreenshots(profile.user_id, 7)
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
      case 'facebook':
        return value.includes('facebook.com') ? value : `https://facebook.com/${value}`
      case 'snapchat':
        return value.startsWith('@') ? `https://snapchat.com/add/${value.slice(1)}` : `https://snapchat.com/add/${value}`
      case 'github':
        return `https://github.com/${value}`
      case 'discord':
        return value
      case 'telegram':
        return value.startsWith('@') ? `https://t.me/${value.slice(1)}` : `https://t.me/${value}`
      case 'whatsapp':
        return `https://wa.me/${value}`
      case 'vimeo':
        return value.includes('vimeo.com') ? value : `https://vimeo.com/${value}`
      default:
        return value
    }
  }

  // Get connected social platforms
  const getConnectedPlatforms = () => {
    if (!profile) return [];
    const allPlatforms = getSocialPlatformsConfig();
    return allPlatforms.filter(platform => {
      const value = profile[platform.id as keyof PublicProfileData];
      return value && typeof value === 'string' && value.trim() !== '';
    });
  };

  const connectedPlatforms = getConnectedPlatforms();
  const visiblePlatforms = connectedPlatforms.slice(0, 4);
  const remainingPlatforms = connectedPlatforms.slice(4);
  const hasMorePlatforms = remainingPlatforms.length > 0;

  const copyTrainerCode = () => {
    if (profile?.trainer_code) {
      navigator.clipboard.writeText(profile.trainer_code.replace(/\s/g, ''))
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
      

      {/* Profile Card Container */}
      <div className="profile-card-container">
        <div className="profile-main-layout">
          
          {/* Left Column - Player Information */}
          <div className="profile-left-column">
            
            {/* Player Identity */}
            <div className="player-identity">
              <div className="player-level">
                {profile.trainer_level || 1}
                <div className="player-level-label">LVL</div>
              </div>
              
              <div className="player-info">
                <div className="player-name">{profile.trainer_name || 'Trainer'}</div>
                <div className="player-location">
                  {profile.country && <CountryFlag countryName={profile.country} size={16} />}
                  <span>{profile.country || 'Unknown'}</span>
                </div>
                {/* Social Icons - Show up to 4 with +N button */}
                {connectedPlatforms.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginTop: '8px',
                    alignItems: 'center',
                  }}>
                    {/* Show first 4 connected platforms */}
                    {visiblePlatforms.map((platform) => (
                      <a
                        key={platform.id}
                        href={getSocialLink(platform.id, profile[platform.id as keyof PublicProfileData] as string)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-80 transition-opacity"
                        title={`Visit on ${platform.name}`}
                      >
                        <img 
                          src={`/images/${platform.id}.svg`} 
                          alt={platform.name} 
                          style={{ width: '26.59px', height: '26.59px' }} 
                        />
                      </a>
                    ))}
                    
                    {/* +N Button if there are more than 4 connected platforms */}
                    {hasMorePlatforms && (
                      <div
                        onClick={() => setShowAllSocial(true)}
                        style={{
                          width: '26.59px',
                          height: '26.59px',
                          background: '#000000',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        className="hover:opacity-80 transition-opacity"
                        title="View more social accounts"
                      >
                        <span style={{
                          fontFamily: 'Poppins',
                          fontWeight: 600,
                          fontSize: '12px',
                          color: '#FFFFFF',
                        }}>
                          +{remainingPlatforms.length}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="public-mode-badge">Public mode</div>
            </div>

            {/* Detailed Stats */}
            <div className="detailed-stats">
              <div className="stat-row">
                <span className="stat-label">Team:</span>
                <span className="stat-value team-value">{selectedTeam?.label || 'Unknown'}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Start Date:</span>
                <span className="stat-value">
                {profile.start_date ? new Date(profile.start_date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric'
                }) : 'N/A'}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Summit Date:</span>
                <span className="stat-value">
                {(profile.trainer_level || 0) >= 80 ? 'Complete' : 'In Progress'}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Trainer Code:</span>
                <span className="stat-value" style={{
                  color: shouldShowTrainerCode() ? '#000000' : '#848282'
                }}>
                {shouldShowTrainerCode() ? (
                    <>
                      {profile.trainer_code}
                      <span className="copy-icon" onClick={copyTrainerCode}>📋</span>
                    </>
                ) : (
                  '205***********'
                )}
                </span>
              </div>
            </div>

            {/* Timeframe Tabs */}
            <div className="timeframe-tabs">
              <button 
                className={`timeframe-tab ${selectedTimeframe === 'weekly' ? 'active' : ''}`}
                onClick={() => setSelectedTimeframe('weekly')}
              >
                Week
              </button>
              <button 
                className={`timeframe-tab ${selectedTimeframe === 'monthly' ? 'active' : ''}`}
                onClick={() => setSelectedTimeframe('monthly')}
              >
                Month
              </button>
              <button 
                className={`timeframe-tab ${selectedTimeframe === 'alltime' ? 'active' : ''}`}
                onClick={() => setSelectedTimeframe('alltime')}
              >
                All Time
              </button>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-value">{(profile.distance_walked || 0).toLocaleString()} km</div>
                <div className="kpi-label">Distance Walked</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">{(profile.pokemon_caught || 0).toLocaleString()}</div>
                <div className="kpi-label">Pokémon Caught</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">{(profile.pokestops_visited || 0).toLocaleString()}</div>
                <div className="kpi-label">Pokéstops Visited</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">{(profile.total_xp || 0).toLocaleString()}</div>
                <div className="kpi-label">Total XP</div>
              </div>
            </div>

            {/* Shareables Hub */}
            <div className="shareables-hub">
              <div className="shareables-header">
                <span>📤</span>
                <span className="shareables-title">Shareables Hub</span>
              </div>
              <div className="shareables-description">
                Create shareable cards of your achievements and stats. Show off your progress and let the community verify your accomplishments.
              </div>
              <div className="verification-badge">
                <button 
                  className="verification-left hover:opacity-80 transition-opacity cursor-pointer"
                  onClick={() => setShowVerificationModal(true)}
                  title="View verification screenshots"
                >
                  <span className="verification-icon">✅</span>
                  <div>
                    <div className="verification-text">Stats verified</div>
                    <div className="verification-date">Uploaded Jul 15th, 2025</div>
                  </div>
                </button>
                <span className="delete-icon">🗑️</span>
              </div>
              <div className="disclaimer">
                Screenshots are publicly viewable for transparency and anti-cheat verification.
              </div>
            </div>
          </div>

          {/* Right Column - Statistics */}
          <div className="profile-right-column">
            
            {/* Grind Stats */}
            <div className="grind-stats">
              <div className="grind-stats-title">Grind Stats</div>
              <div className="grind-stats-grid">
                <div className="grind-stat-card">
                  <div className="grind-stat-value">4.6</div>
                  <div className="grind-stat-label">Km</div>
                </div>
                <div className="grind-stat-card">
                  <div className="grind-stat-value">52.1</div>
                  <div className="grind-stat-label">Caught</div>
                </div>
                <div className="grind-stat-card">
                  <div className="grind-stat-value">46.8</div>
                  <div className="grind-stat-label">Stops</div>
                </div>
                <div className="grind-stat-card">
                  <div className="grind-stat-value">33.4K</div>
                  <div className="grind-stat-label">XP</div>
                </div>
              </div>
            </div>

            {/* Performance Overview */}
            <div className="performance-overview">
              <div className="performance-title">Performance Overview</div>
              <div className="radar-chart-container">
                <PerformanceRadarChart
                  profile={profile ? {
                    ...profile,
                    id: profile.id || '',
                    user_id: profile.user_id,
                    trainer_code: profile.trainer_code || '',
                    trainer_code_private: !profile.is_paid_user,
                    social_links_private: profile.social_links_private || false
                  } : null}
                  isPaidUser={trialStatus.isPaidUser}
                  showHeader={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Links Section */}
      <div className="section-header">
        <h2>Social Links</h2>
      </div>
      <div className="social-links-container">
        {shouldShowSocialLinks() ? (
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
          <div className="social-links-grid">
            {SOCIAL_MEDIA.map(platform => {
              const value = profile?.[platform.key as keyof typeof profile];
              if (value && value !== '' && typeof value === 'string') {
                return (
                  <div 
                    key={platform.key}
                    className="social-link"
                    style={{
                      opacity: 0.4,
                      filter: 'grayscale(100%)',
                      cursor: 'default',
                      pointerEvents: 'none'
                    }}
                    title="Private"
                  >
                    <SocialIcon platform={platform.key} size={24} color="currentColor" />
                    <span>{value}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
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

      {/* Verification Screenshots Modal */}
      <VerificationScreenshotsModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        userId={id || ''}
        userName={profile?.trainer_name}
      />

      {/* Modal for all social accounts - Matching SocialConnectModal design */}
      {showAllSocial && profile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAllSocial(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              width: '351px',
              height: 'auto',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowAllSocial(false)}
              style={{
                position: 'absolute',
                width: '24px',
                height: '24px',
                right: '13px',
                top: '13px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="hover:opacity-70 transition-opacity"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Social Accounts Grid - Matching SocialConnectModal */}
            <div
              style={{
                padding: '60px 16px 24px 16px',
                width: '100%',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '28.25px 31.33px',
                  width: '100%',
                  justifyItems: 'center',
                }}
              >
                {connectedPlatforms.map((platform) => (
                  <a
                    key={platform.id}
                    href={getSocialLink(platform.id, profile[platform.id as keyof PublicProfileData] as string)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                    }}
                    className="hover:opacity-80 transition-opacity"
                    title={`Visit on ${platform.name}`}
                  >
                    <img 
                      src={`/images/${platform.id}.svg`} 
                      alt={platform.name} 
                      style={{ 
                        width: '44px', 
                        height: '44px',
                      }} 
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 