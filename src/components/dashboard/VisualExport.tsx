import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import { type ProfileWithMetadata } from '../../services/profileService'

interface VisualExportProps {
  profile: ProfileWithMetadata | null
  isPaidUser: boolean
}

export const VisualExport = ({ profile, isPaidUser }: VisualExportProps) => {
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
        <button className="upgrade-button">
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
          backgroundImage: 'url(/images/achievement.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '24px',
          width: '500px',
          aspectRatio: '1/1',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px',
          gap: '24px'
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
              color: '#ffffff',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
              {profile.trainer_name}
            </h2>
            <div style={{
              fontSize: '16px',
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}>
              Level {profile.trainer_level} • {profile.country || 'Unknown Location'}
            </div>
            <div>
              <span style={{
                background: '#ff851b',
                padding: '6px 12px',
                borderRadius: '16px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                Team Orange
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
              background: 'rgba(0,0,0,0.75)',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{ 
                fontSize: '24px', 
                color: '#ffffff', 
                marginBottom: '4px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}>
                {(profile.total_xp || 0).toLocaleString()}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#ffffff',
                opacity: 0.8,
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}>Total XP</div>
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.75)',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{ 
                fontSize: '24px', 
                color: '#ffffff', 
                marginBottom: '4px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}>
                {(profile.pokemon_caught || 0).toLocaleString()}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#ffffff',
                opacity: 0.8,
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}>Pokémon Caught</div>
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.75)',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{ 
                fontSize: '24px', 
                color: '#ffffff', 
                marginBottom: '4px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}>
                {(profile.distance_walked || 0).toFixed(1)}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#ffffff',
                opacity: 0.8,
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}>km</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '16px',
            textAlign: 'left'
          }}>
            <div style={{
              color: '#dc267f',
              fontSize: '20px',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
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