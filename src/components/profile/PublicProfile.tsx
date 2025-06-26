import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  { value: 'blue', label: 'Mystic', color: '#0074D9', team: 'Team Mystic' },
  { value: 'red', label: 'Valor', color: '#FF4136', team: 'Team Valor' },
  { value: 'yellow', label: 'Instinct', color: '#FFDC00', team: 'Team Instinct' },
  { value: 'black', label: 'Black', color: '#111111', team: 'Black' },
  { value: 'green', label: 'Green', color: '#2ECC40', team: 'Green' },
  { value: 'orange', label: 'Orange', color: '#FF851B', team: 'Orange' },
  { value: 'purple', label: 'Purple', color: '#B10DC9', team: 'Purple' },
  { value: 'pink', label: 'Pink', color: '#F012BE', team: 'Pink' }
]

export const PublicProfile = () => {
  const { profileId } = useParams<{ profileId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userMetadata } = useAuth()

  useEffect(() => {
    if (profileId) {
      loadProfile()
    }
  }, [profileId])

  const loadProfile = async () => {
    if (!profileId) return

    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await profileService.getPublicProfile(profileId)
      if (error) {
        throw new Error(error.message)
      }
      setProfile(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const selectedTeam = profile ? TEAM_COLORS.find(team => team.value === profile.team_color) : null

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

  const isPaid = profile?.is_paid_user === true

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-content">
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 0.75rem' }}></div>
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-content">
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <h3>Profile Not Found</h3>
              <p>{error || 'This profile could not be found or is not public.'}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="nav-button primary"
                style={{ marginTop: '0.75rem' }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-wrapper">
        <div className="profile-setup-card" style={{ maxWidth: '800px' }}>
          <div className="profile-setup-content" style={{ padding: '1.5rem' }}>
            
            {/* Compact Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '2rem',
              padding: '1.5rem 0 1.25rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              gap: '2rem',
              position: 'relative',
            }}>
              <div style={{ minWidth: 100, display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  onClick={() => navigate(-1)}
                  className="back-button"
                  style={{ 
                    background: 'rgba(139, 0, 0, 0.2)',
                    border: '1px solid rgba(139, 0, 0, 0.4)',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 1.25rem',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 500
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </div>
              <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h1 style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold', 
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    {profile.trainer_name}
                  </h1>
                </div>
                <p style={{ 
                  color: '#888', 
                  margin: '0.25rem 0 0 0',
                  fontSize: '1rem'
                }}>
                  Level {profile.trainer_level} • {profile.country || 'Unknown Location'}
                </p>
              </div>
              <div style={{ minWidth: 100, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                {profile.is_paid_user && (
                  <span style={{ 
                    fontSize: '0.95rem',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: '#000',
                    padding: '0.3rem 0.7rem',
                    borderRadius: '0.375rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px',
                    display: 'inline-block'
                  }}>
                    👑 PREMIUM
                  </span>
                )}
              </div>
            </div>

            {/* Compact Main Content Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: profile.profile_screenshot_url ? '1fr 200px' : '1fr',
              gap: '1.5rem',
              alignItems: 'start'
            }}>
              
              {/* Left Column - Info & Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Basic Info & Team */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: selectedTeam ? '1fr 1fr' : '1fr',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>Start Date</div>
                    <div style={{ fontSize: '0.875rem' }}>
                      {profile.start_date ? new Date(profile.start_date).toLocaleDateString() : 'Not set'}
                    </div>
                  </div>
                  
                  {selectedTeam && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div 
                        style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          backgroundColor: selectedTeam.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          color: selectedTeam.value === 'yellow' ? '#000' : '#fff'
                        }}
                      >
                        {selectedTeam.value === 'blue' ? '🔵' : selectedTeam.value === 'red' ? '🔴' : '🟡'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: selectedTeam.color }}>
                          {selectedTeam.team}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact Stats Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {[
                    { key: 'total_xp', label: 'Total XP', icon: '⚡', color: '#fbbf24' },
                    { key: 'pokemon_caught', label: 'Caught', icon: '🔴', color: '#ef4444' },
                    { key: 'distance_walked', label: 'Distance', icon: '🚶', color: '#22c55e', unit: 'km' },
                    { key: 'pokestops_visited', label: 'PokéStops', icon: '📍', color: '#3b82f6' },
                    { key: 'unique_pokedex_entries', label: 'Pokédex', icon: '📖', color: '#8b5cf6' }
                  ].map((stat) => (
                    <div key={stat.key} style={{
                      padding: '0.75rem',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>{stat.label}</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: stat.color }}>
                        {(profile[stat.key as keyof PublicProfileData] as number || 0).toLocaleString()}
                        {stat.unit && ` ${stat.unit}`}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Performance Radar */}
                <div style={{ 
                  marginTop: '2rem',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  paddingTop: '2rem'
                }}>
                  <RadarChart 
                    profile={{
                      ...profile,
                      user_id: '',
                      trainer_code: '',
                      trainer_code_private: true
                    }} 
                    isPaidUser={isPaid} 
                    showHeader={false}
                  />
                </div>

                {/* Compact Social Media */}
                <div style={{ 
                  padding: '1rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <h4 style={{ 
                    margin: '0 0 0.75rem 0', 
                    fontSize: '0.875rem', 
                    color: '#888',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    🌐 Social Media
                  </h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '0.5rem'
                  }}>
                    {[
                      { key: 'instagram', label: 'Instagram', icon: '📷' },
                      { key: 'tiktok', label: 'TikTok', icon: '🎵' },
                      { key: 'twitter', label: 'Twitter', icon: '🐦' },
                      { key: 'youtube', label: 'YouTube', icon: '📺' },
                      { key: 'twitch', label: 'Twitch', icon: '🎮' },
                      { key: 'reddit', label: 'Reddit', icon: '🤖' }
                    ].map((social) => {
                      const value = profile[social.key as keyof PublicProfileData] as string
                      const link = getSocialLink(social.key, value)
                      
                      if (!value) return null
                      
                      return (
                        <div key={social.key} style={{
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                            <span>{social.icon}</span>
                            <span style={{ color: '#888' }}>{social.label}</span>
                          </div>
                          {link ? (
                            <a 
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ 
                                color: '#00d4aa', 
                                textDecoration: 'none',
                                fontSize: '0.75rem'
                              }}
                            >
                              {value}
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.75rem' }}>{value}</span>
                          )}
                        </div>
                      )
                    }).filter(Boolean)}
                  </div>
                  {![
                    'instagram', 'tiktok', 'twitter', 'youtube', 'twitch', 'reddit'
                  ].some(key => profile[key as keyof PublicProfileData]) && (
                    <div style={{ color: '#666', fontSize: '0.75rem', textAlign: 'center' }}>
                      No social media links available
                    </div>
                  )}
                </div>

                {/* Profile Dates */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  fontSize: '0.75rem',
                  color: '#888'
                }}>
                  <div>
                    <span>Member since: </span>
                    <span style={{ color: '#fff' }}>{new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span>Last updated: </span>
                    <span style={{ color: '#fff' }}>{new Date(profile.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Profile Screenshot */}
              {profile.profile_screenshot_url && (
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ 
                    margin: '0 0 0.75rem 0', 
                    fontSize: '0.875rem', 
                    color: '#888'
                  }}>
                    📸 Profile Screenshot
                  </h4>
                  <img 
                    src={profile.profile_screenshot_url} 
                    alt={`${profile.trainer_name}'s profile`}
                    style={{ 
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }} 
                  />
                </div>
              )}
            </div>

            {/* Compact Navigation */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              <button
                onClick={() => navigate('/dashboard')}
                className="nav-button primary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 