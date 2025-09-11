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
  const [success, setSuccess] = useState<string | null>(null)
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
      // Check if screenshot is provided (same logic as StatUpdater)
      if (!selectedFile) {
        setError('Please upload a verification screenshot to update your stats')
        setSaving(false)
        return
      }

      // Create updates object with only the changed stats (same logic as StatUpdater)
      const updates: any = {}
      
      if (editData.distance_walked !== profile.distance_walked) {
        updates.distance_walked = editData.distance_walked
      }
      if (editData.pokemon_caught !== profile.pokemon_caught) {
        updates.pokemon_caught = editData.pokemon_caught
      }
      if (editData.pokestops_visited !== profile.pokestops_visited) {
        updates.pokestops_visited = editData.pokestops_visited
      }
      if (editData.total_xp !== profile.total_xp) {
        updates.total_xp = editData.total_xp
      }
      if (editData.unique_pokedex_entries !== profile.unique_pokedex_entries) {
        updates.unique_pokedex_entries = editData.unique_pokedex_entries
      }

      // Use dashboardService.updateUserStats with verification screenshot (same as StatUpdater)
      const response = await dashboardService.updateUserStats(updates, selectedFile)
      
      if (response.success) {
        setSuccess('Stats updated successfully! Redirecting to your profile...')
        
        // Reload profile data
        await loadProfile()
        setSelectedFile(null)

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
                  value={editData?.distance_walked || 0}
                  onChange={(e) => handleInputChange('distance_walked', e.target.value)}
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
                value={editData?.pokemon_caught || 0}
                onChange={(e) => handleInputChange('pokemon_caught', e.target.value)}
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
                value={editData?.pokestops_visited || 0}
                onChange={(e) => handleInputChange('pokestops_visited', e.target.value)}
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
                value={editData?.total_xp || 0}
                onChange={(e) => handleInputChange('total_xp', e.target.value)}
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
                value={editData?.unique_pokedex_entries || 0}
                onChange={(e) => handleInputChange('unique_pokedex_entries', e.target.value)}
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
              disabled={saving || !selectedFile}
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
        </div>
      </div>
      
      {/* Mobile Footer */}
      <MobileFooter currentPage="profile" />
    </div>
  )
}
