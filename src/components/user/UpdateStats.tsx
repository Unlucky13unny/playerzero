import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileService, type ProfileData, type ProfileWithMetadata } from '../../services/profileService'
import { dashboardService } from '../../services/dashboardService'
import { useMobile } from '../../hooks/useMobile'
import { MobileFooter } from '../layout/MobileFooter'
import { Upload } from 'lucide-react'
import './UserProfile.css'

export const UpdateStats = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileWithMetadata | null>(null)
  const [editData, setEditData] = useState<ProfileData | null>(null)
  const navigate = useNavigate()
  const isMobile = useMobile()
  
  // Screenshot state (same as StatUpdater)
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
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditData(profile)
    setSelectedFile(null)
    setError(null)
  }

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    if (editData) {
      // Allow empty values and handle them properly
      // If value is empty string, set to undefined to allow proper clearing
      const processedValue = value === '' ? undefined : value;
      setEditData(prev => ({ ...prev!, [field]: processedValue }))
    }
  }

  const handleStatsFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
  }

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [acknowledgeError, setAcknowledgeError] = useState(false)

  // Update image preview when file is selected
  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setImagePreview(null)
    }
  }, [selectedFile])

  const handleSave = async () => {
    if (!editData || !profile) return;

    // Check for decreasing stats (only primary stats - excluding Pokédex entries)
    const decreasingStats = [];
    if (editData.total_xp && parseFloat(editData.total_xp.toString()) < (profile.total_xp || 0)) {
      decreasingStats.push('Total XP');
    }
    if (editData.pokemon_caught && parseFloat(editData.pokemon_caught.toString()) < (profile.pokemon_caught || 0)) {
      decreasingStats.push('Pokémon Caught');
    }
    if (editData.distance_walked && parseFloat(editData.distance_walked.toString()) < (profile.distance_walked || 0)) {
      decreasingStats.push('Distance Walked');
    }
    if (editData.pokestops_visited && parseFloat(editData.pokestops_visited.toString()) < (profile.pokestops_visited || 0)) {
      decreasingStats.push('Pokéstops Visited');
    }
    // Note: Pokédex entries are excluded from decreasing stats warning as they can be more flexible

    // First confirmation - accuracy check
    const accuracyConfirmed = window.confirm(
      'Are you sure these stats are accurate? Please double-check your values before proceeding.'
    );
    
    if (!accuracyConfirmed) {
      return;
    }

    // Second confirmation - decreasing stats warning (skip if error acknowledged)
    if (decreasingStats.length > 0 && !acknowledgeError) {
      const decreaseConfirmed = window.confirm(
        `WARNING: The following stats are lower than your previous values: ${decreasingStats.join(', ')}.\n\n` +
        'Stats should generally only increase. If you continue to decrease stats regularly, this may result in a temporary ban.\n\n' +
        'Are you sure you want to proceed?'
      );
      
      if (!decreaseConfirmed) {
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      // Check if screenshot is provided (same logic as StatUpdater)
      if (!selectedFile) {
        setError('Please upload a verification screenshot to update your stats')
        setSaving(false)
        return
      }

      // Create updates object with only the changed stats (same logic as StatUpdater)
      const updates: any = {}
      
      // Convert to numbers for proper comparison and include all stats when checkbox is checked
      if (acknowledgeError || editData.distance_walked !== profile.distance_walked) {
        updates.distance_walked = editData.distance_walked ? parseFloat(editData.distance_walked.toString()) : profile.distance_walked
      }
      if (acknowledgeError || editData.pokemon_caught !== profile.pokemon_caught) {
        updates.pokemon_caught = editData.pokemon_caught ? parseInt(editData.pokemon_caught.toString()) : profile.pokemon_caught
      }
      if (acknowledgeError || editData.pokestops_visited !== profile.pokestops_visited) {
        updates.pokestops_visited = editData.pokestops_visited ? parseInt(editData.pokestops_visited.toString()) : profile.pokestops_visited
      }
      if (acknowledgeError || editData.total_xp !== profile.total_xp) {
        updates.total_xp = editData.total_xp ? parseInt(editData.total_xp.toString()) : profile.total_xp
      }
      if (acknowledgeError || editData.unique_pokedex_entries !== profile.unique_pokedex_entries) {
        updates.unique_pokedex_entries = editData.unique_pokedex_entries ? parseInt(editData.unique_pokedex_entries.toString()) : profile.unique_pokedex_entries
      }

      // Use dashboardService.updateUserStats with verification screenshot (same as StatUpdater)
      const response = await dashboardService.updateUserStats(updates, selectedFile, acknowledgeError)
      
      if (response.success) {
        // Reload profile data
        await loadProfile()
        setSelectedFile(null)
        setAcknowledgeError(false) // Reset acknowledgment state

        // Redirect to user profile after 2 seconds
        setTimeout(() => {
          navigate('/UserProfile')
        }, 2000)
      } else {
        setError(response.message || 'Failed to update stats')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update stats');
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
      {/* Messages */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: isMobile ? "8px" : "13px",
          width: isMobile ? "100%" : "838px",
          minWidth: isMobile ? "350px" : "auto", // Reduced for 414px devices
          maxWidth: isMobile ? "390px" : "100%", // Max width to fit in 414px viewport
          fontFamily: "Poppins, sans-ser",
          color: "#000000",
          margin: "0 auto",
          marginTop: isMobile ? "8px" : "20px", // Minimal top spacing for mobile header
          padding: "0px", // Removed padding
          boxSizing: "border-box",
        }}
      >

        {/* Stats Form */}
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
          {/* Core Stats Section */}
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
            {/* Core Stats Header */}
            <h2
              style={{
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: 600,
                fontSize: isMobile ? "20px" : "24px",
                lineHeight: isMobile ? "30px" : "36px",
                color: "#000000",
                width: "100%",
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
                Distance Walked
              </label>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                }}
              >
              <input
                type="text"
                value={editData?.distance_walked ?? ''}
                onChange={(e) => handleInputChange('distance_walked', e.target.value)}
                placeholder="Enter new distance in km"
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: isMobile ? "10px 40px 10px 10px" : "9px 35px 9px 9px",
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
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: isMobile ? "12px" : "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: isMobile ? "14px" : "12px",
                    lineHeight: isMobile ? "20px" : "18px",
                    color: "#666666",
                    pointerEvents: "none",
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
                  fontSize: isMobile ? "12px" : "11px",
                  lineHeight: isMobile ? "18px" : "16px",
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
                Pokémon Caught
              </label>
              <input
                type="text"
                value={editData?.pokemon_caught ?? ''}
                onChange={(e) => handleInputChange('pokemon_caught', e.target.value)}
                placeholder="Enter new Pokémon caught count"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: isMobile ? "12px" : "9px",
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
                Pokéstops Visited
              </label>
              <input
                type="text"
                value={editData?.pokestops_visited ?? ''}
                onChange={(e) => handleInputChange('pokestops_visited', e.target.value)}
                placeholder="Enter new Pokéstops visited count"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: isMobile ? "12px" : "9px",
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
                Total XP
              </label>
              <input
                type="text"
                value={editData?.total_xp ?? ''}
                onChange={(e) => handleInputChange('total_xp', e.target.value)}
                placeholder="Enter new Total XP value"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: isMobile ? "12px" : "9px",
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
              gap: isMobile ? "8px" : "13px",
              width: "100%",
            }}
          >
            {/* Secondary Stats Header */}
            <h2
              style={{
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: 600,
                fontSize: isMobile ? "20px" : "24px",
                lineHeight: isMobile ? "30px" : "36px",
                color: "#000000",
                width: "100%",
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
                Pokédex Entries
              </label>
              <input
                type="text"
                value={editData?.unique_pokedex_entries ?? ''}
                onChange={(e) => handleInputChange('unique_pokedex_entries', e.target.value)}
                placeholder="Enter new Pokédex entries count"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: isMobile ? "12px" : "9px",
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
                Upload new screenshot
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  width: "100%",
                  height: isMobile ? "44px" : "36px",
                  background: "#FFFFFF",
                  border: "1px dashed #848282",
                  borderRadius: "6px",
                  padding: isMobile ? "12px" : "9px",
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
                  <Upload style={{ width: isMobile ? "20px" : "16px", height: isMobile ? "20px" : "16px", color: "#000000" }} />
                  <span
                    style={{
                      fontFamily: "Poppins",
                      fontStyle: "normal",
                      fontWeight: 400,
                      fontSize: isMobile ? "14px" : "12px",
                      lineHeight: isMobile ? "20px" : "18px",
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
                    fontSize: isMobile ? "12px" : "12px",
                    lineHeight: isMobile ? "18px" : "18px",
                    color: "#666666",
                    marginLeft: "auto",
                    textAlign: "right",
                    maxWidth: isMobile ? "150px" : "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedFile ? selectedFile.name : "No file chosen"}
                </span>
              </div>
            </div>
          </div>

          {/* Image Preview Section */}
          {imagePreview && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "8px",
                width: "100%",
                marginTop: "16px",
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
                Screenshot Preview
              </label>
              <div
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  overflow: "hidden",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <img
                  src={imagePreview}
                  alt="Screenshot preview"
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: "300px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "10px" : "9px",
                  lineHeight: isMobile ? "15px" : "14px",
                  color: "#666666",
                }}
              >
                Use this preview to help you enter your stats accurately
              </span>
            </div>
          )}
        </form>

        {/* Action Buttons - Frame 666 */}
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
            
            /* Gap from form section */
            marginTop: "8px",
          }}
        >
          {/* Error Acknowledgment Checkbox */}
          {error && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "12px",
                width: "100%",
                marginBottom: "16px",
                padding: "16px",
                backgroundColor: "#f8f9fa",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {/* Warning Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: "#dc3545",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  !
                </div>
                <span
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 600,
                    fontSize: isMobile ? "14px" : "13px",
                    lineHeight: isMobile ? "20px" : "18px",
                    color: "#dc3545",
                  }}
                >
                  Previous Upload Error Detected
                </span>
              </div>

              {/* Warning Message */}
              <div
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "12px" : "11px",
                  lineHeight: isMobile ? "18px" : "16px",
                  color: "#6c757d",
                  width: "100%",
                }}
              >
                {error}
              </div>

              {/* Acknowledgment Checkbox */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: "8px",
                  width: "100%",
                }}
              >
                <input
                  type="checkbox"
                  id="acknowledge-error"
                  checked={acknowledgeError}
                  onChange={(e) => setAcknowledgeError(e.target.checked)}
                  style={{
                    marginTop: "2px",
                    width: "16px",
                    height: "16px",
                    accentColor: "#dc3545",
                  }}
                />
                <label
                  htmlFor="acknowledge-error"
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 500,
                    fontSize: isMobile ? "12px" : "11px",
                    lineHeight: isMobile ? "18px" : "16px",
                    color: "#495057",
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  I acknowledge that I made an error in my previous stat update and understand that if this continues, I may incur a temporary ban.
                </label>
              </div>
            </div>
          )}

          {/* Save and Cancel buttons - Frame 665 */}
          <div
            style={{
              /* Frame 665 */
              display: "flex",
              flexDirection: "row", // Match Figma design
              justifyContent: "space-between", // Match Figma design
              alignItems: "center",
              padding: "0px",
              gap: "8px",
              
              width: isMobile ? "353px" : "100%",
              height: isMobile ? "38px" : "auto", // Match Figma design
              
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
              disabled={saving || !selectedFile || (!!error && !acknowledgeError)}
              style={{
                /* Component 47 */
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: isMobile ? "4px 8px" : "12px 24px", // Match Figma design
                gap: "8px",
                
                margin: isMobile ? "0 auto" : "0", // Match Figma design
                width: isMobile ? "170px" : "415px", // Match Figma design
                height: isMobile ? "38px" : "48px", // Match Figma design
                
                background: "#000000",
                borderRadius: "6px",
                
                /* Inside auto layout */
                flex: "none",
                order: 0,
                flexGrow: 0,
                
                border: "none",
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: 500, // Match Figma design
                fontSize: isMobile ? "14px" : "16px", // Match Figma design
                lineHeight: isMobile ? "21px" : "24px", // Match Figma design
                color: "#FFFFFF",
                cursor: "pointer",
                opacity: (saving || !selectedFile) ? 0.5 : 1,
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
                padding: isMobile ? "4px 8px" : "12px 24px", // Match Figma design
                gap: "8px",
                
                margin: isMobile ? "0 auto" : "0", // Match Figma design
                width: isMobile ? "170px" : "415px", // Match Figma design
                height: isMobile ? "38px" : "48px", // Match Figma design
                
                border: "1px solid #000000",
                borderRadius: "6px",
                
                /* Inside auto layout */
                flex: "none",
                order: 1,
                flexGrow: 0,
                
                background: "#FFFFFF",
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: 500, // Match Figma design
                fontSize: isMobile ? "14px" : "16px", // Match Figma design
                lineHeight: isMobile ? "21px" : "24px", // Match Figma design
                color: "#000000",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Footer */}
      <MobileFooter currentPage="profile" />
    </div>
  )
}
