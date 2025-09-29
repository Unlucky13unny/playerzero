import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { profileService, type ProfileData } from '../../services/profileService'
import { adminService } from '../../services/adminService'
import { Logo } from '../common/Logo'
import { Upload } from 'lucide-react'
import './ProfileSetup.css'

const TEAM_COLORS = [
  { value: 'mystic', label: 'Team Mystic', color: '#0074D9' },
  { value: 'valor', label: 'Team Valor', color: '#FF4136' },
  { value: 'instinct', label: 'Team Instinct', color: '#FFDC00' },
]

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 
  'Japan', 'South Korea', 'Brazil', 'Mexico', 'Italy', 'Spain', 'Netherlands',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Pakistan', 'India', 'Other'
]

export const ProfileSetup = () => {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [maxPokedexEntries, setMaxPokedexEntries] = useState(1000)
  
  const [profileData, setProfileData] = useState<ProfileData>({
    trainer_name: '',
    trainer_code: '',
    trainer_code_private: false,
    trainer_level: 1,
    start_date: '',
    country: '',
    team_color: '',
    average_daily_xp: 0,
    distance_walked: undefined,
    pokemon_caught: undefined,
    pokestops_visited: undefined,
    total_xp: undefined,
    unique_pokedex_entries: undefined,
    profile_screenshot_url: '',
    instagram: '',
    tiktok: '',
    twitter: '',
    youtube: '',
    twitch: '',
    reddit: '',
    social_links_private: false
  })

  const [profileScreenshot, setProfileScreenshot] = useState<File | null>(null)

  // Check if user already has a profile when component mounts
  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const { hasProfile, error } = await profileService.hasProfile()
        
        if (error) {
          console.warn('Error checking existing profile:', error)
        }
        
        // If user already has a profile, redirect to dashboard
        if (hasProfile) {
          navigate('/', { replace: true })
          return
        }
      } catch (err) {
        console.warn('Error checking profile existence:', err)
      } finally {
        setCheckingProfile(false)
      }
    }

    checkExistingProfile()
  }, [navigate])

  // Fetch max Pokédex entries on mount
  useEffect(() => {
    const fetchMaxEntries = async () => {
      const { value, error } = await adminService.getMaxPokedexEntries();
      if (!error) {
        setMaxPokedexEntries(value);
      }
    };
    fetchMaxEntries();
  }, []);

  // Set email from user
  useEffect(() => {
    if (user?.email) {
      setProfileData(prev => ({ ...prev, email: user.email }))
    }
  }, [user])

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    // Special handling for trainer_code to enforce 12-digit limit
    if (field === 'trainer_code') {
      // Remove any non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      
      // Limit to 12 digits maximum
      const limitedValue = digitsOnly.slice(0, 12);
      
      setProfileData(prev => ({ ...prev, [field]: limitedValue }))
    } else {
      setProfileData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setProfileScreenshot(file)
  }

  const handleStatChange = (key: keyof ProfileData, value: string) => {
    // Handle empty value
    if (!value.trim()) {
      setProfileData(prev => ({ ...prev, [key]: undefined }));
      return;
    }

    // Remove leading zeros
    const cleanValue = value.replace(/^0+/, '');
    
    // Convert to appropriate type
    let parsedValue: number | undefined;
    if (key === 'distance_walked') {
      // Allow decimal for distance
      parsedValue = cleanValue ? parseFloat(cleanValue) : undefined;
    } else {
      // Integer for other stats
      parsedValue = cleanValue ? parseInt(cleanValue) : undefined;
    }

    // Validate value
    if (parsedValue !== undefined) {
      if (key === 'unique_pokedex_entries' && parsedValue > maxPokedexEntries) {
        return; // Don't update if exceeds max
      }
      if (parsedValue < 0) {
        return; // Don't update if negative
      }
    }

    setProfileData(prev => ({ ...prev, [key]: parsedValue }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(profileData.trainer_name && profileData.trainer_code && 
                 profileData.trainer_level && profileData.country && profileData.team_color)
      case 2:
        return true // All stats are optional
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2) {
        handleSubmit()
      } else {
        setCurrentStep(prev => prev + 1)
        setError(null)
      }
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
          throw new Error(uploadError.message || 'Failed to upload screenshot')
        }
        
        screenshotUrl = uploadData?.publicUrl || ''
      }
      
      // Create profile
      const profileToSubmit = {
        ...profileData,
        profile_screenshot_url: screenshotUrl
      }
      
      const { error: createError } = await profileService.createProfile(profileToSubmit)
      
      if (createError) {
        throw new Error(createError.message || 'Failed to create profile')
      }
      
      // Update auth context
      await updateProfile()
      
      // Navigate to dashboard after successful profile completion
      navigate('/UserProfile')
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const renderProfileStep = () => (
    <div className="profile-setup-form">
      <div className="form-field">
        <label className="form-label">Email Address</label>
        <input
          type="email"
          value={user?.email || 'name.surname@example.com'}
          className="form-input"
          disabled
          style={{ backgroundColor: '#f9fafb' }}
        />
      </div>

      <div className="form-field">
        <label className="form-label">Trainer Name</label>
        <input
          type="text"
          value={profileData.trainer_name}
          onChange={(e) => handleInputChange('trainer_name', e.target.value)}
          className="form-input"
          placeholder="plyrzero"
          required
        />
      </div>

      <div className="form-field">
        <label className="form-label">Trainer Level</label>
        <input
          type="number"
          min="1"
          max="50"
          value={profileData.trainer_level}
          onChange={(e) => handleInputChange('trainer_level', parseInt(e.target.value))}
          className="form-input"
          placeholder="50"
        />
      </div>

      <div className="form-field">
        <label className="form-label">Trainer Code</label>
        <input
          type="text"
          value={profileData.trainer_code}
          onChange={(e) => handleInputChange('trainer_code', e.target.value)}
          className="form-input"
          placeholder="512348894"
          maxLength={12}
        />
        <div className="toggle-field">
          <span>Upgrade to unlock sharing your code</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={!profileData.trainer_code_private}
              onChange={(e) => handleInputChange('trainer_code_private', !e.target.checked)}
              disabled
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Country</label>
        <select
          value={profileData.country}
          onChange={(e) => handleInputChange('country', e.target.value)}
          className="form-select"
        >
          <option value="">Choose your country</option>
          {COUNTRIES.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label className="form-label">Team Affiliation</label>
        <select
          value={profileData.team_color}
          onChange={(e) => handleInputChange('team_color', e.target.value)}
          className="form-select"
        >
          <option value="">Choose your team</option>
          {TEAM_COLORS.map(team => (
            <option key={team.value} value={team.value}>{team.label}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label className="form-label">
          <span className="social-icon">🔗</span>
          Social Platforms
        </label>
        <button className="social-connect-btn">
          + Connect New Social Platform
        </button>
        <div className="toggle-field">
          <span>Upgrade to unlock sharing your code</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={!profileData.social_links_private}
              onChange={(e) => handleInputChange('social_links_private', !e.target.checked)}
              disabled
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  )

  const renderStatsStep = () => (
    <div className="profile-setup-form">
      <div className="form-field">
        <label className="form-label">Distance Walked</label>
        <div className="input-with-unit">
          <input
            type="number"
            value={profileData.distance_walked || ''}
            onChange={(e) => handleStatChange('distance_walked', e.target.value)}
            className="form-input"
            placeholder="0"
            min="0"
          />
          <span className="input-unit">km</span>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Pokémon Caught</label>
        <input
          type="number"
          value={profileData.pokemon_caught || ''}
          onChange={(e) => handleStatChange('pokemon_caught', e.target.value)}
          className="form-input"
          placeholder="0"
          min="0"
        />
      </div>

      <div className="form-field">
        <label className="form-label">Pokéstops Visited</label>
        <input
          type="number"
          value={profileData.pokestops_visited || ''}
          onChange={(e) => handleStatChange('pokestops_visited', e.target.value)}
          className="form-input"
          placeholder="0"
          min="0"
        />
      </div>

      <div className="form-field">
        <label className="form-label">Total XP</label>
        <input
          type="number"
          value={profileData.total_xp || ''}
          onChange={(e) => handleStatChange('total_xp', e.target.value)}
          className="form-input"
          placeholder="0"
          min="0"
        />
      </div>

      <div className="stats-section">
        <h3 className="section-title">Secondary Stats</h3>
        <div className="form-field">
          <label className="form-label">Pokédex Entries</label>
          <input
            type="number"
            value={profileData.unique_pokedex_entries || ''}
            onChange={(e) => handleStatChange('unique_pokedex_entries', e.target.value)}
            className="form-input"
            placeholder="0"
            min="0"
            max={maxPokedexEntries}
          />
        </div>
      </div>

      <div className="upload-section">
        <label className="form-label">Upload a screenshot of your Trainer Profile to verify your stats.</label>
        <div className="upload-area">
          <input
            type="file"
            id="screenshot-upload"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="screenshot-upload" className="upload-label">
            <Upload size={20} />
            <span>Choose file</span>
            <span className="file-hint">No file chosen</span>
          </label>
        </div>
        {profileScreenshot && (
          <div className="file-selected">
            <span>{profileScreenshot.name}</span>
          </div>
        )}
      </div>
    </div>
  )

  // Show loading while checking if profile already exists
  if (checkingProfile) {
    return (
      <div className="split-layout">
        <div className="split-layout-left">
          <div className="auth-container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Checking profile status...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="split-layout">
      <div className="split-layout-left">
        <div className="auth-container profile-setup-container">
          <div className="logo-section">
            <Logo className="auth-logo" />
          </div>

          <div className="setup-header">
            <h1>{currentStep === 1 ? 'Set up your profile!' : 'Set up your stats'}</h1>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {currentStep === 1 ? renderProfileStep() : renderStatsStep()}

          <div className="setup-actions">
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-secondary btn-back"
              disabled={currentStep === 1}
            >
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary btn-next"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">
                  <svg className="spinner" viewBox="0 0 24 24">
                    <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" />
                    <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : 'Next'}
            </button>
          </div>
        </div>
      </div>

      <div className="split-layout-right">
        <div className="welcome-message">
          <h1>Grind.</h1>
          <h1>Compete.</h1>
          <h1>Flex.</h1>
        </div>
      </div>
    </div>
  )
}
