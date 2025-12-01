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

  // Format display value for social media (what users see)
  const getDisplayValue = (platform: string, value: string): string => {
    if (!value) return value
    
    switch (platform) {
      case 'bluesky': {
        const username = value.replace('@', '')
        // If the username doesn't contain a domain, append .bsky.social
        return username.includes('.') ? username : `${username}.bsky.social`
      }
      case 'discord':
        // Discord handles should have @ prefix
        return value.startsWith('@') ? value : `@${value}`
      default:
        return value
    }
  }

  const getSocialLink = (platform: string, value: string): string | undefined => {
    if (!value) return undefined
    
    // Special handling for Bluesky URLs - ensure .bsky.social is appended
    if (platform === 'bluesky') {
      // If it's already a full bsky.app URL
      if (value.startsWith('https://bsky.app/profile/') || value.startsWith('http://bsky.app/profile/')) {
        const urlParts = value.split('/profile/')
        if (urlParts.length === 2) {
          const username = urlParts[1].replace('@', '')
          const handle = username.includes('.') ? username : `${username}.bsky.social`
          return `https://bsky.app/profile/${handle}`
        }
      }
      // If it's just a username
      const username = value.replace('@', '')
      const handle = username.includes('.') ? username : `${username}.bsky.social`
      return `https://bsky.app/profile/${handle}`
    }
    
    // If value is already a full URL, return it as is (for other platforms)
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value
    }
    
    switch (platform) {
      case 'x':
        return `https://x.com/${value.replace('@', '')}`
      case 'facebook':
        return `https://www.facebook.com/${value.replace('@', '')}`
      case 'discord':
        return value // Discord doesn't have URLs
      case 'instagram':
        return `https://www.instagram.com/${value.replace('@', '')}`
      case 'youtube':
        return `https://www.youtube.com/@${value.replace('@', '')}`
      case 'tiktok':
        return `https://www.tiktok.com/@${value.replace('@', '')}`
      case 'twitch':
        return `https://www.twitch.tv/${value.replace('@', '')}`
      case 'reddit':
        return `https://www.reddit.com/user/${value.replace('@', '')}`
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

  const [showCopyToast, setShowCopyToast] = useState(false)

  const copyDiscordHandle = (handle: string) => {
    const formattedHandle = handle.startsWith('@') ? handle : `@${handle}`
    navigator.clipboard.writeText(formattedHandle)
    setShowCopyToast(true)
    setTimeout(() => {
      setShowCopyToast(false)
    }, 2000)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%' }}>
        <p style={{ fontSize: '18px', color: '#DC2627', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textAlign: 'center', padding: '0 20px' }}>Loading your Profile...</p>
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
    <div className="user-home-container" style={{ position: 'relative' }}>
      {/* Copy Toast Notification */}
      {showCopyToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#22c55e',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '8px',
          fontFamily: 'Poppins',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          animation: 'slideDown 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap'
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.667 5L7.50033 14.1667L3.33366 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Discord handle copied!
        </div>
      )}

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
                  className="verification-left hover:opacity-80 transition-opacity"
                  onClick={() => {
                    // Only allow opening if the profile owner is a paid user
                    if (profile?.is_paid_user) {
                      setShowVerificationModal(true)
                    }
                  }}
                  title={profile?.is_paid_user ? "View verification screenshots" : "Proofs Gallery (Premium users only)"}
                  style={{ 
                    cursor: profile?.is_paid_user ? 'pointer' : 'not-allowed',
                    opacity: profile?.is_paid_user ? 1 : 0.6
                  }}
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
                // Special handling for Discord - copy instead of link
                if (platform.key === 'discord') {
                  return (
                    <div
                      key={platform.key}
                      onClick={() => copyDiscordHandle(value)}
                      className="social-link"
                      style={{ cursor: 'pointer' }}
                      title="Click to copy Discord handle"
                    >
                      <SocialIcon platform={platform.key} size={24} color="currentColor" />
                      <span>{getDisplayValue(platform.key, value)}</span>
                    </div>
                  );
                }
                
                return (
                  <a 
                    key={platform.key}
                    href={getSocialLink(platform.key, value)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-link"
                  >
                    <SocialIcon platform={platform.key} size={24} color="currentColor" />
                    <span>{getDisplayValue(platform.key, value)}</span>
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
                    <span>{getDisplayValue(platform.key, value)}</span>
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
                <div className="screenshots-loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
                  <h3 style={{ fontSize: '18px', color: '#000000', marginBottom: '0.5rem' }}>Loading Screenshots</h3>
                  <p style={{ fontSize: '14px', color: '#636874' }}>Fetching verification history...</p>
                </div>
              ) : verificationScreenshots.length > 0 ? (
                <div className="screenshots-grid">
                  {verificationScreenshots.map((screenshot, index) => (
                    <div key={screenshot.id} className="screenshot-card screenshot-protected">
                      <div className="screenshot-card-header">
                        <div className="screenshot-date-badge">
                          <span className="date-icon">📅</span>
                          <span className="date-text">
                            {new Date(screenshot.entry_date + 'T12:00:00Z').toLocaleDateString('en-US', {
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