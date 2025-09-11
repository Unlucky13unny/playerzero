import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { profileService, type ProfileData, type ProfileWithMetadata } from '../../services/profileService'
import { useValuePropModal } from '../../hooks/useValuePropModal'
import { useMobile } from '../../hooks/useMobile'
import { MobileFooter } from '../layout/MobileFooter'
import { ValuePropModal } from '../upgrade/ValuePropModal'
import { LogOut } from 'lucide-react'
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
  const navigate = useNavigate()
  const isMobile = useMobile()
  const { isOpen, closeValueProp, daysRemaining } = useValuePropModal()

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

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    if (editData) {
      setEditData(prev => ({ ...prev!, [field]: value }))
    }
  }

  const handleCancelEdit = () => {
    setEditData(profile)
    setError(null)
    setSuccess(null)
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

      // If only trainer name or country is changed, update last_name_change_date
      if (isNameChanged || isCountryChanged) {
        updatedData.last_name_change_date = new Date().toISOString();
      }

      // Ensure trainer code privacy is properly set
      updatedData.trainer_code_private = editData.trainer_code_private || false;

      // Update profile in database
      const { data, error } = await profileService.updateProfile(updatedData);
      
      if (error) {
        throw new Error('Failed to update profile: ' + error.message);
      }

      setProfile(data);
      setEditData(data);
      setSuccess('Profile updated successfully!');
      
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
    <div 
      className="profile-settings-container"
      style={{
        padding: isMobile ? "0px" : "2rem", // Remove padding on mobile
        alignItems: isMobile ? "flex-start" : "center", // Top align on mobile
        justifyContent: isMobile ? "flex-start" : "center", // Top align on mobile
      }}
    >
      <ValuePropModal 
        isOpen={isOpen} 
        onClose={closeValueProp} 
        daysRemaining={daysRemaining} 
      />

      {/* Messages */}
      {error && (
        <div className="profile-error-message" style={{ marginBottom: isMobile ? "2px" : "1rem" }}>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="profile-success-message" style={{ marginBottom: isMobile ? "2px" : "1rem" }}>
          <span>{success}</span>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: isMobile ? "8px" : "13px",
          width: isMobile ? "100%" : "838px",
          minWidth: isMobile ? "350px" : "auto", // Reduced for 414px devices
          maxWidth: isMobile ? "390px" : "100%", // Max width to fit in 414px viewport
          fontFamily: "Poppins, sans-serif",
          color: "#000000",
          margin: "0 auto",
          marginTop: isMobile ? "8px" : "20px", // Minimal top spacing for mobile header
          padding: "0px", // Removed padding
          boxSizing: "border-box",
        }}
      >
        {/* Profile Settings Header */}
        <h1
          style={{
            fontFamily: "Poppins",
            fontStyle: "normal",
            fontWeight: 600,
            fontSize: isMobile ? "20px" : "24px",
            lineHeight: isMobile ? "30px" : "36px",
            color: "#000000",
            width: "100%",
            textAlign: "center",
            margin: "0", // Remove default h1 margin
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
            gap: isMobile ? "8px" : "13px",
            width: "100%",
            minWidth: isMobile ? "296px" : "auto", // 320px container - 24px padding
          }}
        >
          {/* Basic Info Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: isMobile ? "8px" : "13px",
              width: "100%",
              minWidth: isMobile ? "296px" : "auto",
            }}
          >
            {/* Email Address */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
                width: "100%",
                minWidth: isMobile ? "296px" : "auto",
              }}
            >
              <label
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "12px" : "11px",
                  lineHeight: isMobile ? "18px" : "16px",
                  color: "#000000",
                  width: "100%",
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
                  padding: isMobile ? "10px" : "9px",
                  gap: "10px",
                  width: "100%",
                  height: isMobile ? "44px" : "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "14px" : "12px",
                  lineHeight: isMobile ? "20px" : "18px",
                  color: "#000000",
                  boxSizing: "border-box",
                  outline: "none",
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
                width: "100%",
                minWidth: isMobile ? "296px" : "auto",
              }}
            >
              <label
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "12px" : "11px",
                  lineHeight: isMobile ? "18px" : "16px",
                  color: "#000000",
                  width: "100%",
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
                  padding: isMobile ? "10px" : "9px",
                  gap: "10px",
                  width: "100%",
                  height: isMobile ? "44px" : "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "14px" : "12px",
                  lineHeight: isMobile ? "20px" : "18px",
                  color: "#000000",
                  boxSizing: "border-box",
                  outline: "none",
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
                width: "100%",
                minWidth: isMobile ? "296px" : "auto",
              }}
            >
              <label
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "12px" : "11px",
                  lineHeight: isMobile ? "18px" : "16px",
                  color: "#000000",
                  width: "100%",
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
                  padding: isMobile ? "10px" : "9px",
                  gap: "10px",
                  width: "100%",
                  height: isMobile ? "44px" : "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "14px" : "12px",
                  lineHeight: isMobile ? "20px" : "18px",
                  color: "#000000",
                  boxSizing: "border-box",
                  outline: "none",
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
                width: "100%",
                minWidth: isMobile ? "296px" : "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "2px",
                  width: "100%",
                }}
              >
                <label
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: isMobile ? "12px" : "11px",
                    lineHeight: isMobile ? "18px" : "16px",
                    color: "#000000",
                    width: "100%",
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
                    padding: isMobile ? "10px" : "9px",
                    gap: "10px",
                    width: "100%",
                    height: isMobile ? "44px" : "36px",
                    background: "#FFFFFF",
                    border: "1px solid #848282",
                    borderRadius: "6px",
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: isMobile ? "14px" : "12px",
                    lineHeight: isMobile ? "20px" : "18px",
                    color: "#000000",
                    boxSizing: "border-box",
                    outline: "none",
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
                  width: "100%",
                  height: "28px",
                }}
              >
                <span
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 500,
                    fontSize: isMobile ? "12px" : "11px",
                    lineHeight: isMobile ? "18px" : "16px",
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
              width: "100%",
              minWidth: isMobile ? "296px" : "auto",
            }}
          >
            {/* Country */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
                width: "100%",
                minWidth: isMobile ? "296px" : "auto",
              }}
            >
              <label
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "12px" : "11px",
                  lineHeight: isMobile ? "18px" : "16px",
                  color: "#000000",
                  width: "100%",
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
                  padding: isMobile ? "10px" : "9px",
                  gap: "10px",
                  width: "100%",
                  height: isMobile ? "44px" : "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "14px" : "12px",
                  lineHeight: isMobile ? "20px" : "18px",
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
                width: "100%",
                minWidth: isMobile ? "296px" : "auto",
              }}
            >
              <label
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "12px" : "11px",
                  lineHeight: isMobile ? "18px" : "16px",
                  color: "#000000",
                  width: "100%",
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
                  padding: isMobile ? "10px" : "9px",
                  gap: "10px",
                  width: "100%",
                  height: isMobile ? "44px" : "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "14px" : "12px",
                  lineHeight: isMobile ? "20px" : "18px",
                  color: "#000000",
                }}
              >
                <option value="">Choose your team</option>
                {TEAM_COLORS.map(team => (
                  <option key={team.value} value={team.value}>{team.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Social Platforms Section */}
          <div
            style={{ 
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "8px",
              width: "100%",
            }}
          >
            {/* Social Platforms Header */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
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
                    fontSize: isMobile ? "12px" : "11px",
                    lineHeight: isMobile ? "18px" : "16px",
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
                width: "100%",
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
                    fontSize: isMobile ? "14px" : "12px",
                    lineHeight: isMobile ? "20px" : "18px",
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
                      fontSize: isMobile ? "14px" : "12px",
                      lineHeight: isMobile ? "20px" : "18px",
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
                width: "100%",
                height: isMobile ? "44px" : "36px",
                background: "#F9FAFB",
                border: "1px solid #6B7280",
                borderRadius: "6px",
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: 500,
                fontSize: isMobile ? "14px" : "12px",
                lineHeight: isMobile ? "20px" : "18px",
                color: "#000000",
                cursor: "pointer",
              }}
            >
              + Connect New Social Platform
            </button>
          </div>
        </form>

        {/* Profile Actions - Frame 666 */}
        <div
          style={{
            /* Frame 666 */
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            padding: "0px",
            gap: "8px",
            
            width: isMobile ? "353px" : "100%",
            height: isMobile ? "84px" : "auto",
            
            /* Inside auto layout */
            flex: "none",
            order: 1,
            alignSelf: "stretch",
            flexGrow: 0,
            
            /* Gap from social platforms section */
            marginTop: "8px",
          }}
        >
          {/* Save and Cancel buttons - Frame 665 */}
          <div
            style={{
              /* Frame 665 */
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0px",
              gap: "8px",
              
              width: isMobile ? "353px" : "100%",
              height: isMobile ? "38px" : "auto",
              
              /* Inside auto layout */
              flex: "none",
              order: 0,
              alignSelf: "stretch",
              flexGrow: 0,
            }}
          >
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                /* Component 47 */
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: isMobile ? "4px 8px" : "12px 24px",
                gap: "8px",
                
                margin: isMobile ? "0 auto" : "0",
                width: isMobile ? "170px" : "415px",
                height: isMobile ? "38px" : "48px",
                
                background: "#000000",
                borderRadius: "6px",
                
                /* Inside auto layout */
                flex: "none",
                order: 0,
                flexGrow: 0,
                
                border: "none",
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: isMobile ? 500 : 600,
                fontSize: isMobile ? "14px" : "16px",
                lineHeight: isMobile ? "21px" : "24px",
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
                /* Component 48 */
                boxSizing: "border-box",
                
                /* Auto layout */
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: isMobile ? "4px 8px" : "12px 24px",
                gap: "8px",
                
                margin: isMobile ? "0 auto" : "0",
                width: isMobile ? "170px" : "415px",
                height: isMobile ? "38px" : "48px",
                
                border: "1px solid #000000",
                borderRadius: "6px",
                
                /* Inside auto layout */
                flex: "none",
                order: 1,
                flexGrow: 0,
                
                background: "#FFFFFF",
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: isMobile ? 500 : 600,
                fontSize: isMobile ? "14px" : "16px",
                lineHeight: isMobile ? "21px" : "24px",
                color: "#000000",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>

          {/* Log out button - Component 46 */}
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              /* Component 46 */
              boxSizing: "border-box",
              
              /* Auto layout */
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              padding: isMobile ? "8px 24px" : "12px 24px",
              gap: "8px",
              
              width: isMobile ? "353px" : "100%",
              height: isMobile ? "38px" : "48px",
              
              border: "1px solid #000000",
              borderRadius: "6px",
              
              /* Inside auto layout */
              flex: "none",
              order: 1,
              alignSelf: "stretch",
              flexGrow: 0,
              
              background: "#FFFFFF",
              fontFamily: "Poppins",
              fontStyle: "normal",
              fontWeight: isMobile ? 600 : 600,
              fontSize: isMobile ? "14px" : "16px",
              lineHeight: isMobile ? "21px" : "24px",
              color: "#000000",
              cursor: "pointer",
            }}
          >
            <LogOut 
              style={{ 
                /* material-symbols:logout */
                width: "24px", 
                height: "24px",
                
                /* Inside auto layout */
                flex: "none",
                order: 0,
                flexGrow: 0,
                
                color: "#000000" 
              }} 
            />
            <span
              style={{
                /* Log out */
                width: isMobile ? "52px" : "auto",
                height: isMobile ? "21px" : "auto",
                
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: 600,
                fontSize: isMobile ? "14px" : "16px",
                lineHeight: isMobile ? "21px" : "24px",
                color: "#000000",
                
                /* Inside auto layout */
                flex: "none",
                order: 1,
                flexGrow: 0,
                whiteSpace: "nowrap",
              }}
            >
              Log out
            </span>
          </button>
        </div>
      </div>
      
      {/* Mobile Footer */}
      <MobileFooter currentPage="profile" />
    </div>
  )
}