import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { profileService, type ProfileData, type ProfileWithMetadata } from '../../services/profileService'
import { useValuePropModal } from '../../hooks/useValuePropModal'
import { ValuePropModal } from '../upgrade/ValuePropModal'
import { GrindChart } from '../dashboard/GrindChart'
import { SOCIAL_MEDIA } from '../common/SocialIcons'
import './UserProfile.css'

const TEAM_COLORS = [
  { value: 'blue', label: 'Blue', color: '#0074D9' },
  { value: 'red', label: 'Red', color: '#FF4136' },
  { value: 'yellow', label: 'Yellow', color: '#FFDC00' },
  { value: 'black', label: 'Black', color: '#111111' },
  { value: 'green', label: 'Green', color: '#2ECC40' },
  { value: 'orange', label: 'Orange', color: '#FF851B' },
  { value: 'purple', label: 'Purple', color: '#B10DC9' },
  { value: 'pink', label: 'Pink', color: '#F012BE' }
]

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 
  'Japan', 'South Korea', 'Brazil', 'Mexico', 'Italy', 'Spain', 'Netherlands',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Other'
]

export const UserProfile = () => {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<ProfileWithMetadata | null>(null)
  const [editData, setEditData] = useState<ProfileData | null>(null)
  const [newScreenshot, setNewScreenshot] = useState<File | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isOpen, showValueProp, closeValueProp, daysRemaining } = useValuePropModal()
  const [daysUntilNameChange, setDaysUntilNameChange] = useState<number | null>(null);

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    // Enter edit mode if edit=true is in the URL
    if (searchParams.get('edit') === 'true') {
      setIsEditing(true)
    }
  }, [searchParams])

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
        // Calculate days until name change is allowed
        if (data.last_name_change_date) {
          const lastChange = new Date(data.last_name_change_date);
          const daysSinceChange = Math.floor((Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
          const daysRemaining = Math.max(30 - daysSinceChange, 0);
          setDaysUntilNameChange(daysRemaining);
        } else {
          setDaysUntilNameChange(0);
        }
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
    if (!editData || !profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let updatedData = { ...editData };

      // Check if trainer name or country is being changed
      const isNameChanged = profile.trainer_name !== editData.trainer_name;
      const isCountryChanged = profile.country !== editData.country;

      if ((isNameChanged || isCountryChanged) && daysUntilNameChange && daysUntilNameChange > 0) {
        setError(`Trainer name and country can only be changed once every 30 days. Days remaining: ${daysUntilNameChange}`);
        setSaving(false);
        return;
      }

      // If only trainer name or country is changed, update last_name_change_date
      if (isNameChanged || isCountryChanged) {
        updatedData.last_name_change_date = new Date().toISOString();
      }

      // Ensure trainer code privacy is properly set
      updatedData.trainer_code_private = editData.trainer_code_private || false;

      // Upload new screenshot if provided
      if (newScreenshot) {
        const { data: uploadData, error: uploadError } = await profileService.uploadProfileScreenshot(newScreenshot);
        if (uploadError) {
          throw new Error('Failed to upload screenshot: ' + uploadError.message);
        }
        updatedData.profile_screenshot_url = uploadData || '';
      }

      // Update profile in database
      const { data, error } = await profileService.updateProfile(updatedData);
      
      if (error) {
        throw new Error('Failed to update profile: ' + error.message);
      }

      setProfile(data);
      setEditData(data);
      setIsEditing(false);
      setNewScreenshot(null);
      setSuccess('Profile updated successfully!');
      
      // Navigate to home page after successful save
      navigate('/UserProfile');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  const isPaid = profile?.is_paid_user === true

  const renderSocialSection = () => {
    if (!profile) return null;

    const showPrivateNotice = !isPaid;

    const handleSocialUpgrade = () => {
      showValueProp('social');
    };

    return (
      <div className="form-section">
        <h3 className="form-section-header">
          <span className="form-section-icon" style={{background: '#2563eb'}}>
          </span>
          Social Media Links
          {showPrivateNotice && (
            <span className="private-badge">Private</span>
          )}
        </h3>
        
        {showPrivateNotice && isEditing && (
          <div className="premium-upgrade-notice">
            <div className="premium-upgrade-content">
              <div className="premium-upgrade-icon">
                <span>✨</span>
              </div>
              <div className="premium-upgrade-text">
                <h4>Unlock Social Media Features</h4>
                <p>Upgrade to edit and share your social media profiles with the Pokémon GO community</p>
              </div>
            </div>
            <button onClick={handleSocialUpgrade} className="premium-upgrade-button">
              <span>Upgrade to Premium</span>
              <svg className="arrow-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="form-grid form-grid-2">
          {SOCIAL_MEDIA.map(platform => (
            <div key={platform.key} className="form-group">
              <label className="form-label">
                {platform.label}
              </label>
              {isEditing ? (
                <div className="input-group-with-notice">
                  <input
                    type="text"
                    value={editData?.[platform.key as keyof ProfileData] as string || ''}
                    onChange={(e) => handleInputChange(platform.key as keyof ProfileData, e.target.value)}
                    className={`form-input ${!isPaid ? 'disabled' : ''}`}
                    placeholder={platform.placeholder}
                    disabled={!isPaid}
                  />
                  {!isPaid && (
                    <div className="private-notice-inline">
                      Private field
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-input" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  {profile[platform.key as keyof ProfileData] || 'Not set'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTrainerCodeSection = () => {
    if (!profile) return null;

    return (
      <div className="form-group" style={{marginTop: '1rem'}}>
        <label className="form-label">
          Trainer Code
        </label>
        {isEditing ? (
          <div className="input-group-with-notice">
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
          </div>
        ) : (
          <div className="form-input" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            {profile.trainer_code_private ? (
              <span className="private-text">
                <span className="private-icon">🔒</span> Hidden
              </span>
            ) : (
              profile.trainer_code || 'Not set'
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTrainerInfoSection = () => {
    if (!profile) return null;

    const isNameChangeDisabled = daysUntilNameChange !== null && daysUntilNameChange > 0;
    const nameChangeTooltip = isNameChangeDisabled 
      ? `Changes allowed in ${daysUntilNameChange} days` 
      : '';

    return (
      <div className="form-section">
        <h3 className="form-section-header">
          <span className="form-section-icon" style={{background: '#dc2626'}}>
            👤
          </span>
          Trainer Information
        </h3>
        <div className="form-grid form-grid-2">
          <div className="form-group">
            <label className="form-label">
              Trainer Name
              {isNameChangeDisabled && isEditing && (
                <span className="help-text" style={{color: '#666'}}>
                  ({nameChangeTooltip})
                </span>
              )}
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editData?.trainer_name || ''}
                onChange={(e) => handleInputChange('trainer_name', e.target.value)}
                className={`form-input ${isNameChangeDisabled ? 'disabled' : ''}`}
                disabled={isNameChangeDisabled}
                title={nameChangeTooltip}
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

        {renderTrainerCodeSection()}

        <div className="form-group" style={{marginTop: '1rem'}}>
          <label className="form-label">
            Country
            {isNameChangeDisabled && isEditing && (
              <span className="help-text" style={{color: '#666'}}>
                ({nameChangeTooltip})
              </span>
            )}
          </label>
          {isEditing ? (
            <select
              value={editData?.country || ''}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className={`form-input ${isNameChangeDisabled ? 'disabled' : ''}`}
              disabled={isNameChangeDisabled}
              title={nameChangeTooltip}
            >
              <option value="">Select a country</option>
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
    );
  };

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
      <ValuePropModal 
        isOpen={isOpen} 
        onClose={closeValueProp} 
        daysRemaining={daysRemaining} 
      />
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
            {renderTrainerInfoSection()}

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
                  <div key={stat.key} className="stat-card">
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
                <span className="form-section-icon" style={{background: '#dc2626'}}>
                  📸
                </span>
                Profile Screenshot
              </h3>
              
              {profile.profile_screenshot_url && (
                <div className="screenshot-container">
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

            {/* Grind Progress Chart */}
            <div className="form-section">
              <GrindChart />
            </div>

            {/* Social Media */}
            {renderSocialSection()}

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