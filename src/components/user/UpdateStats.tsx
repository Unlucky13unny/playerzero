import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileService, type ProfileData, type ProfileWithMetadata } from '../../services/profileService'
import { dashboardService } from '../../services/dashboardService'
import { useMobile } from '../../hooks/useMobile'
import { MobileFooter } from '../layout/MobileFooter'
import { Upload } from 'lucide-react'
import { StatUpdateModal } from '../common/StatUpdateModal'
import { extractStatsFromImage, validateExtractedStats } from '../../utils/ocrService'
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
    setOcrMessage(null)
    setHasExtractedStats(false)
    
    if (file) {
      console.log('📁 Image selected:', file.name, 'Size:', file.size, 'bytes')
      console.log('✅ Preview ready. Click "Extract Stats from Image" button to process.')
    }
  }

  const handleExtractStats = async () => {
    if (!selectedFile) {
      setOcrMessage('❌ Please select an image first')
      return
    }
    
    console.log('🔘 User clicked "Extract Stats" button')
    await processOCR(selectedFile)
  }

  const processOCR = async (file: File) => {
    console.log('🚀 Starting OCR processing for file:', file.name, 'Size:', file.size, 'bytes')
    
    setIsProcessingOCR(true)
    setOcrProgress(0)
    setOcrMessage('🔍 Analyzing screenshot...')

    try {
      console.log('📸 Calling extractStatsFromImage...')
      
      const result = await extractStatsFromImage(file, (progress) => {
        console.log(`📊 OCR Progress: ${Math.round(progress)}%`)
        setOcrProgress(Math.round(progress))
        setOcrMessage(`🔍 Processing image... ${Math.round(progress)}%`)
      })

      console.log('✅ OCR Extraction Complete!')
      console.log('📋 Raw OCR Text:', result.rawText)
      console.log('📊 Extracted Stats:', result.stats)
      console.log('🎯 Confidence Score:', result.confidence + '%')

      // Check if any stats were extracted
      const statsCount = Object.keys(result.stats).length
      if (statsCount === 0) {
        console.warn('⚠️ No stats were extracted from the image')
        setOcrMessage('⚠️ Could not extract stats from image. Please ensure the screenshot shows your Pokémon GO profile with visible stats.')
        setIsProcessingOCR(false)
        return
      }

      console.log(`✅ Successfully extracted ${statsCount} stat(s)`)

      // Validate extracted stats against current profile
      const currentStats = {
        total_xp: profile?.total_xp,
        pokemon_caught: profile?.pokemon_caught,
        distance_walked: profile?.distance_walked,
        pokestops_visited: profile?.pokestops_visited,
        unique_pokedex_entries: profile?.unique_pokedex_entries
      }
      
      const validation = validateExtractedStats(result.stats, currentStats)
      
      if (!validation.valid) {
        console.warn('⚠️ Validation warnings:', validation.errors)
        setOcrMessage(`⚠️ Warning: ${validation.errors.join(', ')}. Please verify the values.`)
      } else {
        console.log('✅ All extracted stats are valid')
        setOcrMessage('✅ Stats extracted successfully!')
      }

      // Auto-fill the form with extracted stats
      if (editData) {
        const updatedData = { ...editData }
        
        if (result.stats.total_xp !== undefined) {
          console.log(`✓ Total XP: ${result.stats.total_xp.toLocaleString()}`)
          updatedData.total_xp = result.stats.total_xp
        }
        
        if (result.stats.pokemon_caught !== undefined) {
          console.log(`✓ Pokémon Caught: ${result.stats.pokemon_caught.toLocaleString()}`)
          updatedData.pokemon_caught = result.stats.pokemon_caught
        }
        
        if (result.stats.distance_walked !== undefined) {
          console.log(`✓ Distance Walked: ${result.stats.distance_walked} km`)
          updatedData.distance_walked = result.stats.distance_walked
        }
        
        if (result.stats.pokestops_visited !== undefined) {
          console.log(`✓ PokéStops Visited: ${result.stats.pokestops_visited.toLocaleString()}`)
          updatedData.pokestops_visited = result.stats.pokestops_visited
        }
        
        if (result.stats.unique_pokedex_entries !== undefined) {
          console.log(`✓ Pokédex Entries: ${result.stats.unique_pokedex_entries}`)
          updatedData.unique_pokedex_entries = result.stats.unique_pokedex_entries
        }

        console.log('📝 Auto-filling form with extracted stats:', updatedData)
        setEditData(updatedData)
        setHasExtractedStats(true)
      }

      // Show success message (confidence logged to console only)
      setTimeout(() => {
        console.log(`✅ Extracted ${statsCount} stat(s) with ${Math.round(result.confidence)}% confidence`)
        setOcrMessage('✅ Stats extracted and auto-filled successfully!')
      }, 1000)

    } catch (err: any) {
      console.error('❌ OCR Error:', err)
      console.error('Error details:', err.message || err)
      setOcrMessage(`❌ Failed to extract stats: ${err.message || 'Unknown error'}. Please enter values manually.`)
    } finally {
      setIsProcessingOCR(false)
      setOcrProgress(100)
      console.log('🏁 OCR processing finished')
    }
  }

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [statChanges, setStatChanges] = useState<any[]>([])
  const [hasDecreasingStats, setHasDecreasingStats] = useState(false)
  
  // OCR state variables
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrMessage, setOcrMessage] = useState<string | null>(null)
  const [hasExtractedStats, setHasExtractedStats] = useState(false)

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
  
  // Clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleSave = async () => {
    if (!editData || !profile) return;

    // Build stat changes for review
    const changes = [];
    const decreasingStats = [];
    
    // Check Total XP
    if (editData.total_xp !== undefined && editData.total_xp !== profile.total_xp) {
      const newValue = parseFloat(editData.total_xp.toString());
      const oldValue = profile.total_xp || 0;
      const isDecrease = newValue < oldValue;
      if (isDecrease) decreasingStats.push('Total XP');
      changes.push({
        label: 'Total XP',
        oldValue: oldValue.toLocaleString(),
        newValue: newValue.toLocaleString(),
        isDecrease
      });
    }
    
    // Check Pokemon Caught
    if (editData.pokemon_caught !== undefined && editData.pokemon_caught !== profile.pokemon_caught) {
      const newValue = parseFloat(editData.pokemon_caught.toString());
      const oldValue = profile.pokemon_caught || 0;
      const isDecrease = newValue < oldValue;
      if (isDecrease) decreasingStats.push('Pokémon Caught');
      changes.push({
        label: 'Pokémon Caught',
        oldValue: oldValue.toLocaleString(),
        newValue: newValue.toLocaleString(),
        isDecrease
      });
    }
    
    // Check Distance Walked
    if (editData.distance_walked !== undefined && editData.distance_walked !== profile.distance_walked) {
      const newValue = parseFloat(editData.distance_walked.toString());
      const oldValue = profile.distance_walked || 0;
      const isDecrease = newValue < oldValue;
      if (isDecrease) decreasingStats.push('Distance Walked');
      changes.push({
        label: 'Distance Walked',
        oldValue: `${oldValue} km`,
        newValue: `${newValue} km`,
        isDecrease
      });
    }
    
    // Check Pokestops Visited
    if (editData.pokestops_visited !== undefined && editData.pokestops_visited !== profile.pokestops_visited) {
      const newValue = parseFloat(editData.pokestops_visited.toString());
      const oldValue = profile.pokestops_visited || 0;
      const isDecrease = newValue < oldValue;
      if (isDecrease) decreasingStats.push('Pokéstops Visited');
      changes.push({
        label: 'Pokéstops Visited',
        oldValue: oldValue.toLocaleString(),
        newValue: newValue.toLocaleString(),
        isDecrease
      });
    }
    
    // Check Pokedex Entries
    if (editData.unique_pokedex_entries !== undefined && editData.unique_pokedex_entries !== profile.unique_pokedex_entries) {
      const newValue = parseFloat(editData.unique_pokedex_entries.toString());
      const oldValue = profile.unique_pokedex_entries || 0;
      changes.push({
        label: 'Pokédex Entries',
        oldValue: oldValue.toLocaleString(),
        newValue: newValue.toLocaleString(),
        isDecrease: false // Pokedex can fluctuate
      });
    }
    
    // If no changes, don't proceed
    if (changes.length === 0) {
      setError('No changes detected. Please update at least one stat.');
      return;
    }

    // Check if screenshot is provided
    if (!selectedFile) {
      setError('Please upload a verification screenshot to update your stats');
        return;
    }
    
    // Show confirmation modal
    setStatChanges(changes);
    setHasDecreasingStats(decreasingStats.length > 0);
    setShowConfirmModal(true);
  };
  
  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    if (!editData || !profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Create updates object with only the changed stats
      const updates: any = {}
      
      // Convert to numbers for proper comparison
      if (editData.distance_walked !== profile.distance_walked) {
        updates.distance_walked = editData.distance_walked ? parseFloat(editData.distance_walked.toString()) : profile.distance_walked
      }
      if (editData.pokemon_caught !== profile.pokemon_caught) {
        updates.pokemon_caught = editData.pokemon_caught ? parseInt(editData.pokemon_caught.toString()) : profile.pokemon_caught
      }
      if (editData.pokestops_visited !== profile.pokestops_visited) {
        updates.pokestops_visited = editData.pokestops_visited ? parseInt(editData.pokestops_visited.toString()) : profile.pokestops_visited
      }
      if (editData.total_xp !== profile.total_xp) {
        updates.total_xp = editData.total_xp ? parseInt(editData.total_xp.toString()) : profile.total_xp
      }
      if (editData.unique_pokedex_entries !== profile.unique_pokedex_entries) {
        updates.unique_pokedex_entries = editData.unique_pokedex_entries ? parseInt(editData.unique_pokedex_entries.toString()) : profile.unique_pokedex_entries
      }

      // Use dashboardService.updateUserStats with verification screenshot
      // Pass true for acknowledgeError if user has decreasing stats (they already acknowledged in modal)
      const response = await dashboardService.updateUserStats(updates, selectedFile || undefined, hasDecreasingStats)
      
      if (response.success) {
        // Reload profile data
        await loadProfile()
        setSelectedFile(null)
        setSuccess('Stats updated successfully! Redirecting to your profile...')
        setError(null)

        // Show success message briefly then redirect
        setTimeout(() => {
          navigate('/UserProfile')
        }, 1500)
      } else {
        setError(response.message || 'Failed to update stats')
        setSuccess(null)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update stats');
    } finally {
      setSaving(false);
    }
  };
  
  const handleReviewChanges = () => {
    setShowConfirmModal(false);
    // Scroll to top to review inputs
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        {/* Success Message */}
        {success && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              width: "100%",
              padding: "12px 16px",
              backgroundColor: "#dcfce7",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: "#22c55e",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              ✓
            </div>
            <span
              style={{
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: 400,
                fontSize: isMobile ? "13px" : "12px",
                lineHeight: isMobile ? "18px" : "16px",
                color: "#166534",
              }}
            >
              {success}
            </span>
          </div>
        )}

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

          {/* Image Preview Section with OCR */}
          {imagePreview && !isProcessingOCR && !hasExtractedStats && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "12px",
                width: "100%",
                marginTop: "16px",
                padding: "16px",
                border: "2px solid #848282",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
              }}
            >
              <label
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 600,
                  fontSize: isMobile ? "14px" : "13px",
                  lineHeight: isMobile ? "21px" : "19px",
                  color: "#000000",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                📸 Selected Screenshot:
              </label>
              <div
                style={{
                  width: "100%",
                  maxWidth: "300px",
                  margin: "0 auto",
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
                    maxHeight: "250px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleExtractStats}
                style={{
                  width: "100%",
                  padding: isMobile ? "16px" : "18px",
                  background: "linear-gradient(135deg, #ff375f, #ff6b8a)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 600,
                  fontSize: isMobile ? "16px" : "18px",
                  lineHeight: isMobile ? "24px" : "27px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 15px rgba(255, 55, 95, 0.3)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 55, 95, 0.4)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(255, 55, 95, 0.3)"
                }}
              >
                <span style={{ fontSize: "28px" }}>🔍</span>
                <span>Extract Stats from Image</span>
                <span style={{ fontSize: isMobile ? "12px" : "13px", opacity: 0.9, fontWeight: 400 }}>
                  Click to analyze screenshot using OCR
                </span>
              </button>
            </div>
          )}

          {/* OCR Processing Indicator */}
          {isProcessingOCR && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                width: "100%",
                marginTop: "16px",
                padding: "24px",
                background: "linear-gradient(135deg, rgba(255, 55, 95, 0.1), rgba(255, 55, 95, 0.05))",
                border: "1px solid rgba(255, 55, 95, 0.3)",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  border: "4px solid rgba(255, 55, 95, 0.2)",
                  borderTopColor: "#ff375f",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "rgba(0, 0, 0, 0.1)",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${ocrProgress}%`,
                    background: "linear-gradient(90deg, #ff375f, #ff6b8a)",
                    borderRadius: "10px",
                    transition: "width 0.3s ease",
                    boxShadow: "0 0 10px rgba(255, 55, 95, 0.5)",
                  }}
                />
              </div>
              <p
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 500,
                  fontSize: isMobile ? "14px" : "15px",
                  color: "#000000",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                {ocrMessage} ({ocrProgress}%)
              </p>
            </div>
          )}

          {/* OCR Result Message */}
          {!isProcessingOCR && ocrMessage && (
            <div
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                marginTop: "12px",
                textAlign: "center",
                fontFamily: "Poppins",
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: 500,
                backgroundColor: ocrMessage.includes('✅') ? 'rgba(52, 199, 89, 0.15)' :
                  ocrMessage.includes('❌') ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 159, 10, 0.15)',
                border: `1px solid ${ocrMessage.includes('✅') ? 'rgba(52, 199, 89, 0.3)' :
                  ocrMessage.includes('❌') ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 159, 10, 0.3)'}`,
                color: ocrMessage.includes('✅') ? '#34c759' :
                  ocrMessage.includes('❌') ? '#ff3b30' : '#ff9f0a',
              }}
            >
              {ocrMessage}
            </div>
          )}

          {/* Extracted Stats Display */}
          {hasExtractedStats && editData && (
            <div
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "16px",
                background: "linear-gradient(135deg, rgba(52, 199, 89, 0.1), rgba(52, 199, 89, 0.05))",
                border: "2px solid rgba(52, 199, 89, 0.3)",
                borderRadius: "12px",
              }}
            >
              <h3
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: isMobile ? "16px" : "17px",
                  color: "#34c759",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                📊 Extracted Stats from Screenshot:
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
                  gap: "12px",
                }}
              >
                {editData.total_xp !== profile?.total_xp && (
                  <div style={{ padding: "12px", background: "rgba(0, 0, 0, 0.05)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "18px", marginBottom: "4px" }}>⭐</div>
                    <div style={{ fontFamily: "Poppins", fontSize: "11px", color: "#666", marginBottom: "4px" }}>Total XP</div>
                    <div style={{ fontFamily: "Poppins", fontSize: "16px", fontWeight: 600, color: "#000" }}>
                      {editData.total_xp?.toLocaleString()}
                    </div>
                  </div>
                )}
                {editData.pokemon_caught !== profile?.pokemon_caught && (
                  <div style={{ padding: "12px", background: "rgba(0, 0, 0, 0.05)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "18px", marginBottom: "4px" }}>🔴</div>
                    <div style={{ fontFamily: "Poppins", fontSize: "11px", color: "#666", marginBottom: "4px" }}>Pokémon Caught</div>
                    <div style={{ fontFamily: "Poppins", fontSize: "16px", fontWeight: 600, color: "#000" }}>
                      {editData.pokemon_caught?.toLocaleString()}
                    </div>
                  </div>
                )}
                {editData.distance_walked !== profile?.distance_walked && (
                  <div style={{ padding: "12px", background: "rgba(0, 0, 0, 0.05)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "18px", marginBottom: "4px" }}>👣</div>
                    <div style={{ fontFamily: "Poppins", fontSize: "11px", color: "#666", marginBottom: "4px" }}>Distance Walked</div>
                    <div style={{ fontFamily: "Poppins", fontSize: "16px", fontWeight: 600, color: "#000" }}>
                      {editData.distance_walked} km
                    </div>
                  </div>
                )}
                {editData.pokestops_visited !== profile?.pokestops_visited && (
                  <div style={{ padding: "12px", background: "rgba(0, 0, 0, 0.05)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "18px", marginBottom: "4px" }}>🔵</div>
                    <div style={{ fontFamily: "Poppins", fontSize: "11px", color: "#666", marginBottom: "4px" }}>PokéStops Visited</div>
                    <div style={{ fontFamily: "Poppins", fontSize: "16px", fontWeight: 600, color: "#000" }}>
                      {editData.pokestops_visited?.toLocaleString()}
                    </div>
                  </div>
                )}
                {editData.unique_pokedex_entries !== profile?.unique_pokedex_entries && (
                  <div style={{ padding: "12px", background: "rgba(0, 0, 0, 0.05)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "18px", marginBottom: "4px" }}>📖</div>
                    <div style={{ fontFamily: "Poppins", fontSize: "11px", color: "#666", marginBottom: "4px" }}>Pokédex Entries</div>
                    <div style={{ fontFamily: "Poppins", fontSize: "16px", fontWeight: 600, color: "#000" }}>
                      {editData.unique_pokedex_entries}
                    </div>
                  </div>
                )}
              </div>
              <p
                style={{
                  marginTop: "16px",
                  padding: "8px",
                  background: "rgba(52, 199, 89, 0.15)",
                  borderRadius: "6px",
                  fontFamily: "Poppins",
                  fontSize: isMobile ? "12px" : "13px",
                  color: "#34c759",
                  textAlign: "center",
                  border: "1px solid rgba(52, 199, 89, 0.3)",
                }}
              >
                ✅ These values have been automatically filled in the form fields above. Review and save!
              </p>
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
          {/* Error Message Display */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                marginBottom: "16px",
                padding: "12px 16px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                  backgroundColor: "#dc2626",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "bold",
                  flexShrink: 0,
                  }}
                >
                  !
                </div>
                <span
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "13px" : "12px",
                  lineHeight: isMobile ? "18px" : "16px",
                  color: "#7f1d1d",
                }}
              >
                {error}
              </span>
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
              disabled={saving || !selectedFile}
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
      
      {/* Stat Update Confirmation Modal */}
      <StatUpdateModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirmModal(false)}
        onReview={handleReviewChanges}
        changes={statChanges}
        hasDecreasingStats={hasDecreasingStats}
      />
      
      {/* Mobile Footer */}
      <MobileFooter currentPage="profile" />
    </div>
  )
}
