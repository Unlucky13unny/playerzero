import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileService, type ProfileData, type ProfileWithMetadata } from '../../services/profileService'
import { dashboardService } from '../../services/dashboardService'
import { useMobile } from '../../hooks/useMobile'
import { MobileFooter } from '../layout/MobileFooter'
import { Upload, X } from 'lucide-react'
import { StatUpdateModal } from '../common/StatUpdateModal'
import { SuccessModal } from '../common/SuccessModal'
import { ErrorModal } from '../common/ErrorModal'
import { extractStatsFromImage, validateExtractedStats } from '../../utils/ocrService'
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
  
  // NEW: Upload mode selection modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadMode, setUploadMode] = useState<'manual' | 'extract' | null>(null)
  const [manualModeConfirmed, setManualModeConfirmed] = useState(false)
  const [_extractModeConfirmed, setExtractModeConfirmed] = useState(false)

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

  // NEW: Handle opening the upload mode selection modal
  const handleOpenUploadModal = () => {
    setShowUploadModal(true)
    // If already in manual mode and have a file, don't reset
    if (!manualModeConfirmed) {
      setUploadMode(null)
    }
    // Immediately trigger file upload if no file selected yet
    if (!selectedFile) {
      setTimeout(() => {
        const fileInput = document.getElementById('screenshot-upload') as HTMLInputElement
        if (fileInput) {
          fileInput.click()
        }
      }, 100)
    }
  }

  // NEW: Handle manual entry mode selection
  const handleSelectManualMode = () => {
    // Just toggle the mode - don't confirm yet
    setUploadMode('manual')
    setManualModeConfirmed(false)
    setExtractModeConfirmed(false)
    setOcrMessage(null)
    setHasExtractedStats(false)
  }

  // NEW: Handle direct extract mode selection
  const handleSelectExtractMode = () => {
    // Just toggle the mode - don't confirm yet
    setUploadMode('extract')
    setExtractModeConfirmed(false)
    setManualModeConfirmed(false)
    setOcrMessage(null)
    setHasExtractedStats(false)
  }
  
  // NEW: Confirm extract mode and trigger OCR
  const handleConfirmExtractMode = async () => {
    setExtractModeConfirmed(true)
    setShowUploadModal(false)
    if (selectedFile) {
      await processOCR(selectedFile)
    }
  }

  // NEW: Confirm manual mode and close modal
  const handleConfirmManualMode = () => {
    setManualModeConfirmed(true)
    setShowUploadModal(false)
    // Keep uploadMode as 'manual' and file attached
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // NEW: Close upload modal
  const handleCloseUploadModal = () => {
    setShowUploadModal(false)
    // Reset if user cancels
    if (!manualModeConfirmed && uploadMode !== 'extract') {
      setUploadMode(null)
      setSelectedFile(null)
    }
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
      console.log('✅ Preview ready. Choose extraction method from toggle buttons.')
    }
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
        setIsProcessingOCR(false)
        setShowOCRErrorModal(true)
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

      // Store extracted stats and show review modal
      console.log('📝 Storing extracted stats for review')
      setExtractedStatsData(result.stats)
        setHasExtractedStats(true)

      // Show review modal after a brief delay
      setTimeout(() => {
        console.log(`✅ Extracted ${statsCount} stat(s) with ${Math.round(result.confidence)}% confidence`)
        setShowReviewModal(true)
      }, 500)

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
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [statChanges, setStatChanges] = useState<any[]>([])
  const [hasDecreasingStats, setHasDecreasingStats] = useState(false)
  
  // OCR state variables
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [_ocrMessage, setOcrMessage] = useState<string | null>(null)
  const [_hasExtractedStats, setHasExtractedStats] = useState(false)
  
  // NEW: Review modal state for extracted stats
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [extractedStatsData, setExtractedStatsData] = useState<any>(null)
  
  // NEW: Reminder modal state for secondary stats
  const [showReminderModal, setShowReminderModal] = useState(false)
  // OCR Error modal state
  const [showOCRErrorModal, setShowOCRErrorModal] = useState(false)

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
      const isDecrease = newValue < oldValue;
      if (isDecrease) decreasingStats.push('Pokédex Entries');
      changes.push({
        label: 'Pokédex Entries',
        oldValue: oldValue.toLocaleString(),
        newValue: newValue.toLocaleString(),
        isDecrease
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
        setError(null)

        // Show success modal
        setShowSuccessModal(true)
      } else {
        setError(response.message || 'Failed to update stats')
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

            {/* Upload new screenshot - NEW: Opens mode selection modal */}
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
              <button
                type="button"
                onClick={handleOpenUploadModal}
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
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#555"
                  e.currentTarget.style.backgroundColor = "#f9f9f9"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#848282"
                  e.currentTarget.style.backgroundColor = "#FFFFFF"
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
                  Choose upload method
                </span>
              </button>
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
                {selectedFile ? `✓ ${selectedFile.name}` : "Manual entry or OCR extraction"}
              </span>
            </div>

            {/* Hidden file input for direct extraction mode */}
            <input
              type="file"
              id="screenshot-upload"
              onChange={handleStatsFileChange}
              accept="image/*"
              style={{ display: "none" }}
            />
          </div>

          {/* OCR Processing Indicator - Figma: Frame 754 */}
          {isProcessingOCR && (
            <div
              style={{
                boxSizing: "border-box",
                
                // Auto layout
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "16px 8px",
                gap: "10px",
                
                width: isMobile ? "353px" : "100%",
                height: "60px",
                
                border: "0.5px solid #DC2627",
                borderRadius: "6px",
                
                // Inside auto layout
                flex: "none",
                order: 2,
                alignSelf: "stretch",
                flexGrow: 0,
                
                marginTop: "16px",
              }}
            >
              {/* Progress component */}
              <div
                style={{
                  // Auto layout
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "0px",
                  gap: "8px",
                  
                  width: isMobile ? "337px" : "calc(100% - 16px)",
                  height: "28px",
                  
                  // Inside auto layout
                  flex: "none",
                  order: 0,
                  alignSelf: "stretch",
                  flexGrow: 0,
                }}
              >
                {/* Progress percentage text */}
              <div
                style={{
                    width: isMobile ? "173px" : "auto",
                    height: "16px",
                  fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "16px",
                    textAlign: "right",
                    color: "#90A1B9",
                    
                    // Inside auto layout
                    flex: "none",
                    order: 0,
                    flexGrow: 0,
                    
                    alignSelf: "flex-end",
                  }}
                >
                  {ocrProgress}%
            </div>

                {/* Progress bar container */}
            <div
              style={{
                    position: "relative",
                    width: isMobile ? "337px" : "100%",
                    height: "4px",
                    
                    // Inside auto layout
                    flex: "none",
                    order: 1,
                    alignSelf: "stretch",
                    flexGrow: 0,
                  }}
                >
                  {/* BG (background bar) */}
            <div
              style={{
                      position: "absolute",
                      height: "4px",
                      left: "0%",
                      right: "0%",
                      top: "0px",
                      
                      background: "#E2E8F0",
                      borderRadius: "999px",
                    }}
                  />
                  
                  {/* Progress (filled portion) */}
              <div
                style={{
                      position: "absolute",
                      height: "4px",
                      left: "0%",
                      right: `${100 - ocrProgress}%`,
                      top: "0px",
                      
                      background: "#FB2C36",
                      borderRadius: "999px",
                      transition: "right 0.3s ease",
                    }}
                  />
                    </div>
                    </div>
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

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          navigate('/UserProfile')
        }}
        title="SUCCESS!"
        message="Stats updated successfully"
        confirmText="Okay"
      />

      {/* OCR Error Modal */}
      <ErrorModal
        isOpen={showOCRErrorModal}
        onClose={() => setShowOCRErrorModal(false)}
        title="Failed to extract stats"
        message="Failed to extract stats from image. Please enter stats manually"
        confirmText="Okay"
      />

      {/* NEW: Upload Mode Selection Modal - Figma Design */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          {/* Modal Container - Figma: New Upload */}
          <div style={{
            // Exact Figma specs
            position: 'relative',
            width: isMobile ? '353px' : '400px',
            height: selectedFile 
              ? (uploadMode === 'manual' && manualModeConfirmed 
                  ? (isMobile ? '540px' : '600px')  // Confirmation view height
                  : (isMobile ? '613px' : '680px'))  // Image preview height
              : (isMobile ? '241px' : '280px'), // Original height
            
            // Background - Figma: bg (White)
            background: '#FFFFFF',
            borderRadius: '24px',
            
            // Filter/Shadow from Figma
            filter: 'drop-shadow(0px 0px 48px rgba(0, 0, 0, 0.04))',
            boxSizing: 'border-box',
            transition: 'height 0.3s ease', // Smooth transition
          }}>
            {/* Toggle Section - Figma: Toggle */}
            <div
              style={{
                // Auto layout
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                padding: '4px 5px',
                gap: '4px',
                
                // Positioning - Exact Figma specs
                position: 'absolute',
                width: isMobile ? '266px' : '300px',
                height: '36px',
                left: isMobile ? 'calc(50% - 266px/2 + 0.5px)' : 'calc(50% - 300px/2)',
                top: '16px',
                
                // Grey 01 background
                background: '#F7F9FB',
                boxShadow: 'inset 0px 0px 2px rgba(0, 0, 0, 0.1)',
                borderRadius: '40px',
              }}
            >
              {/* Extract Stats Button */}
              <button
                type="button"
                onClick={handleSelectExtractMode}
                disabled={!selectedFile}
                style={{
                  // Auto layout
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '7px 20px',
                  gap: '10px',
                  
                  // Exact Figma size
                  width: '114px',
                  height: '28px',
                  
                  // Style - Red when extract mode selected, grey otherwise
                  background: !selectedFile ? '#E5E7EB' : (uploadMode === 'extract' ? '#000000' : '#F7F9FB'),
                  borderRadius: '40px',
                  border: 'none',
                  
                  // Inside auto layout
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  
                  cursor: !selectedFile ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: !selectedFile ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (selectedFile && uploadMode !== 'extract') {
                    e.currentTarget.style.background = '#EBEFF2'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedFile) {
                    e.currentTarget.style.background = uploadMode === 'extract' ? '#000000' : '#F7F9FB'
                  }
                }}
              >
                <span style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '14px',
                  textAlign: 'center',
                  color: !selectedFile ? '#9CA3AF' : (uploadMode === 'extract' ? '#FFFFFF' : '#000000'),
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  Extract stats
                </span>
              </button>

              {/* Update Manually Button */}
              <button
                type="button"
                onClick={handleSelectManualMode}
                disabled={!selectedFile}
                style={{
                  // Auto layout
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '7px 20px',
                  gap: '10px',
                  
                  // Exact Figma size
                  width: '138px',
                  height: '28px',
                  
                  // Style - Black when manual mode selected, grey otherwise
                  background: uploadMode === 'manual' ? '#000000' : '#F7F9FB',
                  borderRadius: '40px',
                  border: 'none',
                  
                  // Inside auto layout
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                  
                  cursor: !selectedFile ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: !selectedFile ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (selectedFile && uploadMode !== 'manual') {
                    e.currentTarget.style.background = '#EBEFF2'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedFile) {
                    e.currentTarget.style.background = uploadMode === 'manual' ? '#000000' : '#F7F9FB'
                  }
                }}
              >
                <span style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '14px',
                  textAlign: 'center',
                  color: !selectedFile ? '#9CA3AF' : (uploadMode === 'manual' ? '#FFFFFF' : '#000000'),
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  Update manually
                </span>
              </button>
            </div>

            {/* Divider Line - Figma: li (Grey 02) */}
            <div
              style={{
                position: 'absolute',
                height: '1px',
                left: '0px',
                right: '0px',
                top: '68px',
                background: '#EBEFF2',
              }}
            />

            {/* Content Area - Figma: Drag Area (Flat Grey) */}
            <div
              style={{
                // Auto layout
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '32px',
                gap: '10px',
                
                // Positioning
                position: 'absolute',
                left: '0px',
                right: '0px',
                top: '68px',
                bottom: '0px',
                
                // Style - Flat Grey
                background: '#F8F8F8',
                borderRadius: '0px 0px 24px 24px',
                boxSizing: 'border-box',
              }}
            >
              {selectedFile && imagePreview ? (
                uploadMode === 'manual' ? (
                  // Manual Mode Confirmation View - Exact CSS from design
                  <div
                    style={{
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '0px 32px',
                      gap: '8px',
                      width: '289px',
                      height: '481px',
                      border: '2px dashed #E2E6EA',
                      borderRadius: '24px',
                      flex: 'none',
                      order: 0,
                      alignSelf: 'stretch',
                      flexGrow: 1,
                    }}
                  >
                    {/* "Selected image" label - Exact CSS */}
                    <div
                      style={{
                        width: '225px',
                        height: '21px',
                        fontFamily: 'Poppins',
                        fontStyle: 'normal',
                        fontWeight: 500,
                        fontSize: '14px',
                        lineHeight: '21px',
                        textAlign: 'center',
                        color: '#242634',
                        opacity: 0.5,
                        flex: 'none',
                        order: 0,
                        alignSelf: 'stretch',
                        flexGrow: 0,
                      }}
                    >
                      Selected image
                    </div>

                    {/* thumb - Image display - Exact CSS */}
                    <div
                      style={{
                        width: '181px',
                        height: '356px',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        flex: 'none',
                        order: 1,
                        flexGrow: 0,
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="Screenshot preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>

                    {/* Frame 760 - Button container - Exact CSS */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '0px',
                        gap: '4px',
                        width: '225px',
                        height: '50px',
                        flex: 'none',
                        order: 2,
                        alignSelf: 'stretch',
                        flexGrow: 0,
                      }}
                    >
                      {/* "Update stats manually" button - Exact CSS */}
                      <button
                        type="button"
                        onClick={handleConfirmManualMode}
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          padding: '7px 20px',
                          gap: '10px',
                          width: '179px',
                          height: '28px',
                          background: '#DB161B',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          flex: 'none',
                          order: 0,
                          flexGrow: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#B91C1C'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#DB161B'
                        }}
                      >
                        {/* Label - Exact CSS */}
                        <span
                          style={{
                            width: '139px',
                            height: '14px',
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 600,
                            fontSize: '11px',
                            lineHeight: '14px',
                            textAlign: 'center',
                            color: '#FFFFFF',
                            flex: 'none',
                            order: 0,
                            flexGrow: 0,
                          }}
                        >
                          Update stats manually
                        </span>
                      </button>

                      {/* Helper text - Exact CSS */}
                      <div
                        style={{
                          width: '225px',
                          height: '18px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '18px',
                          textAlign: 'center',
                          color: '#242634',
                          opacity: 0.5,
                          flex: 'none',
                          order: 1,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        Click to manually update the stats
                      </div>
                    </div>
                  </div>
                ) : uploadMode === 'extract' ? (
                  // Extract Mode Confirmation View - Exact CSS from design
                  <div
                    style={{
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '0px 32px',
                      gap: '8px',
                      width: '289px',
                      height: '481px',
                      border: '2px dashed #E2E6EA',
                      borderRadius: '24px',
                      flex: 'none',
                      order: 0,
                      alignSelf: 'stretch',
                      flexGrow: 1,
                    }}
                  >
                    {/* "Selected image" label - Exact CSS */}
                    <div
                      style={{
                        width: '225px',
                        height: '21px',
                        fontFamily: 'Poppins',
                        fontStyle: 'normal',
                        fontWeight: 500,
                        fontSize: '14px',
                        lineHeight: '21px',
                        textAlign: 'center',
                        color: '#242634',
                        opacity: 0.5,
                        flex: 'none',
                        order: 0,
                        alignSelf: 'stretch',
                        flexGrow: 0,
                      }}
                    >
                      Selected image
                    </div>

                    {/* thumb - Image display - Exact CSS */}
                    <div
                      style={{
                        width: '181px',
                        height: '356px',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        flex: 'none',
                        order: 1,
                        flexGrow: 0,
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="Screenshot preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>

                    {/* Frame 760 - Button container - Exact CSS */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '0px',
                        gap: '4px',
                        width: '225px',
                        height: '50px',
                        flex: 'none',
                        order: 2,
                        alignSelf: 'stretch',
                        flexGrow: 0,
                      }}
                    >
                      {/* "Extract stats" button - Exact CSS */}
                      <button
                        type="button"
                        onClick={handleConfirmExtractMode}
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: '7px 20px',
                          gap: '10px',
                          width: '179px',
                          height: '28px',
                          background: '#DB161B',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          flex: 'none',
                          order: 0,
                          flexGrow: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#B91C1C'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#DB161B'
                        }}
                      >
                        {/* Label - Exact CSS */}
                        <span
                          style={{
                            width: '165px',
                            height: '14px',
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 600,
                            fontSize: '11px',
                            lineHeight: '14px',
                            textAlign: 'center',
                            color: '#FFFFFF',
                            flex: 'none',
                            order: 0,
                            flexGrow: 0,
                          }}
                        >
                          Extract stats from the image
                        </span>
                      </button>

                      {/* Helper text - Exact CSS */}
                      <div
                        style={{
                          width: '225px',
                          height: '18px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '18px',
                          textAlign: 'center',
                          color: '#242634',
                          opacity: 0.5,
                          flex: 'none',
                          order: 1,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        Click to extract stats automatically
                      </div>
                    </div>
                  </div>
                ) : (
                  // Image Preview Mode - Figma: Wrap with content
                  <div
                    style={{
                      boxSizing: 'border-box',
                      
                      // Auto layout
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '0px 32px',
                      gap: '8px',
                      
                      // Exact Figma size for Wrap
                      width: isMobile ? '289px' : '336px',
                      height: isMobile ? '481px' : '560px',
                      
                      // Style - Grey 03 dashed border
                      border: '2px dashed #E2E6EA',
                      borderRadius: '24px',
                      background: '#FFFFFF',
                      
                      // Inside auto layout
                      flex: 'none',
                      order: 0,
                      alignSelf: 'stretch',
                      flexGrow: 1,
                    }}
                  >
                    {/* "Selected image" label - Figma specs */}
                    <div
                      style={{
                        width: isMobile ? '225px' : '272px',
                        height: '21px',
                        fontFamily: 'Poppins',
                        fontStyle: 'normal',
                        fontWeight: 500,
                        fontSize: '14px',
                        lineHeight: '21px',
                        textAlign: 'center',
                        color: '#242634',
                        opacity: 0.5,
                        flex: 'none',
                        order: 0,
                        alignSelf: 'stretch',
                        flexGrow: 0,
                      }}
                    >
                      Selected image
                    </div>

                    {/* Image Container - Figma: thumb with rounded corners */}
                    <div
                      style={{
                        width: isMobile ? '181px' : '220px',
                        height: isMobile ? '356px' : '420px',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 'none',
                        order: 1,
                        flexGrow: 0,
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="Screenshot preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                    
                    {/* Frame 760 - Button container */}
                    <div
                      style={{
                        // Auto layout
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '0px',
                        gap: '4px',
                        
                        width: isMobile ? '225px' : '272px',
                        height: '50px',
                        
                        // Inside auto layout
                        flex: 'none',
                        order: 2,
                        alignSelf: 'stretch',
                        flexGrow: 0,
                      }}
                    >
                      {/* Instructions text */}
                      <div
                        style={{
                          width: isMobile ? '225px' : '272px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '18px',
                          textAlign: 'center',
                          color: '#242634',
                          opacity: 0.7,
                          flex: 'none',
                          order: 1,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        Choose "Extract stats" to auto-fill with OCR, or "Update manually" to enter values yourself
                      </div>
                    </div>
                  </div>
                )
              ) : (
                // Dashed Upload Box (Original)
                <div
                  style={{
                    boxSizing: 'border-box',
                    
                    // Auto layout
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '0px 32px',
                    
                    // Size
                    width: '100%',
                    flex: 1,
                    
                    // Style
                    border: '2px dashed #E2E6EA',
                    borderRadius: '24px',
                    background: '#FFFFFF',
                    margin: '16px',
                    
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#DC2627'
                    e.currentTarget.style.background = 'rgba(220, 38, 39, 0.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2E6EA'
                    e.currentTarget.style.background = '#FFFFFF'
                  }}
                  onClick={() => {
                    const fileInput = document.getElementById('screenshot-upload') as HTMLInputElement
                    if (fileInput) fileInput.click()
                  }}
                >
                  {/* Text - Figma specs */}
                  <p
                    style={{
                      // Typography - Figma specs
                      fontFamily: 'Poppins',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '21px',
                      textAlign: 'center',
                      
                      // Color - Grey 05
                      color: '#242634',
                      opacity: 0.5,
                      
                      // Reset
                      margin: 0,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    upload a screenshot.

                  </p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleCloseUploadModal}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
            >
              <X size={20} color="#6b7280" />
            </button>
          </div>
        </div>
      )}

      {/* NEW: Review Stats Update Modal - Figma Design */}
      {showReviewModal && extractedStatsData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          {/* Modal Container - Figma: New Upload */}
          <div style={{
            // Exact Figma specs
            position: 'relative',
            width: isMobile ? '353px' : '400px',
            height: isMobile ? '459px' : '520px',
            
            // Background - Figma: bg (White)
            background: '#FFFFFF',
            borderRadius: '24px',
            
            // Filter/Shadow from Figma
            filter: 'drop-shadow(0px 0px 48px rgba(0, 0, 0, 0.04))',
            boxSizing: 'border-box',
          }}>
            {/* Drag Area - Figma: Flat Grey background */}
            <div
              style={{
                // Auto layout
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '32px',
                gap: '10px',
                
                // Positioning
                position: 'absolute',
                left: '0px',
                right: '0px',
                top: '0px',
                bottom: '0px',
                
                // Style - Flat Grey
                background: '#F8F8F8',
                borderRadius: '24px',
                boxSizing: 'border-box',
              }}
            >
              {/* Frame 756 - Main content container */}
              <div
                style={{
                  // Auto layout
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0px',
                  gap: '17px',
                  
                  position: 'absolute',
                  width: isMobile ? '310px' : '350px',
                  height: isMobile ? '399px' : '450px',
                  left: isMobile ? 'calc(50% - 310px/2 + 0.5px)' : 'calc(50% - 350px/2)',
                  top: '36px',
                }}
              >
                {/* Title: "Extracted files from image" */}
                <div
                  style={{
                    width: '100%',
                    height: '30px',
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    fontSize: '20px',
                    lineHeight: '30px',
                    textAlign: 'center',
                    color: '#000000',
                    flex: 'none',
                    order: 0,
                    alignSelf: 'stretch',
                    flexGrow: 0,
                  }}
                >
                  Extracted files from image
                </div>

                {/* Frame 755 - Stats fields container */}
                <div
                  style={{
                    // Auto layout
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0px',
                    gap: '8px',
                    
                    width: '100%',
                      
                      // Inside auto layout
                    flex: 'none',
                    order: 1,
                    alignSelf: 'stretch',
                    flexGrow: 0,
                  }}
                >
                  {/* Distance Walked */}
                  {extractedStatsData.distance_walked !== undefined && (
                    <div
                      style={{
                        // Frame 665
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '0px',
                        gap: '2px',
                        width: '100%',
                      flex: 'none',
                      order: 0,
                      alignSelf: 'stretch',
                      flexGrow: 0,
                    }}
                  >
                      <div
                        style={{
                          width: '100%',
                          height: '17px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 400,
                          fontSize: '11px',
                          lineHeight: '16px',
                          color: '#000000',
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        Distance Walked
                      </div>
                      <div
                        style={{
                          boxSizing: 'border-box',
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '9px',
                          gap: '10px',
                          width: '100%',
                          height: '36px',
                          border: '1px solid #848282',
                          borderRadius: '6px',
                          flex: 'none',
                          order: 1,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 400,
                            fontSize: '12px',
                            lineHeight: '18px',
                            color: '#000000',
                            flex: 'none',
                            order: 0,
                            flexGrow: 0,
                          }}
                        >
                          {extractedStatsData.distance_walked}
                        </span>
                        <span
                          style={{
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 400,
                            fontSize: '12px',
                            lineHeight: '18px',
                            color: '#000000',
                            flex: 'none',
                            order: 1,
                            flexGrow: 0,
                          }}
                        >
                          km
                        </span>
                      </div>
                </div>
              )}

                  {/* Pokémon Caught */}
                  {extractedStatsData.pokemon_caught !== undefined && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '0px',
                        gap: '2px',
                        width: '100%',
                        flex: 'none',
                        order: 1,
                        alignSelf: 'stretch',
                        flexGrow: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '17px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 400,
                          fontSize: '11px',
                          lineHeight: '16px',
                          color: '#000000',
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        Pokémon Caught
                      </div>
                      <div
                        style={{
                          boxSizing: 'border-box',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: '9px',
                          gap: '10px',
                          width: '100%',
                          height: '36px',
                          border: '1px solid #848282',
                          borderRadius: '6px',
                          flex: 'none',
                          order: 1,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 400,
                            fontSize: '12px',
                            lineHeight: '18px',
                            color: '#000000',
                            flex: 'none',
                            order: 0,
                            flexGrow: 0,
                          }}
                        >
                          {extractedStatsData.pokemon_caught.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Pokéstops Visited */}
                  {extractedStatsData.pokestops_visited !== undefined && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '0px',
                        gap: '2px',
                        width: '100%',
                        flex: 'none',
                        order: 2,
                        alignSelf: 'stretch',
                        flexGrow: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '17px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 400,
                          fontSize: '11px',
                          lineHeight: '16px',
                          color: '#000000',
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        Pokéstops Visited
                      </div>
                      <div
                        style={{
                          boxSizing: 'border-box',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: '9px',
                          gap: '10px',
                          width: '100%',
                          height: '36px',
                          border: '1px solid #848282',
                          borderRadius: '6px',
                          flex: 'none',
                          order: 1,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 400,
                            fontSize: '12px',
                            lineHeight: '18px',
                            color: '#000000',
                            flex: 'none',
                            order: 0,
                            flexGrow: 0,
                          }}
                        >
                          {extractedStatsData.pokestops_visited.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Total XP */}
                  {extractedStatsData.total_xp !== undefined && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '0px',
                        gap: '2px',
                        width: '100%',
                        flex: 'none',
                        order: 3,
                        alignSelf: 'stretch',
                        flexGrow: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '17px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 400,
                          fontSize: '11px',
                          lineHeight: '16px',
                          color: '#000000',
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        Total XP
                      </div>
                      <div
                        style={{
                          boxSizing: 'border-box',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: '9px',
                          gap: '10px',
                          width: '100%',
                          height: '36px',
                          border: '1px solid #848282',
                          borderRadius: '6px',
                          flex: 'none',
                          order: 1,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 400,
                            fontSize: '12px',
                            lineHeight: '18px',
                            color: '#000000',
                            flex: 'none',
                            order: 0,
                            flexGrow: 0,
                          }}
                        >
                          {extractedStatsData.total_xp.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description text */}
                <div
                  style={{
                    width: '100%',
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '18px',
                    textAlign: 'center',
                    color: '#636874',
                    flex: 'none',
                    order: 2,
                    flexGrow: 0,
                  }}
                >
                  These values have been automatically field in the form fields above. Review and confirm!
                </div>

                {/* Frame 215 - Buttons container */}
                <div
                  style={{
                    // Auto layout
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: '0px',
                    gap: '8px',
                    
                    width: isMobile ? '189px' : '200px',
                    height: '38px',
                    
                    // Inside auto layout
                    flex: 'none',
                    order: 3,
                    flexGrow: 0,
                  }}
                >
                  {/* Confirm Button */}
                  <button
                    type="button"
                    onClick={() => {
                      // Apply extracted stats to editData
                      if (editData) {
                        const updatedData = { ...editData }
                        if (extractedStatsData.total_xp !== undefined) updatedData.total_xp = extractedStatsData.total_xp
                        if (extractedStatsData.pokemon_caught !== undefined) updatedData.pokemon_caught = extractedStatsData.pokemon_caught
                        if (extractedStatsData.distance_walked !== undefined) updatedData.distance_walked = extractedStatsData.distance_walked
                        if (extractedStatsData.pokestops_visited !== undefined) updatedData.pokestops_visited = extractedStatsData.pokestops_visited
                        if (extractedStatsData.unique_pokedex_entries !== undefined) updatedData.unique_pokedex_entries = extractedStatsData.unique_pokedex_entries
                        setEditData(updatedData)
                      }
                      setShowReviewModal(false)
                      // Show reminder modal
                      setShowReminderModal(true)
                    }}
                    style={{
                      // Auto layout
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '8px 16px',
                      gap: '10px',
                      
                      width: isMobile ? '95px' : '100px',
                      height: '38px',
                      
                      background: '#DC2627',
                      borderRadius: '6px',
                      border: 'none',
                      
                      // Inside auto layout
                      flex: 'none',
                      order: 0,
                      flexGrow: 0,
                      
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#B91C1C'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#DC2627'
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Poppins',
                        fontStyle: 'normal',
                        fontWeight: 600,
                        fontSize: '15px',
                        lineHeight: '23px',
                        color: '#FFFFFF',
                        flex: 'none',
                        order: 0,
                        flexGrow: 0,
                      }}
                    >
                      Confirm
                    </span>
                  </button>

                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewModal(false)
                      setExtractedStatsData(null)
                      setHasExtractedStats(false)
                    }}
                    style={{
                      boxSizing: 'border-box',
                      
                      // Auto layout
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '8px 16px',
                      gap: '10px',
                      
                      width: isMobile ? '86px' : '92px',
                      height: '38px',
                      
                      border: '1px solid #636874',
                      borderRadius: '6px',
                      background: 'transparent',
                      
                      // Inside auto layout
                      flex: 'none',
                      order: 1,
                      flexGrow: 0,
                      
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 104, 116, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Poppins',
                        fontStyle: 'normal',
                        fontWeight: 600,
                        fontSize: '15px',
                        lineHeight: '23px',
                        color: '#636874',
                        flex: 'none',
                        order: 0,
                        flexGrow: 0,
                      }}
                    >
                      Cancel
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowReviewModal(false)
                setExtractedStatsData(null)
                setHasExtractedStats(false)
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
            >
              <X size={20} color="#6b7280" />
            </button>
          </div>
        </div>
      )}

      {/* NEW: Reminder Modal - Don't forget to update Secondary Stats */}
      {showReminderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px',
        }}>
          {/* Modal Container - Figma: Submit */}
          <div style={{
            position: 'relative',
            width: isMobile ? '356px' : '400px',
            height: '158px',
            
            background: '#FFFFFF',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
            borderRadius: '20px',
          }}>
            {/* Frame 214 - Content container */}
            <div
              style={{
                // Auto layout
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0px',
                gap: '24px',
                
                position: 'absolute',
                width: isMobile ? '355px' : '390px',
                height: '116px',
                left: isMobile ? 'calc(50% - 355px/2 + 0.5px)' : 'calc(50% - 390px/2)',
                top: 'calc(50% - 116px/2 - 0.63px)',
              }}
            >
              {/* Group 225 - Message text */}
              <div
                style={{
                  width: isMobile ? '330px' : '360px',
                  height: '54px',
                  
                  // Inside auto layout
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '54px',
                    left: 'calc(50% - 330px/2)',
                    top: '0px',
                    
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: 500,
                    fontSize: '18px',
                    lineHeight: '27px',
                    textAlign: 'center',
                    
                    color: '#000000',
                    
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Don't forget to update Secondary Stats
                </div>
              </div>

              {/* Frame 215 - Button container */}
              <div
                style={{
                  // Auto layout
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: '0px',
                  gap: '8px',
                  
                  width: '152px',
                  height: '38px',
                  
                  // Inside auto layout
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                }}
              >
                {/* Okay Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowReminderModal(false)
                    // Scroll to save button
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
                  }}
                  style={{
                    // Auto layout
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '8px 16px',
                    gap: '10px',
                    
                    width: '152px',
                    height: '38px',
                    
                    background: '#DC2627',
                    borderRadius: '6px',
                    border: 'none',
                    
                    // Inside auto layout
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                    
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#B91C1C'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#DC2627'
                  }}
                >
                  <span
                    style={{
                      width: '40px',
                      height: '23px',
                      fontFamily: 'Poppins',
                      fontStyle: 'normal',
                      fontWeight: 600,
                      fontSize: '15px',
                      lineHeight: '23px',
                      color: '#FFFFFF',
                      flex: 'none',
                      order: 0,
                      flexGrow: 0,
                    }}
                  >
                    Okay
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Footer */}
      <MobileFooter currentPage="profile" />
    </div>
  )
}
