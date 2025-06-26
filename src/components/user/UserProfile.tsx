import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { profileService, type ProfileData, type ProfileWithMetadata } from '../../services/profileService'

const TEAM_COLORS = [
  { value: 'blue', label: 'Mystic', color: '#0074D9', team: 'Team Mystic' },
  { value: 'red', label: 'Valor', color: '#FF4136', team: 'Team Valor' },
  { value: 'yellow', label: 'Instinct', color: '#FFDC00', team: 'Team Instinct' },
  { value: 'black', label: 'Black', color: '#111111', team: 'Black' },
  { value: 'green', label: 'Green', color: '#2ECC40', team: 'Green' },
  { value: 'orange', label: 'Orange', color: '#FF851B', team: 'Orange' },
  { value: 'purple', label: 'Purple', color: '#B10DC9', team: 'Purple' },
  { value: 'pink', label: 'Pink', color: '#F012BE', team: 'Pink' }
]

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 
  'Japan', 'South Korea', 'Brazil', 'Mexico', 'Italy', 'Spain', 'Netherlands',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Other'
]

export const UserProfile = () => {
  const { user, userMetadata, signOut, startFreeTrial, isInTrial, trialDaysLeft } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<ProfileWithMetadata | null>(null)
  const [editData, setEditData] = useState<ProfileData | null>(null)
  const [newScreenshot, setNewScreenshot] = useState<File | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await profileService.getProfile()
      if (error) {
        throw new Error(error.message)
      }
      setProfile(data)
      if (data) {
        setEditData(data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Error signing out:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleStartTrial = async () => {
    setError(null)
    setLoading(true)
    try {
      const { error } = await startFreeTrial()
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleUpgrade = async () => {
    navigate('/upgrade')
  }

  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
    setSuccess(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditData(profile)
    setNewScreenshot(null)
    setError(null)
    setSuccess(null)
  }

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    if (editData) {
      setEditData(prev => ({ ...prev!, [field]: value }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setNewScreenshot(file)
  }

  const handleSave = async () => {
    if (!editData) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      let updatedData = { ...editData }

      // Upload new screenshot if provided
      if (newScreenshot) {
        const { data: uploadData, error: uploadError } = await profileService.uploadProfileScreenshot(newScreenshot)
        if (uploadError) {
          throw new Error('Failed to upload screenshot: ' + uploadError.message)
        }
        updatedData.profile_screenshot_url = uploadData || ''
      }

      // Update profile in database
      const { data, error } = await profileService.updateProfile(updatedData)
      if (error) {
        throw new Error('Failed to update profile: ' + error.message)
      }

      setProfile(data)
      setEditData(data)
      setIsEditing(false)
      setNewScreenshot(null)
      setSuccess('Profile updated successfully!')
      
      // Update timeout to clear success message
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }
  
  const isPaid = profile?.is_paid_user === true
  const inTrial = isInTrial()
  const daysLeft = trialDaysLeft()

  if (loading && !profile) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-content">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-content">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h3>No Profile Found</h3>
              <p>It seems you haven't completed your profile setup yet.</p>
              <button
                onClick={() => navigate('/profile-setup')}
                className="nav-button primary"
                style={{ marginTop: '1rem' }}
              >
                Complete Profile Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const selectedTeam = TEAM_COLORS.find(team => team.value === profile.team_color)

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-wrapper">
        <div className="profile-setup-card">
          <div className="profile-setup-content">
            {/* Header */}
            <div className="profile-setup-header">
              <h1 className="profile-setup-title">
                {isEditing ? 'Edit Profile' : 'Your Profile'}
                {isPaid && (
                  <span className="pro-badge" style={{ marginLeft: '1rem', fontSize: '0.75rem' }}>
                    PRO
                  </span>
                )}
              </h1>
              <p className="profile-setup-subtitle">
                {isEditing ? 'Update your Pokémon GO profile information' : 'Your complete Pokémon GO trainer profile'}
              </p>
            </div>

            {/* Messages */}
            {error && (
              <div className="error-message">
                <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="upload-success" style={{ marginBottom: '2rem' }}>
                <div className="upload-success-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '100%', height: '100%'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="upload-filename">{success}</span>
              </div>
            )}

            {/* Account Information */}
            <div className="form-section">
              <h3 className="form-section-header">
                <span className="form-section-icon" style={{background: '#dc2626'}}>
                  🔐
                </span>
                Account Information
              </h3>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="form-input" style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: '#888' }}>
                    {user?.email}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Account Type</label>
                  <div className="form-input" style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: isPaid ? '#00d4aa' : '#888' }}>
                    {isPaid ? 'Paid' : 'Free'}
                  </div>
                </div>
              </div>
            </div>

            {/* Trainer Information */}
            <div className="form-section">
              <h3 className="form-section-header">
                <span className="form-section-icon" style={{background: '#dc2626'}}>
                  👤
                </span>
                Trainer Information
              </h3>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Trainer Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData?.trainer_name || ''}
                      onChange={(e) => handleInputChange('trainer_name', e.target.value)}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-input" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                      {profile.trainer_name}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Trainer Level</label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={editData?.trainer_level || 1}
                      onChange={(e) => handleInputChange('trainer_level', parseInt(e.target.value))}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-input" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                      Level {profile.trainer_level}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group" style={{marginTop: '1rem'}}>
                <label className="form-label">Trainer Code</label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editData?.trainer_code || ''}
                      onChange={(e) => handleInputChange('trainer_code', e.target.value)}
                      className="form-input"
                      placeholder="1234 5678 9012"
                    />
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="trainer_code_private_edit"
                        checked={editData?.trainer_code_private || false}
                        onChange={(e) => handleInputChange('trainer_code_private', e.target.checked)}
                        className="checkbox-input"
                      />
                      <label htmlFor="trainer_code_private_edit" className="checkbox-label">
                        Keep trainer code private
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="form-input" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    {profile.trainer_code_private ? '******* (Private)' : profile.trainer_code}
                  </div>
                )}
              </div>

              <div className="form-grid form-grid-2" style={{marginTop: '1rem'}}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData?.start_date || ''}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      className="form-input"
                    />
                  ) : (
                    <div className="form-input" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                      {profile.start_date ? new Date(profile.start_date).toLocaleDateString() : 'Not set'}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  {isEditing ? (
                    <select
                      value={editData?.country || ''}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select your country</option>
                      {COUNTRIES.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="form-input" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                      {profile.country || 'Not set'}
                    </div>
                  )}
                </div>
              </div>

              {/* Team Affiliation */}
              <div style={{marginTop: '1.5rem'}}>
                <label className="form-label">Team Affiliation</label>
                {isEditing ? (
                  <div className="team-grid">
                    {TEAM_COLORS.map(team => (
                      <button
                        key={team.value}
                        type="button"
                        onClick={() => handleInputChange('team_color', team.value)}
                        className={`team-button ${editData?.team_color === team.value ? 'selected' : ''}`}
                      >
                        <div 
                          className="team-color-dot"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="team-label">{team.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="team-grid">
                    <div className={`team-button selected`} style={{ cursor: 'default' }}>
                      <div 
                        className="team-color-dot"
                        style={{ backgroundColor: selectedTeam?.color || '#666' }}
                      />
                      <span className="team-label">{selectedTeam?.label || 'Unknown'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Core Statistics */}
            <div className="form-section">
              <h3 className="form-section-header">
                <span className="form-section-icon" style={{background: '#2563eb'}}>
                  📊
                </span>
                Core Statistics
              </h3>
              <div className="stat-cards">
                {[
                  { key: 'distance_walked', label: 'Distance Walked', icon: '🚶', unit: 'km' },
                  { key: 'pokemon_caught', label: 'Pokémon Caught', icon: '⚡' },
                  { key: 'pokestops_visited', label: 'PokéStops Visited', icon: '📍' },
                  { key: 'total_xp', label: 'Total XP', icon: '🎯' },
                  { key: 'unique_pokedex_entries', label: 'Pokédex Entries', icon: '📖' }
                ].map((stat) => (
                  <div key={stat.key} className={`stat-card ${stat.key === 'unique_pokedex_entries' ? 'full-width' : ''}`}>
                    <div className="stat-icon">
                      <span>{stat.icon}</span>
                    </div>
                    <div className="stat-content">
                      <label className="form-label">{stat.label}</label>
                      {isEditing ? (
                        <div className="stat-input-group">
                          <input
                            type="number"
                            min="0"
                            step={stat.key === 'distance_walked' ? '0.1' : '1'}
                            value={editData?.[stat.key as keyof ProfileData] as number || 0}
                            onChange={(e) => handleInputChange(stat.key as keyof ProfileData, 
                              stat.key === 'distance_walked' ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
                            className="form-input"
                          />
                          {stat.unit && (
                            <div className="stat-unit">{stat.unit}</div>
                          )}
                        </div>
                      ) : (
                        <div className="form-input" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                          {(profile[stat.key as keyof ProfileData] as number || 0).toLocaleString()}
                          {stat.unit && ` ${stat.unit}`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Screenshot */}
            <div className="form-section">
              <h3 className="form-section-header">
                <span className="form-section-icon" style={{background: '#7c3aed'}}>
                  📸
                </span>
                Profile Screenshot
              </h3>
              
              {profile.profile_screenshot_url && !isEditing && (
                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                  <img 
                    src={profile.profile_screenshot_url} 
                    alt="Profile Screenshot" 
                    style={{ 
                      maxWidth: '300px', 
                      maxHeight: '400px', 
                      borderRadius: '0.75rem',
                      border: '2px solid rgba(139, 0, 0, 0.4)'
                    }} 
                  />
                </div>
              )}

              {isEditing && (
                <div className="upload-area">
                  <input
                    id="newProfileScreenshot"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{display: 'none'}}
                  />
                  <label htmlFor="newProfileScreenshot" style={{display: 'block', cursor: 'pointer'}}>
                    <div className="upload-icon-container">
                      <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="upload-title">Upload new screenshot (optional)</h3>
                    <p className="upload-description">
                      {profile.profile_screenshot_url ? 'Upload a new screenshot to replace the current one' : 'Upload a screenshot of your trainer profile'}
                    </p>
                  </label>
                </div>
              )}
              
              {newScreenshot && (
                <div className="upload-success">
                  <div className="upload-success-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '100%', height: '100%'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="upload-filename">{newScreenshot.name}</span>
                </div>
              )}
              
              {!profile.profile_screenshot_url && !isEditing && (
                <div className="info-box blue">
                  <div className="info-icon">📸</div>
                  <div className="info-content">
                    <p>No profile screenshot uploaded. Click "Edit Profile" to add one.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Social Media */}
            <div className="form-section">
              <h3 className="form-section-header">
                <span className="form-section-icon" style={{background: '#f59e0b'}}>
                  🌐
                </span>
                Social Media
              </h3>
              <div className="social-grid">
                {[
                  { key: 'instagram', label: 'Instagram', icon: '📷', color: 'linear-gradient(135deg, #e91e63, #9c27b0)', placeholder: '@username' },
                  { key: 'tiktok', label: 'TikTok', icon: '🎵', color: 'linear-gradient(135deg, #111827, #1f2937)', placeholder: '@username' },
                  { key: 'twitter', label: 'X / Twitter', icon: '🐦', color: 'linear-gradient(135deg, #3b82f6, #2563eb)', placeholder: '@username' },
                  { key: 'youtube', label: 'YouTube', icon: '📺', color: 'linear-gradient(135deg, #dc2626, #b91c1c)', placeholder: 'Channel URL or @username' },
                  { key: 'twitch', label: 'Twitch', icon: '🎮', color: 'linear-gradient(135deg, #7c3aed, #6d28d9)', placeholder: 'username' },
                  { key: 'reddit', label: 'Reddit', icon: '🤖', color: 'linear-gradient(135deg, #f97316, #ea580c)', placeholder: 'u/username' }
                ].map((social) => (
                  <div key={social.key} className="social-card">
                    <div className="social-icon" style={{background: social.color}}>
                      <span>{social.icon}</span>
                    </div>
                    <div className="social-content">
                      <label className="form-label">{social.label}</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData?.[social.key as keyof ProfileData] as string || ''}
                          onChange={(e) => handleInputChange(social.key as keyof ProfileData, e.target.value)}
                          className="form-input"
                          placeholder={social.placeholder}
                        />
                      ) : (
                        <div className="form-input" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                          {profile[social.key as keyof ProfileData] as string || 'Not set'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trial Status (if applicable) */}
            {!isPaid && (
              <div className="form-section">
                <h3 className="form-section-header">
                  <span className="form-section-icon" style={{background: '#10b981'}}>
                    ⭐
                  </span>
                  Trial Status
                </h3>
                
                {inTrial ? (
                  <div className="info-box blue">
                    <div className="info-icon">⏰</div>
                    <div className="info-content">
                      <h4>Free Trial Active</h4>
                      <p>Your trial ends in <strong>{daysLeft} days</strong>. Upgrade to continue accessing premium features.</p>
                      <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="nav-button primary"
                        style={{ marginTop: '1rem' }}
                      >
                        {loading ? 'Processing...' : 'Upgrade Now'}
                      </button>
                    </div>
                  </div>
                ) : userMetadata?.trial_enabled ? (
                  <div className="info-box red">
                    <div className="info-icon">⚠️</div>
                    <div className="info-content">
                      <h4>Trial Expired</h4>
                      <p>Your free trial has expired. Upgrade to access premium features.</p>
                      <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="nav-button primary"
                        style={{ marginTop: '1rem' }}
                      >
                        {loading ? 'Processing...' : 'Upgrade Now'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="info-box blue">
                    <div className="info-icon">🎁</div>
                    <div className="info-content">
                      <h4>Start Your Free Trial</h4>
                      <p>You haven't started your 30-day free trial yet. Try all premium features for free!</p>
                      <button
                        onClick={handleStartTrial}
                        disabled={loading}
                        className="nav-button primary"
                        style={{ marginTop: '1rem' }}
                      >
                        {loading ? 'Starting...' : 'Start Free Trial'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="navigation">
              <button
                onClick={handleSignOut}
                disabled={loading || saving}
                className="nav-button secondary"
              >
                Sign Out
              </button>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="nav-button secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="nav-button primary"
                    >
                      {saving ? (
                        <>
                          <div className="loading-spinner"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          Save Changes
                          <svg className="nav-button-icon right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    disabled={loading}
                    className="nav-button primary"
                  >
                    Edit Profile
                    <svg className="nav-button-icon right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 