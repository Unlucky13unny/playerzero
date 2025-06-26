import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import type { ProfileWithMetadata } from '../../services/profileService'

interface VisualExportProps {
  profile: ProfileWithMetadata
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
  const trialStatus = useTrialStatus()
  const [exporting, setExporting] = useState(false)
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null)
  const [cardType, setCardType] = useState<'all-time' | 'weekly' | 'monthly' | 'grind'>('all-time')
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
      link.download = `playerzero-${cardType}-card.png`
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

  const isCardTypeAllowed = (type: 'all-time' | 'weekly' | 'monthly' | 'grind') => {
    switch (type) {
      case 'all-time':
        return trialStatus.canGenerateAllTimeCard
      case 'grind':
        return trialStatus.canShareGrindCard
      case 'weekly':
      case 'monthly':
        return trialStatus.canViewWeeklyMonthlyCards
      default:
        return false
    }
  }

  const getRestrictedMessage = (type: 'all-time' | 'weekly' | 'monthly' | 'grind') => {
    const timeLeft = trialStatus.timeRemaining.days > 0 
      ? `${trialStatus.timeRemaining.days}d ${trialStatus.timeRemaining.hours}h ${trialStatus.timeRemaining.minutes}m ${trialStatus.timeRemaining.seconds}s left`
      : trialStatus.timeRemaining.hours > 0 
      ? `${trialStatus.timeRemaining.hours}h ${trialStatus.timeRemaining.minutes}m ${trialStatus.timeRemaining.seconds}s left`
      : trialStatus.timeRemaining.minutes > 0
      ? `${trialStatus.timeRemaining.minutes}m ${trialStatus.timeRemaining.seconds}s left`
      : `${trialStatus.timeRemaining.seconds}s left`

    switch (type) {
      case 'all-time':
        return trialStatus.isInTrial 
          ? `Available during trial (${timeLeft})`
          : 'Available during 30-day trial only'
      case 'grind':
        return trialStatus.isInTrial 
          ? `Available during trial (${timeLeft})`
          : 'Available during 30-day trial only'
      case 'weekly':
      case 'monthly':
        return 'Premium feature only'
      default:
        return 'Restricted'
    }
  }

  const selectedTeam = TEAM_COLORS.find(team => team.value === profile.team_color) || TEAM_COLORS[0]
  const accentColor = selectedTeam.color
  const textColor = selectedTeam.value === 'yellow' ? '#333333' : '#ffffff'

  if (!isPaidUser && !trialStatus.isInTrial) {
    return (
      <div className="locked-content">
        <div className="locked-icon">📤</div>
        <h3 className="locked-title">Visual Export - Trial Expired</h3>
        <p className="locked-description">
          Your 30-day trial has ended. Upgrade to Premium to continue generating and sharing visual cards!
        </p>
        <div className="upgrade-features">
          <div className="upgrade-feature">
            <span className="feature-check">✓</span>
            <span>All-Time Performance Cards</span>
          </div>
          <div className="upgrade-feature">
            <span className="feature-check">✓</span>
            <span>Weekly & Monthly Progress Cards</span>
          </div>
          <div className="upgrade-feature">
            <span className="feature-check">✓</span>
            <span>Grind Session Cards</span>
          </div>
          <div className="upgrade-feature">
            <span className="feature-check">✓</span>
            <span>Custom Card Themes</span>
          </div>
        </div>
        <button 
          className="upgrade-button"
          onClick={handleUpgradeClick}
        >
          Upgrade to Premium
        </button>
      </div>
    )
  }

    return (
    <div className="visual-export-container">
      <div className="visual-export-header">
        <h2>📤 Visual Export</h2>
        <p>Generate beautiful cards to share your progress</p>
        {!trialStatus.isPaidUser && trialStatus.isInTrial && (
          <div className="trial-notice">
            <span className="trial-badge">
              Trial: {trialStatus.timeRemaining.days > 0 
                ? `${trialStatus.timeRemaining.days}d ${trialStatus.timeRemaining.hours}h ${trialStatus.timeRemaining.minutes}m ${trialStatus.timeRemaining.seconds}s left`
                : trialStatus.timeRemaining.hours > 0 
                ? `${trialStatus.timeRemaining.hours}h ${trialStatus.timeRemaining.minutes}m ${trialStatus.timeRemaining.seconds}s left`
                : trialStatus.timeRemaining.minutes > 0
                ? `${trialStatus.timeRemaining.minutes}m ${trialStatus.timeRemaining.seconds}s left`
                : `${trialStatus.timeRemaining.seconds}s left`
              }
            </span>
          </div>
        )}
      </div>

      {/* Card Type Selector */}
      <div className="card-selector">
        <button
          className={`card-type-tab ${cardType === 'all-time' ? 'active' : ''} ${!isCardTypeAllowed('all-time') ? 'restricted' : ''}`}
          onClick={() => isCardTypeAllowed('all-time') && setCardType('all-time')}
          disabled={!isCardTypeAllowed('all-time')}
          title={!isCardTypeAllowed('all-time') ? getRestrictedMessage('all-time') : ''}
        >
          🌟 All-Time
          {!isCardTypeAllowed('all-time') && <span className="restriction-badge">🔒</span>}
        </button>
        <button
          className={`card-type-tab ${cardType === 'grind' ? 'active' : ''} ${!isCardTypeAllowed('grind') ? 'restricted' : ''}`}
          onClick={() => isCardTypeAllowed('grind') && setCardType('grind')}
          disabled={!isCardTypeAllowed('grind')}
          title={!isCardTypeAllowed('grind') ? getRestrictedMessage('grind') : ''}
        >
          🔥 Grind
          {!isCardTypeAllowed('grind') && <span className="restriction-badge">🔒</span>}
        </button>
        <button
          className={`card-type-tab ${cardType === 'weekly' ? 'active' : ''} ${!isCardTypeAllowed('weekly') ? 'restricted' : ''}`}
          onClick={() => isCardTypeAllowed('weekly') && setCardType('weekly')}
          disabled={!isCardTypeAllowed('weekly')}
          title={!isCardTypeAllowed('weekly') ? getRestrictedMessage('weekly') : ''}
        >
          📅 Weekly
          {!isCardTypeAllowed('weekly') && <span className="restriction-badge">👑</span>}
        </button>
        <button
          className={`card-type-tab ${cardType === 'monthly' ? 'active' : ''} ${!isCardTypeAllowed('monthly') ? 'restricted' : ''}`}
          onClick={() => isCardTypeAllowed('monthly') && setCardType('monthly')}
          disabled={!isCardTypeAllowed('monthly')}
          title={!isCardTypeAllowed('monthly') ? getRestrictedMessage('monthly') : ''}
        >
          📊 Monthly
          {!isCardTypeAllowed('monthly') && <span className="restriction-badge">👑</span>}
        </button>
      </div>

      {/* Export Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <button
          onClick={exportCard}
          disabled={exporting || !isCardTypeAllowed(cardType)}
          className="export-button"
          style={{
            opacity: (!isCardTypeAllowed(cardType)) ? 0.5 : 1,
            cursor: (!isCardTypeAllowed(cardType)) ? 'not-allowed' : 'pointer'
          }}
        >
          {exporting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="loading-spinner" style={{ width: '1rem', height: '1rem' }}></div>
              Generating...
            </span>
          ) : (
            `📤 Export ${cardType.charAt(0).toUpperCase() + cardType.slice(1)} Card`
          )}
        </button>
        
        {downloadMessage && (
          <span style={{ 
            color: downloadMessage.includes('failed') ? '#ef4444' : '#22c55e',
            fontSize: '0.875rem'
          }}>
            {downloadMessage}
          </span>
        )}
      </div>

      {/* Card Preview */}
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
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            flex: 1
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: textColor,
                textShadow: selectedTeam.value === 'yellow' ? `2px 2px 4px ${accentColor}60` : `2px 2px 4px rgba(0,0,0,0.8)`,
                marginBottom: '4px' 
              }}>
                {(profile.total_xp || 0).toLocaleString()}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: textColor, 
                opacity: 0.8,
                textShadow: selectedTeam.value === 'yellow' ? `1px 1px 2px ${accentColor}40` : `1px 1px 2px rgba(0,0,0,0.6)` 
              }}>
                Total XP
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔴</div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: textColor,
                textShadow: selectedTeam.value === 'yellow' ? `2px 2px 4px ${accentColor}60` : `2px 2px 4px rgba(0,0,0,0.8)`,
                marginBottom: '4px' 
              }}>
                {(profile.pokemon_caught || 0).toLocaleString()}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: textColor, 
                opacity: 0.8,
                textShadow: selectedTeam.value === 'yellow' ? `1px 1px 2px ${accentColor}40` : `1px 1px 2px rgba(0,0,0,0.6)` 
              }}>
                Pokémon Caught
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚶</div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: textColor,
                textShadow: selectedTeam.value === 'yellow' ? `2px 2px 4px ${accentColor}60` : `2px 2px 4px rgba(0,0,0,0.8)`,
                marginBottom: '4px' 
              }}>
                {(profile.distance_walked || 0).toLocaleString()} km
            </div>
            <div style={{
                fontSize: '14px', 
                color: textColor, 
                opacity: 0.8,
                textShadow: selectedTeam.value === 'yellow' ? `1px 1px 2px ${accentColor}40` : `1px 1px 2px rgba(0,0,0,0.6)` 
              }}>
                Distance Walked
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📍</div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: textColor,
                textShadow: selectedTeam.value === 'yellow' ? `2px 2px 4px ${accentColor}60` : `2px 2px 4px rgba(0,0,0,0.8)`,
                marginBottom: '4px' 
              }}>
                {(profile.pokestops_visited || 0).toLocaleString()}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: textColor, 
                opacity: 0.8,
                textShadow: selectedTeam.value === 'yellow' ? `1px 1px 2px ${accentColor}40` : `1px 1px 2px rgba(0,0,0,0.6)` 
              }}>
                PokéStops Visited
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '20px',
            borderTop: `1px solid ${textColor}30`
          }}>
            <div style={{
              fontSize: '16px', 
              fontWeight: 'bold',
              color: textColor,
              textShadow: selectedTeam.value === 'yellow' ? `1px 1px 2px ${accentColor}60` : `1px 1px 2px rgba(0,0,0,0.8)`
            }}>
              PlayerZERO
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: textColor, 
              opacity: 0.8,
              textShadow: selectedTeam.value === 'yellow' ? `1px 1px 2px ${accentColor}40` : `1px 1px 2px rgba(0,0,0,0.6)`
            }}>
              {cardType.charAt(0).toUpperCase() + cardType.slice(1)} Stats • {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 