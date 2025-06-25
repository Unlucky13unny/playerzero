import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { type ProfileWithMetadata } from '../../services/profileService'

interface VisualExportProps {
  profile: ProfileWithMetadata | null
  isPaidUser: boolean
}

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

export const VisualExport = ({ profile, isPaidUser }: VisualExportProps) => {
  const navigate = useNavigate()
  const [exporting, setExporting] = useState(false)
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const exportCard = async () => {
    if (!cardRef.current || !profile) return

    setExporting(true)
    setDownloadMessage(null)

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        useCORS: true,
        allowTaint: true
      })

      // Download the image
      const link = document.createElement('a')
      link.download = `playerzero-stats-card.png`
      link.href = canvas.toDataURL()
      link.click()

      setDownloadMessage('Card downloaded successfully!')
      setTimeout(() => setDownloadMessage(null), 3000)
    } catch (error) {
      console.error('Export failed:', error)
      setDownloadMessage('Export failed. Please try again.')
      setTimeout(() => setDownloadMessage(null), 3000)
    } finally {
      setExporting(false)
    }
  }

  const handleUpgradeClick = () => {
    navigate('/upgrade')
  }

  const copyToClipboard = async () => {
    if (!cardRef.current || !profile) return

    setExporting(true)
    setDownloadMessage(null)

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        useCORS: true,
        allowTaint: true
      })

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ])
            setDownloadMessage('Card copied to clipboard!')
            setTimeout(() => setDownloadMessage(null), 3000)
          } catch (err) {
            console.error('Clipboard error:', err)
            setDownloadMessage('Clipboard not supported. Use download instead.')
            setTimeout(() => setDownloadMessage(null), 3000)
          }
        }
        setExporting(false)
      })
    } catch (error) {
      console.error('Export failed:', error)
      setDownloadMessage('Export failed. Please try again.')
      setTimeout(() => setDownloadMessage(null), 3000)
      setExporting(false)
    }
  }

  if (!isPaidUser) {
    return (
      <div className="locked-content">
        <div className="locked-icon">🔒</div>
        <h3 className="locked-title">Premium Feature</h3>
        <p className="locked-description">
          Upgrade to Premium to create and share beautiful stat cards with your community!
        </p>
        <button 
          className="upgrade-button"
          onClick={handleUpgradeClick}
        >
          Upgrade to Premium
        </button>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="visual-export-loading">
        <p>Loading profile data...</p>
      </div>
    )
  }

  // Get the selected team color and info
  const selectedTeam = TEAM_COLORS.find(team => team.value === profile.team_color) || TEAM_COLORS[5] // Default to orange
  
  // Determine text color based on team color for better contrast
  const getTextColor = (teamValue: string) => {
    switch (teamValue) {
      case 'yellow':
        return '#000000' // Black text for yellow background
      case 'black':
        return '#ffffff' // White text for black background
      default:
        return '#ffffff' // White text for other colors
    }
  }
  
  const textColor = getTextColor(selectedTeam.value)
  const accentColor = selectedTeam.color

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 16px'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#dc267f'
        }}>Visual Stat Export</h2>
        <p style={{
          fontSize: '16px',
          color: '#888888'
        }}>Create beautiful shareable cards from your stats</p>
      </div>

      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 0'
      }}>
        <div ref={cardRef} style={{
          background: `linear-gradient(135deg, ${accentColor}60, ${accentColor}30, ${selectedTeam.value === 'black' ? '#000000' : '#1a1a1a'})`,
          borderRadius: '24px',
          width: '500px',
          aspectRatio: '1/1',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px',
          gap: '24px',
          border: `3px solid ${accentColor}`,
          boxShadow: `0 8px 32px ${accentColor}40, inset 0 1px 0 rgba(255,255,255,0.1)`
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              margin: '0',
              color: textColor,
              textShadow: selectedTeam.value === 'yellow' ? `2px 2px 4px ${accentColor}80` : `2px 2px 4px rgba(0,0,0,0.8)`,
              letterSpacing: '1px'
            }}>
              {profile.trainer_name}
            </h2>
            <div style={{
              fontSize: '16px',
              color: textColor,
              textShadow: selectedTeam.value === 'yellow' ? `1px 1px 2px ${accentColor}60` : `1px 1px 2px rgba(0,0,0,0.8)`,
              opacity: 0.9
            }}>
              Level {profile.trainer_level} • {profile.country || 'Unknown Location'}
            </div>
            <div>
              <span style={{
                background: selectedTeam.value === 'yellow' ? '#000000' : selectedTeam.color,
                padding: '8px 16px',
                borderRadius: '20px',
                color: selectedTeam.value === 'yellow' ? selectedTeam.color : '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: `0 4px 12px ${accentColor}40`,
                border: selectedTeam.value === 'yellow' ? `2px solid ${selectedTeam.color}` : 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {selectedTeam.team}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginTop: 'auto'
          }}>
            <div style={{
              background: selectedTeam.value === 'yellow' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${accentColor}30`
            }}>
              <div style={{ 
                fontSize: '24px', 
                color: selectedTeam.value === 'yellow' ? '#000000' : textColor,
                marginBottom: '4px',
                textShadow: selectedTeam.value === 'yellow' ? 'none' : '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: '700'
              }}>
                {(profile.total_xp || 0).toLocaleString()}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: selectedTeam.value === 'yellow' ? accentColor : textColor,
                opacity: 0.9,
                textShadow: selectedTeam.value === 'yellow' ? 'none' : '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: '500'
              }}>Total XP</div>
            </div>
            <div style={{
              background: selectedTeam.value === 'yellow' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${accentColor}30`
            }}>
              <div style={{ 
                fontSize: '24px', 
                color: selectedTeam.value === 'yellow' ? '#000000' : textColor,
                marginBottom: '4px',
                textShadow: selectedTeam.value === 'yellow' ? 'none' : '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: '700'
              }}>
                {(profile.pokemon_caught || 0).toLocaleString()}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: selectedTeam.value === 'yellow' ? accentColor : textColor,
                opacity: 0.9,
                textShadow: selectedTeam.value === 'yellow' ? 'none' : '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: '500'
              }}>Pokémon Caught</div>
            </div>
            <div style={{
              background: selectedTeam.value === 'yellow' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${accentColor}30`
            }}>
              <div style={{ 
                fontSize: '24px', 
                color: selectedTeam.value === 'yellow' ? '#000000' : textColor,
                marginBottom: '4px',
                textShadow: selectedTeam.value === 'yellow' ? 'none' : '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: '700'
              }}>
                {(profile.distance_walked || 0).toFixed(1)}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: selectedTeam.value === 'yellow' ? accentColor : textColor,
                opacity: 0.9,
                textShadow: selectedTeam.value === 'yellow' ? 'none' : '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: '500'
              }}>km</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '16px',
            textAlign: 'left'
          }}>
            <div style={{
              color: selectedTeam.value === 'yellow' ? '#000000' : '#dc267f',
              fontSize: '20px',
              fontWeight: 'bold',
              textShadow: selectedTeam.value === 'yellow' ? 'none' : '1px 1px 2px rgba(0,0,0,0.8)',
              letterSpacing: '1px'
            }}>
              PlayerZERO
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        marginTop: '32px'
      }}>
        <button
          onClick={exportCard}
          disabled={exporting}
          style={{
            background: '#dc267f',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📥 {exporting ? 'Downloading...' : 'Download Image'}
        </button>
        <button
          onClick={copyToClipboard}
          disabled={exporting}
          style={{
            background: '#2a2a2a',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📋 {exporting ? 'Copying...' : 'Copy to Clipboard'}
        </button>
      </div>

      {downloadMessage && (
        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          color: '#22c55e',
          fontSize: '14px'
        }}>
          ✓ {downloadMessage}
        </div>
      )}
    </div>
  )
} 