import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { profileService, type ProfileData, type ProfileWithMetadata } from '../../services/profileService'
import { useValuePropModal } from '../../hooks/useValuePropModal'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { useMobile } from '../../hooks/useMobile'
import { MobileFooter } from '../layout/MobileFooter'
import { ValuePropModal } from '../upgrade/ValuePropModal'
import { SocialConnectModal } from '../social/SocialConnectModal'
import { WelcomeModal } from '../common/WelcomeModal'
import { ErrorModal } from '../common/ErrorModal'
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
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
  'Bangladesh', 'Barbados', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso',
  'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic',
  'Chad', 'Chile', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba',
  'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia',
  'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia',
  'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
  'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
  'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
  'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand',
  'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
  'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',
  'Poland', 'Portugal', 'Qatar', 'Romania', 'Rwanda', 'Saint Kitts and Nevis',
  'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
  'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan',
  'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
  'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia',
  'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe', 'Other'
]

export const UserProfile = () => {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileWithMetadata | null>(null)
  const [editData, setEditData] = useState<ProfileData | null>(null)
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<{id: string, name: string, url: string} | null>(null)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [showTrainerCodeError, setShowTrainerCodeError] = useState(false)
  const [showPrivacyUpgradeModal, setShowPrivacyUpgradeModal] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMobile()
  const { isOpen, closeValueProp, daysRemaining } = useValuePropModal()
  const trialStatus = useTrialStatus()

  // Check if user is coming from profile setup
  useEffect(() => {
    const isFromSetup = location.state?.fromProfileSetup
    if (isFromSetup) {
      setShowWelcomeModal(true)
      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location])

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
      // Special handling for trainer_name to remove spaces
      if (field === 'trainer_name') {
        // Remove all spaces from trainer name
        const noSpaces = value.replace(/\s/g, '');
        
        setEditData(prev => ({ ...prev!, [field]: noSpaces }))
      }
      // Special handling for trainer_code to enforce 12-digit limit
      else if (field === 'trainer_code') {
        // Remove any non-digit characters
        const digitsOnly = value.replace(/\D/g, '');
        
        // Limit to 12 digits maximum
        const limitedValue = digitsOnly.slice(0, 12);
        
        setEditData(prev => ({ ...prev!, [field]: limitedValue }))
      } 
      // Special handling for trainer_level to allow editing while enforcing 1-80 range
      else if (field === 'trainer_level') {
        // Allow empty string for deletion, or store the raw value for typing
        if (value === '' || value === null || value === undefined) {
          setEditData(prev => ({ ...prev!, [field]: '' as any }))
        } else {
          const numValue = parseInt(value);
          // Only validate if it's a valid number
          if (!isNaN(numValue)) {
            // Cap between 1 and 80
            const cappedValue = Math.max(1, Math.min(80, numValue));
            setEditData(prev => ({ ...prev!, [field]: cappedValue }))
          }
        }
      } 
      else {
        setEditData(prev => ({ ...prev!, [field]: value }))
      }
    }
  }

  // Handle trainer code privacy toggle with trial restriction
  const handleTrainerCodePrivacyToggle = () => {
    if (!editData) return
    
    // If user is trial user, block the toggle and show upgrade modal
    if (!trialStatus.isPaidUser) {
      setShowPrivacyUpgradeModal(true)
      return
    }
    
    // Otherwise, allow the toggle (paid users only)
    handleInputChange('trainer_code_private', !editData.trainer_code_private)
  }

  // Handle social links privacy toggle with trial restriction
  const handleSocialLinksPrivacyToggle = () => {
    if (!editData) return
    
    // If user is trial user, block the toggle and show upgrade modal
    if (!trialStatus.isPaidUser) {
      setShowPrivacyUpgradeModal(true)
      return
    }
    
    // Otherwise, allow the toggle (paid users only)
    handleInputChange('social_links_private', !editData.social_links_private)
  }

  const handleCancelEdit = () => {
    // Check if there are any unsaved changes
    const hasChanges = profile && editData && (
      profile.trainer_name !== editData.trainer_name ||
      profile.country !== editData.country ||
      profile.trainer_code !== editData.trainer_code ||
      profile.trainer_code_private !== editData.trainer_code_private ||
      profile.social_links_private !== editData.social_links_private ||
      // Check for social platform changes
      Object.keys(editData).some(key => 
        key.startsWith('social_') && 
        profile[key as keyof typeof profile] !== editData[key as keyof typeof editData]
      )
    );

    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel and lose your changes?'
      );
      if (!confirmed) {
        return;
      }
    }

    setEditData(profile)
    setError(null)
    setSuccess(null)
    // Navigate to user profile page
    navigate('/UserProfile');
  }

  const handleSave = async () => {
    if (!editData || !profile) return;

    // Validate trainer code is exactly 12 digits
    if (editData.trainer_code && editData.trainer_code.length !== 12) {
      setShowTrainerCodeError(true);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let updatedData = { ...editData };
      
      // Ensure trainer_level has a valid value (default to 1 if empty)
      const levelValue = Number(updatedData.trainer_level);
      if (!updatedData.trainer_level || isNaN(levelValue) || levelValue < 1) {
        updatedData.trainer_level = 1;
      } else {
        // Ensure it's within valid range (1-80)
        updatedData.trainer_level = Math.max(1, Math.min(80, levelValue));
      }

      // Check if trainer name or country is being changed
      const isNameChanged = profile.trainer_name !== editData.trainer_name;
      const isCountryChanged = profile.country !== editData.country;

      // If only trainer name or country is changed, update last_name_change_date
      if (isNameChanged || isCountryChanged) {
        updatedData.last_name_change_date = new Date().toISOString();
      }

      // Ensure trainer code privacy is properly set
      // For trial users, force privacy to private (true)
      if (!trialStatus.isPaidUser) {
        updatedData.trainer_code_private = true;
      } else {
        updatedData.trainer_code_private = editData.trainer_code_private || false;
      }
      
      // Ensure social links privacy is properly set
      // For trial users, force privacy to private (true)
      if (!trialStatus.isPaidUser) {
        updatedData.social_links_private = true;
      } else {
        updatedData.social_links_private = editData.social_links_private || false;
      }

      // Update profile in database
      const { data, error } = await profileService.updateProfile(updatedData);
      
      if (error) {
        throw new Error('Failed to update profile: ' + error.message);
      }

      setProfile(data);
      setEditData(data);
      // Don't show success message for profile updates
      
      // Navigate to user profile page
      navigate('/UserProfile');
      
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSocialConnect = async (platform: string, url: string) => {
    if (!editData || !profile) return;

    setSaving(true);
    setError(null);
    // Don't clear success message here - let it persist for profile updates

    try {
      // Create updated data with the new social platform URL
      const updatedData = { 
        ...editData,
        [platform]: url // This will set the appropriate field (e.g., instagram, github, etc.)
      };

      // Update profile in database
      const { data, error } = await profileService.updateProfile(updatedData);
      
      if (error) {
        throw new Error('Failed to connect social platform: ' + error.message);
      }

      // Update local state
      setProfile(data);
      setEditData(data);
      // Don't show success message for social connections
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect social platform');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSocialModal = () => {
    setEditingPlatform(null); // Clear any editing state
    setIsSocialModalOpen(true);
  };

  const handleCloseSocialModal = () => {
    setIsSocialModalOpen(false);
    setEditingPlatform(null); // Clear editing state when closing
  };

  const handleEditPlatform = (platform: {id: string, name: string}) => {
    if (!editData) return;
    
    const currentUrl = editData[platform.id as keyof ProfileData] as string;
    setEditingPlatform({
      id: platform.id,
      name: platform.name,
      url: currentUrl || ''
    });
    setIsSocialModalOpen(true);
  };

  // Get connected social platforms with their icons
  const getConnectedPlatforms = () => {
    if (!editData) return [];
    
    const platforms = [
      { 
        id: 'x', 
        name: 'X (Twitter)',
        icon: <img src="/images/x.svg" alt="X (Twitter)" width="20" height="20" />
      },
      { 
        id: 'bluesky', 
        name: 'Bluesky',
        icon: <img src="/images/bluesky.svg" alt="Bluesky" width="20" height="20" />
      },
      { 
        id: 'facebook', 
        name: 'Facebook',
        icon: <img src="/images/facebook.svg" alt="Facebook" width="20" height="20" />
      },
      { 
        id: 'discord', 
        name: 'Discord',
        icon: <img src="/images/discord.svg" alt="Discord" width="20" height="20" />
      },
      { 
        id: 'instagram', 
        name: 'Instagram',
        icon: <img src="/images/instagram.svg" alt="Instagram" width="20" height="20" />
      },
      { 
        id: 'youtube', 
        name: 'YouTube',
        icon: <img src="/images/youtube.svg" alt="YouTube" width="20" height="20" />
      },
      { 
        id: 'tiktok', 
        name: 'TikTok',
        icon: <img src="/images/tiktok.svg" alt="TikTok" width="20" height="20" />
      },
      { 
        id: 'twitch', 
        name: 'Twitch',
        icon: <img src="/images/twitch.svg" alt="Twitch" width="20" height="20" />
      },
      { 
        id: 'reddit', 
        name: 'Reddit',
        icon: <img src="/images/reddit.svg" alt="Reddit" width="20" height="20" />
      },
    ];

    return platforms.filter(platform => editData[platform.id as keyof ProfileData]);
  };

  // Handle disconnecting a social platform
  const handleDisconnectPlatform = async (platform: string) => {
    if (!editData || !profile) return;

    setSaving(true);
    setError(null);
    // Don't clear success message here - let it persist for profile updates

    try {
      // Create updated data with the social platform URL removed
      const updatedData = { 
        ...editData,
        [platform]: '' // Clear the platform URL
      };

      // Update profile in database
      const { data, error } = await profileService.updateProfile(updatedData);
      
      if (error) {
        throw new Error('Failed to disconnect social platform: ' + error.message);
      }

      // Update local state
      setProfile(data);
      setEditData(data);
      // Don't show success message for social disconnections
      
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect social platform');
    } finally {
      setSaving(false);
    }
  };

  // Show consistent loading for both initial load and saving operations
  if (loading && !profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%' }}>
        <p style={{ fontSize: '18px', color: '#DC2627', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textAlign: 'center', padding: '0 20px' }}>Loading your Profile...</p>
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

  // Professional loading overlay during save operations
  const renderSavingOverlay = () => {
    if (!saving) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <p style={{
          fontSize: '18px',
          color: '#DC2627',
          fontWeight: 600,
          fontFamily: 'Poppins, sans-serif',
          textAlign: 'center',
          padding: '0 20px'
        }}>
          Saving your Profile...
        </p>
      </div>
    );
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
      {renderSavingOverlay()}
      
      <WelcomeModal 
        isOpen={showWelcomeModal}
        onContinue={() => setShowWelcomeModal(false)}
        userName={profile?.trainer_name}
      />

      <ValuePropModal 
        isOpen={isOpen} 
        onClose={closeValueProp} 
        daysRemaining={daysRemaining} 
      />

      <SocialConnectModal
        isOpen={isSocialModalOpen}
        onClose={handleCloseSocialModal}
        onConnect={handleSocialConnect}
        editingPlatform={editingPlatform}
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
              <span
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "12px" : "11px",
                  lineHeight: isMobile ? "18px" : "16px",
                  color: "#666666",
                }}
              >
                No spaces allowed
              </span>
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
                max="80"
                value={(editData?.trainer_level as any) === '' ? '' : (editData?.trainer_level || '')}
                onChange={(e) => handleInputChange('trainer_level', e.target.value)}
                placeholder="Enter level (1-80)"
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
                  maxLength={12}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: isMobile ? "10px" : "9px",
                    gap: "10px",
                    width: "100%",
                    height: isMobile ? "44px" : "36px",
                    background: "#FFFFFF",
                    border: editData?.trainer_code && editData.trainer_code.length < 12 ? "1px solid #ff375f" : "1px solid #848282",
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
                {editData?.trainer_code && editData.trainer_code.length < 12 && (
                  <div style={{
                    fontSize: isMobile ? "12px" : "10px",
                    color: "#ff375f",
                    marginTop: "4px",
                    fontFamily: "Poppins"
                  }}>
                    Trainer code must be exactly 12 digits
                  </div>
                )}
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
                  onClick={handleTrainerCodePrivacyToggle}
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

            {/* Connected Social Platforms */}
            {getConnectedPlatforms().map((platform) => (
              <div
                key={platform.id}
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
                    {platform.icon}
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
                    {platform.name}
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
                    onClick={() => handleDisconnectPlatform(platform.id)}
                    disabled={saving}
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
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    Disconnect
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditPlatform(platform)}
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
            ))}

            {/* Connect New Platform Button and Privacy Toggle Row */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                gap: "16px",
              }}
            >
              {/* Connect New Platform Button */}
              <button
                type="button"
                onClick={handleOpenSocialModal}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "9px 20px",
                  flex: 1,
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

              {/* Keep social links private toggle */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
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
                  Keep private
                </span>
                <button
                  type="button"
                  onClick={handleSocialLinksPrivacyToggle}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "2px",
                    width: "44px",
                    height: "24px",
                    background: editData?.social_links_private ? "#DC2627" : "#E5E7EB",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    justifyContent: editData?.social_links_private ? "flex-end" : "flex-start",
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
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              Save
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
        
        {/* Footer - Manual inline */}
        <div style={{
          width: '100%',
          minHeight: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #EBEFF2',
          padding: '20px',
          gap: '4px',
          marginBottom: '-120px',
          order: 999,
          flex: 'none',
          alignSelf: 'stretch',
        }}>
          <span style={{
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '18px',
            color: '#666666',
            textAlign: 'center',
          }}>
            © 2025 PlayerZero. All rights reserved.
          </span>
          <span style={{
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: '18px',
            color: '#999999',
            textAlign: 'center',
          }}>
            Powering the next generation of Pokemon GO trainers
          </span>
        </div>
      </div>
      
      {/* Mobile Footer */}
      <MobileFooter currentPage="profile" />
      
      {/* Trainer Code Error Modal */}
      <ErrorModal
        isOpen={showTrainerCodeError}
        onClose={() => setShowTrainerCodeError(false)}
        title="ERROR!"
        message="Trainer code must be exactly 12 digits"
        confirmText="Retry"
        cancelText="Cancel"
      />

      {/* Privacy Upgrade Modal */}
      <ErrorModal
        isOpen={showPrivacyUpgradeModal}
        onClose={() => setShowPrivacyUpgradeModal(false)}
        title="Premium Feature"
        message="Sharing your Trainer Code and Socials is a premium feature. Upgrade to unlock."
        confirmText="Okay"
      />
    </div>
  )
}