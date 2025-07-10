import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { profileService, type PublicProfileData } from '../../services/profileService'
import { RadarChart } from '../dashboard/RadarChart'
import { useAuth } from '../../contexts/AuthContext'

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
  const { profileId } = useParams<{ profileId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const trialStatus = useTrialStatus()
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPaid, setIsPaid] = useState(false)

  useEffect(() => {
    if (profileId) {
      loadProfile()
      checkPaidStatus()
    }
  }, [profileId])

  const loadProfile = async () => {
    if (!profileId) return

    try {
    setLoading(true)
    setError(null)
      const { data } = await profileService.getPublicProfile(profileId)
      setProfile(data)
    } catch (err: any) {
      console.error('Profile loading error:', err)
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const checkPaidStatus = async () => {
    try {
      const { isPaid } = await profileService.isPaidUser()
      setIsPaid(isPaid)
    } catch (error) {
      console.error('Error checking paid status:', error)
      setIsPaid(false)
    }
  }

  const selectedTeam = profile?.team_color 
    ? TEAM_COLORS.find(team => team.value === profile.team_color)
    : null

  const getSocialLink = (platform: string, value: string) => {
    if (!value) return null
    
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

  const renderSocialLinks = () => {
    if (!profile || !profile.is_paid_user) {
      return (
        <div className="profile-section">
          <h3>Social Links</h3>
          <p className="private-notice">This user's social links are private</p>
        </div>
      );
    }

    return (
      <div className="profile-section">
        <h3>Social Links</h3>
        <div className="social-links">
          {profile.instagram && (
            <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer">
              <span className="social-icon">📸</span> {profile.instagram}
            </a>
          )}
          {/* Add other social links similarly */}
        </div>
      </div>
    );
  };

  const renderTrainerCode = () => {
    if (!profile || !profile.is_paid_user) {
      return (
        <div className="profile-section">
          <h3>Trainer Code</h3>
          <p className="private-notice">This user's trainer code is private</p>
        </div>
      );
    }

    return (
      <div className="profile-section">
        <h3>Trainer Code</h3>
        <div className="trainer-code">
          <span className="code">{profile.trainer_code}</span>
        </div>
      </div>
    );
  };

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
              <div className="team-badge" style={{ backgroundColor: selectedTeam.color }}>
                <span className="team-icon">{TEAM_COLORS.find(t => t.value === selectedTeam.value)?.team || selectedTeam.team}</span>
              </div>
            )}
            {profile.country && (
              <div className="country-badge">
                <span className="country-icon">🌍</span>
                <span className="country-name">{profile.country}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚶</div>
          <div className="stat-content">
            <h3>Distance Walked</h3>
            <div className="stat-value">{profile.distance_walked || 0} km</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>Pokémon Caught</h3>
            <div className="stat-value">{profile.pokemon_caught || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <h3>PokéStops Visited</h3>
            <div className="stat-value">{profile.pokestops_visited || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Total XP</h3>
            <div className="stat-value">{profile.total_xp || 0}</div>
          </div>
        </div>
        <div className="stat-card full-width">
          <div className="stat-icon">📖</div>
          <div className="stat-content">
            <h3>Pokédex Entries</h3>
            <div className="stat-value">{profile.unique_pokedex_entries || 0}</div>
          </div>
        </div>
      </div>

      {/* Social Links and Trainer Code */}
      <div className="stats-grid" style={{ marginTop: '1rem' }}>
        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-content">
            <h3>Social Links</h3>
            {profile.is_paid_user ? (
              <div className="social-links">
                {profile.instagram && profile.instagram !== '' && (
                  <a href={getSocialLink('instagram', profile.instagram)} target="_blank" rel="noopener noreferrer" className="social-link">
                    <span className="social-icon">📸</span> {profile.instagram}
                  </a>
                )}
                {profile.twitter && profile.twitter !== '' && (
                  <a href={getSocialLink('twitter', profile.twitter)} target="_blank" rel="noopener noreferrer" className="social-link">
                    <span className="social-icon">🐦</span> {profile.twitter}
                  </a>
                )}
                {profile.youtube && profile.youtube !== '' && (
                  <a href={getSocialLink('youtube', profile.youtube)} target="_blank" rel="noopener noreferrer" className="social-link">
                    <span className="social-icon">🎥</span> {profile.youtube}
                  </a>
                )}
                {profile.twitch && profile.twitch !== '' && (
                  <a href={getSocialLink('twitch', profile.twitch)} target="_blank" rel="noopener noreferrer" className="social-link">
                    <span className="social-icon">🎮</span> {profile.twitch}
                  </a>
                )}
                {profile.reddit && profile.reddit !== '' && (
                  <a href={getSocialLink('reddit', profile.reddit)} target="_blank" rel="noopener noreferrer" className="social-link">
                    <span className="social-icon">👽</span> {profile.reddit}
                  </a>
                )}
              </div>
            ) : (
              <p className="private-notice">This user's social links are private</p>
            )}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎮</div>
          <div className="stat-content">
            <h3>Trainer Code</h3>
            {profile.is_paid_user && profile.trainer_code ? (
              <div className="trainer-code">
                <span className="code">{profile.trainer_code}</span>
              </div>
            ) : (
              <p className="private-notice">This user's trainer code is private</p>
            )}
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="radar-chart-section">
        <h2>Performance Overview</h2>
        <div className="radar-chart-container">
          <RadarChart
            profile={{
              ...profile,
              user_id: profile.id,
              trainer_code: profile.trainer_code || '',
              trainer_code_private: !profile.is_paid_user
            }}
            isPaidUser={profile.is_paid_user}
            showHeader={false}
          />
        </div>
      </div>
    </div>
  )
} 