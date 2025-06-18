import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { profileService, type ProfileData } from '../../services/profileService'

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

export const ProfileSetup = () => {
  const { updateProfile } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [profileData, setProfileData] = useState<ProfileData>({
    trainer_name: '',
    trainer_code: '',
    trainer_code_private: false,
    trainer_level: 1,
    start_date: '',
    country: '',
    team_color: '',
    distance_walked: 0,
    pokemon_caught: 0,
    pokestops_visited: 0,
    total_xp: 0,
    unique_pokedex_entries: 0,
    profile_screenshot_url: '',
    instagram: '',
    tiktok: '',
    twitter: '',
    youtube: '',
    twitch: '',
    reddit: ''
  })

  const [profileScreenshot, setProfileScreenshot] = useState<File | null>(null)

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setProfileScreenshot(file)
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(profileData.trainer_name && profileData.trainer_code && 
                 profileData.trainer_level && profileData.start_date && 
                 profileData.country && profileData.team_color)
      case 2:
        return !!(profileData.distance_walked >= 0 && profileData.pokemon_caught >= 0 && 
                 profileData.pokestops_visited >= 0 && profileData.total_xp >= 0 && 
                 profileData.unique_pokedex_entries >= 0)
      case 3:
        return true // Screenshot is optional
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
      setError(null)
    } else {
      setError('Please fill in all required fields')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let screenshotUrl = ''
      
      // Upload screenshot if provided
      if (profileScreenshot) {
        const { data: uploadData, error: uploadError } = await profileService.uploadProfileScreenshot(profileScreenshot)
        if (uploadError) {
          throw new Error('Failed to upload screenshot: ' + uploadError.message)
        }
        screenshotUrl = uploadData || ''
      }
      
      // Prepare profile data for database
      const profileDataToSave = {
        ...profileData,
        profile_screenshot_url: screenshotUrl
      }
      
      // Save to database
      const { data, error: dbError } = await profileService.upsertProfile(profileDataToSave)
      
      if (dbError) {
        throw new Error('Failed to save profile: ' + dbError.message)
      }
      
      // Update user metadata to mark profile as complete
      const { error: metadataError } = await updateProfile({
        profile_complete: true,
        trainer_name: profileData.trainer_name,
        trainer_level: profileData.trainer_level,
        team_color: profileData.team_color,
        country: profileData.country
      })
      
      if (metadataError) {
        throw new Error('Failed to update profile status: ' + metadataError.message)
      }
      
      // Navigate to tutorial after successful profile completion
      navigate('/tutorial')
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="step-content">
      <div>
        <h2 className="step-title">Pokémon GO Profile Setup</h2>
        <p className="step-description">Let's start by setting up your basic trainer information</p>
      </div>
      
      <div>
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
              <input
                type="text"
                value={profileData.trainer_name}
                onChange={(e) => handleInputChange('trainer_name', e.target.value)}
                className="form-input"
                placeholder="Enter your trainer name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Trainer Level</label>
              <input
                type="number"
                min="1"
                max="50"
                value={profileData.trainer_level}
                onChange={(e) => handleInputChange('trainer_level', parseInt(e.target.value))}
                className="form-input"
              />
            </div>
          </div>
          
          <div className="form-group" style={{marginTop: '1rem'}}>
            <label className="form-label">Trainer Code</label>
            <input
              type="text"
              value={profileData.trainer_code}
              onChange={(e) => handleInputChange('trainer_code', e.target.value)}
              className="form-input"
              placeholder="1234 5678 9012"
            />
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="trainer_code_private"
                checked={profileData.trainer_code_private}
                onChange={(e) => handleInputChange('trainer_code_private', e.target.checked)}
                className="checkbox-input"
              />
              <label htmlFor="trainer_code_private" className="checkbox-label">
                Keep trainer code private
              </label>
            </div>
          </div>
        </div>

        {/* Location & Timeline */}
        <div className="form-section">
          <h3 className="form-section-header">
            <span className="form-section-icon" style={{background: '#2563eb'}}>
              🌍
            </span>
            Location & Timeline
          </h3>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                value={profileData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <select
                value={profileData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="form-select"
              >
                <option value="">Select your country</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Team Affiliation */}
        <div className="form-section">
          <h3 className="form-section-header">
            <span className="form-section-icon" style={{background: '#7c3aed'}}>
              ⚡
            </span>
            Team Affiliation
          </h3>
          <div className="team-grid">
            {TEAM_COLORS.map(team => (
              <button
                key={team.value}
                type="button"
                onClick={() => handleInputChange('team_color', team.value)}
                className={`team-button ${profileData.team_color === team.value ? 'selected' : ''}`}
              >
                <div 
                  className="team-color-dot"
                  style={{ backgroundColor: team.color }}
                />
                <span className="team-label">{team.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="step-content">
      <div>
        <h2 className="step-title">Core Statistics</h2>
        <p className="step-description">Enter your current Pokémon GO game statistics</p>
      </div>
      
      <div className="stat-cards">
        {[
          { key: 'distance_walked', label: 'Distance Walked', icon: '🚶', unit: 'km' },
          { key: 'pokemon_caught', label: 'Pokémon Caught', icon: '⚡' },
          { key: 'pokestops_visited', label: 'PokéStops Visited', icon: '📍' },
          { key: 'total_xp', label: 'Total XP', icon: '🎯' },
          { key: 'unique_pokedex_entries', label: 'Pokédex Entries', icon: '📖', max: 1000 }
        ].map((stat) => (
          <div key={stat.key} className={`stat-card ${stat.key === 'unique_pokedex_entries' ? 'full-width' : ''}`}>
            <div className="stat-icon">
              <span>{stat.icon}</span>
            </div>
            <div className="stat-content">
              <label className="form-label">{stat.label}</label>
              <div className="stat-input-group">
                <input
                  type="number"
                  min="0"
                  max={stat.max}
                  step={stat.key === 'distance_walked' ? '0.1' : '1'}
                  value={profileData[stat.key as keyof ProfileData] as number}
                  onChange={(e) => handleInputChange(stat.key as keyof ProfileData, 
                    stat.key === 'distance_walked' ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
                  className="form-input"
                />
                {stat.unit && (
                  <div className="stat-unit">{stat.unit}</div>
                )}
              </div>
              {stat.max && (
                <p className="stat-help">Maximum {stat.max} entries</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="step-content">
      <div>
        <h2 className="step-title">Profile Verification (Optional)</h2>
        <p className="step-description">Upload your trainer profile screenshot for account verification (optional)</p>
      </div>
      
      <div className="form-section">
        <div className="upload-area">
          <input
            id="profileScreenshot"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{display: 'none'}}
          />
          <label htmlFor="profileScreenshot" style={{display: 'block', cursor: 'pointer'}}>
            <div className="upload-icon-container">
              <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="upload-title">Click to upload screenshot (optional)</h3>
            <p className="upload-description">
              Upload a screenshot of your Pokémon GO trainer profile to verify your account. This step is optional but recommended for building trust within the community.
            </p>
          </label>
        </div>
        
        {profileScreenshot && (
          <div className="upload-success">
            <div className="upload-success-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '100%', height: '100%'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="upload-filename">{profileScreenshot.name}</span>
          </div>
        )}
      </div>
      
      <div className="info-box blue">
        <div className="info-icon">🔒</div>
        <div className="info-content">
          <h4>Why do we recommend this?</h4>
          <p>
            Your profile screenshot helps us verify your account and build trust within the community. 
            This image is used for moderation purposes and future verification if needed. You can always add this later in your profile settings.
          </p>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="step-content">
      <div>
        <h2 className="step-title">Social Media (Optional)</h2>
        <p className="step-description">Connect your social accounts to share with the community</p>
      </div>
      
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
              <input
                type="text"
                value={profileData[social.key as keyof ProfileData] as string || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, [social.key]: e.target.value }))}
                className="form-input"
                placeholder={social.placeholder}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="info-box red">
        <div className="info-icon">🔒</div>
        <div className="info-content">
          <p>
            <strong style={{color: '#f87171'}}>Privacy:</strong> Social media links are only visible to community members and help others connect with you.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-wrapper">
        <div className="profile-setup-card">
          <div className="profile-setup-content">
            {/* Header */}
            <div className="profile-setup-header">
              <h1 className="profile-setup-title">Complete Your Profile</h1>
              <p className="profile-setup-subtitle">Set up your Pokémon GO profile to join the PlayerZERO community</p>
            </div>
            
            {/* Step Indicator */}
            <div className="step-indicator">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="step-item">
                  <div className={`step-number ${
                    step < currentStep 
                      ? 'completed' 
                      : step === currentStep 
                        ? 'active' 
                        : 'inactive'
                  }`}>
                    {step < currentStep ? (
                      <svg style={{width: '1.25rem', height: '1.25rem'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{step}</span>
                    )}
                    
                    {step < 4 && (
                      <div className={`step-connector ${step < currentStep ? 'active' : 'inactive'}`} />
                    )}
                  </div>
                  <span className={`step-label ${step <= currentStep ? 'active' : 'inactive'}`}>
                    {step === 1 && 'Profile'}
                    {step === 2 && 'Stats'}
                    {step === 3 && 'Verify'}
                    {step === 4 && 'Social'}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="error-message">
                <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            {/* Step Content */}
            <div>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </div>
            
            {/* Navigation */}
            <div className="navigation">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="nav-button secondary"
                  disabled={loading}
                >
                  <svg className="nav-button-icon left" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
              ) : (
                <div></div>
              )}
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="nav-button primary"
                >
                  Next
                  <svg className="nav-button-icon right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="nav-button primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <svg className="nav-button-icon right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 