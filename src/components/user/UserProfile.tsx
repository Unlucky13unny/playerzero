import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { profileService, type ProfileData, type ProfileWithMetadata } from '../../services/profileService'
import { useValuePropModal } from '../../hooks/useValuePropModal'
import { ValuePropModal } from '../upgrade/ValuePropModal'
import { LogOut, Upload } from 'lucide-react'
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
  const [profile, setProfile] = useState<ProfileWithMetadata | null>(null)
  const [editData, setEditData] = useState<ProfileData | null>(null)
  const [newScreenshot, setNewScreenshot] = useState<File | null>(null)
  const navigate = useNavigate()
  const { isOpen, closeValueProp, daysRemaining } = useValuePropModal()
  const [daysUntilNameChange, setDaysUntilNameChange] = useState<number | null>(null);
  
  // New stats state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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
  

  const handleCancelEdit = () => {
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


  const handleStatsFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
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


  return (
    <div className="profile-settings-container">
      <ValuePropModal 
        isOpen={isOpen} 
        onClose={closeValueProp} 
        daysRemaining={daysRemaining} 
      />

            {/* Messages */}
            {error && (
        <div className="profile-error-message">
                <span>{error}</span>
              </div>
            )}

            {success && (
        <div className="profile-success-message">
          <span>{success}</span>
              </div>
            )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "13px",
          width: "838px",
          maxWidth: "100%",
          fontFamily: "Poppins, sans-serif",
          color: "#000000",
          margin: "0 auto",
        }}
      >
        {/* Profile Settings Header */}
        <h1
          style={{
            fontFamily: "Poppins",
            fontStyle: "normal",
            fontWeight: 600,
            fontSize: "24px",
            lineHeight: "36px",
            color: "#000000",
            width: "838px",
            textAlign: "center",
          }}
        >
          Profile Settings
        </h1>

        {/* Profile Form */}
        <form
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "13px",
            width: "838px",
          }}
        >
          {/* Basic Info Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "13px",
              width: "838px",
            }}
          >
            {/* Email Address */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
                width: "838px",
              }}
            >
              <label
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "11px",
                  lineHeight: "16px",
                  color: "#000000",
                  width: "838px",
                  textAlign: "left",
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "9px",
                  gap: "10px",
                  width: "838px",
                  height: "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "#000000",
                  boxSizing: "border-box",
                }}
              />
                </div>

            {/* Trainer Name */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
                width: "838px",
              }}
            >
              <label
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "11px",
                  lineHeight: "16px",
                  color: "#000000",
                  width: "838px",
                  textAlign: "left",
                }}
              >
                Trainer Name
              </label>
              <input
                type="text"
                value={editData?.trainer_name || ''}
                onChange={(e) => handleInputChange('trainer_name', e.target.value)}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "9px",
                  gap: "10px",
                  width: "838px",
                  height: "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "#000000",
                  boxSizing: "border-box",
                }}
              />
                  </div>

            {/* Trainer Level */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
                width: "838px",
              }}
            >
              <label
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "11px",
                  lineHeight: "16px",
                  color: "#000000",
                  width: "838px",
                  textAlign: "left",
                }}
              >
                Trainer Level
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={editData?.trainer_level || 1}
                onChange={(e) => handleInputChange('trainer_level', parseInt(e.target.value))}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "9px",
                  gap: "10px",
                  width: "838px",
                  height: "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "#000000",
                  boxSizing: "border-box",
                }}
              />
                </div>

            {/* Trainer Code with Toggle */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "4px",
                width: "838px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "2px",
                  width: "838px",
                }}
              >
                <label
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "11px",
                    lineHeight: "16px",
                    color: "#000000",
                    width: "838px",
                    textAlign: "left",
                  }}
                >
                  Trainer Code
                </label>
                <input
                  type="text"
                  value={editData?.trainer_code || ''}
                  onChange={(e) => handleInputChange('trainer_code', e.target.value)}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "9px",
                    gap: "10px",
                    width: "838px",
                    height: "36px",
                    background: "#FFFFFF",
                    border: "1px solid #848282",
                    borderRadius: "6px",
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "18px",
                    color: "#000000",
                    boxSizing: "border-box",
                  }}
                />
            </div>

              {/* Keep trainer code private toggle */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "838px",
                  height: "28px",
                }}
              >
                <span
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 500,
                    fontSize: "11px",
                    lineHeight: "16px",
                    color: "#000000",
                  }}
                >
                  Keep trainer code private
                </span>
                <button
                  type="button"
                  onClick={() => handleInputChange('trainer_code_private', !editData?.trainer_code_private)}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "2px",
                    width: "44px",
                    height: "24px",
                    background: editData?.trainer_code_private ? "#DC2627" : "#E5E7EB",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    justifyContent: editData?.trainer_code_private ? "flex-end" : "flex-start",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      background: "#FFFFFF",
                      borderRadius: "50%",
                    }}
                  />
                </button>
                        </div>
                        </div>
                    </div>

          {/* Location Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "13px",
              width: "838px",
            }}
          >
            {/* Country */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
                width: "838px",
              }}
            >
              <label
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "11px",
                  lineHeight: "16px",
                  color: "#000000",
                  width: "838px",
                  textAlign: "left",
                }}
              >
                Country
              </label>
              <select
                value={editData?.country || ''}
                onChange={(e) => handleInputChange('country', e.target.value)}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px",
                  gap: "10px",
                  width: "838px",
                  height: "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "#000000",
                }}
              >
                <option value="">Choose your country</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
                  </div>

            {/* Team Affiliation */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
                width: "838px",
              }}
            >
              <label
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "11px",
                  lineHeight: "16px",
                  color: "#000000",
                  width: "838px",
                  textAlign: "left",
                }}
              >
                Team Affiliation
              </label>
              <select
                value={editData?.team_color || ''}
                onChange={(e) => handleInputChange('team_color', e.target.value)}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px",
                  gap: "10px",
                  width: "838px",
                  height: "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "#000000",
                }}
              >
                <option value="">Choose your team</option>
                {TEAM_COLORS.map(team => (
                  <option key={team.value} value={team.value}>{team.label}</option>
                ))}
              </select>
              </div>

            {/* Core Stats Section */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "13px",
                width: "838px",
              }}
            >
              {/* Core Stats Header */}
              <h2
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 600,
                  fontSize: "24px",
                  lineHeight: "36px",
                  color: "#000000",
                  width: "838px",
                  textAlign: "center",
                }}
              >
                Core Stats
              </h2>

              {/* Distance Walked */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "2px",
                  width: "838px",
                }}
              >
                <label
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "11px",
                    lineHeight: "16px",
                    color: "#000000",
                    width: "838px",
                    textAlign: "left",
                  }}
                >
                  Distance Walked
                </label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    width: "838px",
                    gap: "8px",
                  }}
                >
                  <input
                    type="text"
                    value={editData?.distance_walked || 0}
                    onChange={(e) => handleInputChange('distance_walked', e.target.value)}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      padding: "9px",
                      gap: "10px",
                      flex: 1,
                      height: "36px",
                      background: "#FFFFFF",
                      border: "1px solid #848282",
                      borderRadius: "6px",
                      fontFamily: "Poppins",
                      fontStyle: "normal",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "18px",
                      color: "#000000",
                      boxSizing: "border-box",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "Poppins",
                      fontStyle: "normal",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "18px",
                      color: "#000000",
                    }}
                  >
                    km
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "11px",
                    lineHeight: "16px",
                    color: "#666666",
                  }}
                >
                  Last update: {profile?.distance_walked || 0}
                </span>
              </div>

              {/* Pokémon Caught */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "2px",
                  width: "838px",
                }}
              >
                <label
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "11px",
                    lineHeight: "16px",
                    color: "#000000",
                    width: "838px",
                    textAlign: "left",
                  }}
                >
                  Pokémon Caught
                </label>
                <input
                  type="text"
                  value={editData?.pokemon_caught || 0}
                  onChange={(e) => handleInputChange('pokemon_caught', e.target.value)}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "9px",
                    gap: "10px",
                    width: "838px",
                    height: "36px",
                    background: "#FFFFFF",
                    border: "1px solid #848282",
                    borderRadius: "6px",
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "18px",
                    color: "#000000",
                    boxSizing: "border-box",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "11px",
                    lineHeight: "16px",
                    color: "#666666",
                  }}
                >
                  Last update: {profile?.pokemon_caught || 0}
                </span>
              </div>

              {/* Pokéstops Visited */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "2px",
                  width: "838px",
                }}
              >
                <label
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "11px",
                    lineHeight: "16px",
                    color: "#000000",
                    width: "838px",
                    textAlign: "left",
                  }}
                >
                  Pokéstops Visited
                </label>
                <input
                  type="text"
                  value={editData?.pokestops_visited || 0}
                  onChange={(e) => handleInputChange('pokestops_visited', e.target.value)}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "9px",
                    gap: "10px",
                    width: "838px",
                    height: "36px",
                    background: "#FFFFFF",
                    border: "1px solid #848282",
                    borderRadius: "6px",
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "18px",
                    color: "#000000",
                    boxSizing: "border-box",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "11px",
                    lineHeight: "16px",
                    color: "#666666",
                  }}
                >
                  Last update: {profile?.pokestops_visited || 0}
                </span>
              </div>

              {/* Total XP */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "2px",
                  width: "838px",
                }}
              >
                <label
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "11px",
                    lineHeight: "16px",
                    color: "#000000",
                    width: "838px",
                    textAlign: "left",
                  }}
                >
                  Total XP
                </label>
                <input
                  type="text"
                  value={editData?.total_xp || 0}
                  onChange={(e) => handleInputChange('total_xp', e.target.value)}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "9px",
                    gap: "10px",
                    width: "838px",
                    height: "36px",
                    background: "#FFFFFF",
                    border: "1px solid #848282",
                    borderRadius: "6px",
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "18px",
                    color: "#000000",
                    boxSizing: "border-box",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "11px",
                    lineHeight: "16px",
                    color: "#666666",
                  }}
                >
                  Last update: {profile?.total_xp || 0}
                </span>
              </div>
            </div>

            {/* Secondary Stats Section */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "13px",
                width: "838px",
              }}
            >
              {/* Secondary Stats Header */}
              <h2
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 600,
                  fontSize: "24px",
                  lineHeight: "36px",
                  color: "#000000",
                  width: "838px",
                  textAlign: "left",
                }}
              >
                Secondary Stats
              </h2>

              {/* Pokédex Entries */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "2px",
                  width: "838px",
                }}
              >
                <label
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "11px",
                    lineHeight: "16px",
                    color: "#000000",
                    width: "838px",
                    textAlign: "left",
                  }}
                >
                  Pokédex Entries
                </label>
                <input
                  type="text"
                  value={editData?.unique_pokedex_entries || 0}
                  onChange={(e) => handleInputChange('unique_pokedex_entries', e.target.value)}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "9px",
                    gap: "10px",
                    width: "838px",
                    height: "36px",
                    background: "#FFFFFF",
                    border: "1px solid #848282",
                    borderRadius: "6px",
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "18px",
                    color: "#000000",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Upload new screenshot */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "2px",
                  width: "838px",
                }}
              >
                <label
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "11px",
                    lineHeight: "16px",
                    color: "#000000",
                    width: "838px",
                    textAlign: "left",
                  }}
                >
                  Upload new screenshot
                </label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    width: "838px",
                    height: "36px",
                    background: "#FFFFFF",
                    border: "1px dashed #848282",
                    borderRadius: "6px",
                    padding: "9px",
                    gap: "10px",
                    boxSizing: "border-box",
                  }}
                >
                  <input
                    type="file"
                    id="screenshot-upload"
                    onChange={handleStatsFileChange}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  <label
                    htmlFor="screenshot-upload"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <Upload style={{ width: "16px", height: "16px", color: "#000000" }} />
                    <span
                      style={{
                        fontFamily: "Poppins",
                        fontStyle: "normal",
                        fontWeight: 400,
                        fontSize: "12px",
                        lineHeight: "18px",
                        color: "#000000",
                      }}
                    >
                      Choose file
                    </span>
                  </label>
                  <span
                    style={{
                      fontFamily: "Poppins",
                      fontStyle: "normal",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "18px",
                      color: "#666666",
                      marginLeft: "auto",
                    }}
                  >
                    {selectedFile ? selectedFile.name : "No file chosen"}
                  </span>
                </div>
              </div>
            </div>
            </div>

          {/* Social Platforms Section */}
          <div
                    style={{ 
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "8px",
              width: "838px",
            }}
          >
            {/* Social Platforms Header */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "838px",
                height: "22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    //border: "1px solid #000000",
                    borderRadius: "4px",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.8 6.13333L9.2 3.86667M4.8 7.86667L9.2 10.1333M1 7C1 7.53043 1.21071 8.03914 1.58579 8.41421C1.96086 8.78929 2.46957 9 3 9C3.53043 9 4.03914 8.78929 4.41421 8.41421C4.78929 8.03914 5 7.53043 5 7C5 6.46957 4.78929 5.96086 4.41421 5.58579C4.03914 5.21071 3.53043 5 3 5C2.46957 5 1.96086 5.21071 1.58579 5.58579C1.21071 5.96086 1 6.46957 1 7ZM9 3C9 3.53043 9.21071 4.03914 9.58579 4.41421C9.96086 4.78929 10.4696 5 11 5C11.5304 5 12.0391 4.78929 12.4142 4.41421C12.7893 4.03914 13 3.53043 13 3C13 2.46957 12.7893 1.96086 12.4142 1.58579C12.0391 1.21071 11.5304 1 11 1C10.4696 1 9.96086 1.21071 9.58579 1.58579C9.21071 1.96086 9 2.46957 9 3ZM9 11C9 11.5304 9.21071 12.0391 9.58579 12.4142C9.96086 12.7893 10.4696 13 11 13C11.5304 13 12.0391 12.7893 12.4142 12.4142C12.7893 12.0391 13 11.5304 13 11C13 10.4696 12.7893 9.96086 12.4142 9.58579C12.0391 9.21071 11.5304 9 11 9C10.4696 9 9.96086 9.21071 9.58579 9.58579C9.21071 9.96086 9 10.4696 9 11Z"
                      stroke="black"
                      strokeWidth="1.33333"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "11px",
                    lineHeight: "16px",
                    color: "#000000",
                  }}
                >
                  Social Platforms
                </span>
                </div>
            </div>

            {/* Instagram Connection */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "838px",
                height: "40px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "9px",
                }}
              >
                <div
                  style={{
                    width: "20.77px",
                    height: "20.77px",
                    background: "#000000",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "13.84px",
                      height: "13.84px",
                      background: "#FFFFFF",
                      borderRadius: "2px",
                    }}
                  />
                    </div>
                <span
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 500,
                    fontSize: "12px",
                    lineHeight: "18px",
                    color: "#000000",
                  }}
                >
                  Instagram
                </span>
                </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "4px",
                }}
              >
                <button
                  type="button"
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "4px 8px",
                    width: "62px",
                    height: "18px",
                    background: "#FEF2F2",
                    border: "1px solid #EF4444",
                    borderRadius: "6px",
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "8px",
                    lineHeight: "12px",
                    color: "#EF4444",
                    cursor: "pointer",
                  }}
                >
                  Disconnect
                </button>
                <button
                  type="button"
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "4px 8px",
                    width: "62px",
                    height: "18px",
                    background: "#FFFFFF",
                    border: "1px solid #000000",
                    borderRadius: "6px",
                    gap: "4px",
                    cursor: "pointer",
                  }}
                >
                  <svg style={{ width: "14px", height: "14px" }} viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 10L10 2M10 2H4M10 2V8"
                      stroke="black"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    </svg>
                  <span
                    style={{
                      fontFamily: "Poppins",
                      fontStyle: "normal",
                      fontWeight: 500,
                      fontSize: "12px",
                      lineHeight: "18px",
                      color: "#000000",
                    }}
                  >
                    Edit
                  </span>
                </button>
                  </div>
                </div>

            {/* Connect New Platform Button */}
              <button
              type="button"
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: "9px 60px",
                width: "838px",
                height: "36px",
                background: "#F9FAFB",
                border: "1px solid #6B7280",
                borderRadius: "6px",
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: 500,
                fontSize: "12px",
                lineHeight: "18px",
                color: "#000000",
                cursor: "pointer",
              }}
            >
              + Connect New Social Platform
              </button>
          </div>
        </form>

        {/* Profile Actions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "8px",
            width: "838px",
          }}
        >
          {/* Save and Cancel buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "8px",
              width: "838px",
            }}
          >
                    <button
              type="button"
              onClick={handleSave}
                      disabled={saving}
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: "12px 24px",
                width: "415px",
                height: "48px",
                background: "#000000",
                borderRadius: "6px",
                border: "none",
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: 600,
                fontSize: "16px",
                lineHeight: "24px",
                color: "#FFFFFF",
                cursor: "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
              type="button"
              onClick={handleCancelEdit}
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: "12px 24px",
                width: "415px",
                height: "48px",
                background: "#FFFFFF",
                border: "1px solid #000000",
                borderRadius: "6px",
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: 600,
                fontSize: "16px",
                lineHeight: "24px",
                color: "#000000",
                cursor: "pointer",
              }}
            >
              Cancel
                    </button>
          </div>

          {/* Log out button */}
                  <button
            type="button"
            onClick={handleSignOut}
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              padding: "12px 24px",
              width: "838px",
              height: "48px",
              background: "#FFFFFF",
              border: "1px solid #000000",
              borderRadius: "6px",
              gap: "8px",
              fontFamily: "Poppins",
              fontStyle: "normal",
              fontWeight: 600,
              fontSize: "16px",
              lineHeight: "24px",
              color: "#000000",
              cursor: "pointer",
            }}
          >
            <LogOut style={{ width: "24px", height: "24px", color: "#000000" }} />
            Log out
                  </button>
        </div>
      </div>
    </div>
  )
} 