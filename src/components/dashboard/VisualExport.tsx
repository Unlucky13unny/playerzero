import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import type { ProfileWithMetadata } from '../../services/profileService'
import { calculateSummitDate } from '../../services/profileService'

interface VisualExportProps {
  profile: ProfileWithMetadata
  isPaidUser: boolean
}

export const VisualExport = ({ profile, isPaidUser }: VisualExportProps) => {
  const navigate = useNavigate()
  const trialStatus = useTrialStatus()
  const [exporting, setExporting] = useState(false)
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null)
  const [cardType, setCardType] = useState<'all-time' | 'achievement' | 'summit'>('all-time')
  const cardRef = useRef<HTMLDivElement>(null)

  const exportCard = async () => {
    if (!cardRef.current || !profile) return

    setExporting(true)
    setDownloadMessage(null)

    try {
      // Find the actual card template element inside the container
      const cardElement = cardRef.current.querySelector('.card-template') as HTMLElement
      if (!cardElement) {
        throw new Error('Card template not found')
      }

      // Add export class to disable problematic styles temporarily
      cardElement.classList.add('exporting')
      
      // Ensure the card is fully visible in viewport during capture
      cardElement.scrollIntoView({ behavior: 'instant', block: 'center' })
      
      // Wait for styles to apply and scroll to complete
      await new Promise(resolve => setTimeout(resolve, 200))

      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 400,
        height: 600,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      })

      // Remove export class from card element
      cardElement.classList.remove('exporting')

      // Create high-quality PNG
      const link = document.createElement('a')
      link.download = `playerzero-${profile.trainer_name}-${cardType}-card.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()

      setDownloadMessage('Card downloaded successfully!')
      setTimeout(() => setDownloadMessage(null), 3000)
    } catch (error) {
      console.error('Export failed:', error)
      // Make sure to remove export class if error occurs
      if (cardRef.current) {
        const cardElement = cardRef.current.querySelector('.card-template') as HTMLElement
        if (cardElement) {
          cardElement.classList.remove('exporting')
        }
      }
      setDownloadMessage('Export failed. Please try again.')
      setTimeout(() => setDownloadMessage(null), 3000)
    } finally {
      setExporting(false)
    }
  }

  const handleUpgradeClick = () => {
    navigate('/upgrade')
  }

  const isCardTypeAllowed = (type: 'all-time' | 'achievement' | 'summit') => {
    switch (type) {
      case 'all-time':
        return trialStatus.canGenerateAllTimeCard
      case 'achievement':
        // Achievement cards are available to everyone with private mode access
        return trialStatus.canGenerateAllTimeCard
      case 'summit':
        // Summit cards are available to everyone with private mode access
        return trialStatus.canGenerateAllTimeCard
      default:
        return false
    }
  }

  const getRestrictedMessage = (type: 'all-time' | 'achievement' | 'summit') => {
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
          ? `Available in private mode (${timeLeft})`
          : 'Available in private mode only'
      case 'achievement':
        return trialStatus.isInTrial 
          ? `Available in private mode (${timeLeft})`
          : 'Available in private mode only'
      case 'summit':
        return trialStatus.isInTrial 
          ? `Available in private mode (${timeLeft})`
          : 'Available in private mode only'
      default:
        return 'Restricted'
    }
  }

  // Calculate projected dates and achievements
  const currentXP = profile.total_xp || 0
  const startDate = profile.start_date ? new Date(profile.start_date) : new Date()
  const daysSinceStart = Math.max(1, Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const dailyXPRate = currentXP / daysSinceStart
  if (!isPaidUser && !trialStatus.isInTrial) {
    return (
      <div className="locked-content">
        <div className="locked-icon">🔒</div>
        <h3 className="locked-title">Private Mode Ended</h3>
        <p className="locked-description">
          To keep tracking your grind and unlock your leaderboard placement, upgrade for $5.99.
        </p>
        <button 
          className="upgrade-button"
          onClick={handleUpgradeClick}
        >
          Upgrade Now
        </button>
      </div>
    )
  }

  const renderCard = () => {
    const startDate = profile.start_date ? new Date(profile.start_date).toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    }) : new Date().toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    })

    switch (cardType) {
      case 'all-time':
        return (
          <div className="card-template all-time-card" style={{ 
            backgroundImage: 'url(/public/images/grind.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            width: '100%',
            height: '100%',
            minWidth: '400px',
            minHeight: '600px',
            margin: 0,
            padding: 0,
            border: 'none',
            overflow: 'hidden'
          }}>
            {/* Text Overlays */}
            <div style={{ 
              position: 'absolute',
              top: '50px',
              left: '20px',
              color: 'black',
              fontWeight: 'bold',
              fontSize: '18px',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              {profile.trainer_name}
            </div>
            
            <div style={{ 
              position: 'absolute',
              top: '55px',
              right: '30px',
              color: 'black',
              fontSize: '15px',
              textAlign: 'right',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              <div style={{ fontWeight: 'bold' }}>{startDate}</div>
            </div>

            {/* Bottom Left Stats */}
             <div style={{ 
               position: 'absolute',
               top: '340px',
               bottom: '90px',
               left: '30px',
               fontSize: '12px'
             }}>
               <div style={{ marginBottom: '15px' }}>
                 <div style={{ 
                   color: 'black', 
                   textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
                 }}>Pokemon Caught</div>
                 <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'red'}}>{(profile.pokemon_caught || 0).toLocaleString()}</div>
                 <div style={{ fontSize: '12px', color: 'red'}}>{((profile.pokemon_caught || 0) / Math.max(1, Math.floor((new Date().getTime() - new Date(profile.start_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2)} /Day</div>
               </div>
               <div style={{ marginBottom: '15px' }}>
                 <div style={{ 
                   color: 'black', 
                   textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
                 }}>Distance Walked</div>
                 <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'red'}}>{(profile.distance_walked || 0).toLocaleString()} km</div>
                 <div style={{ fontSize: '12px', color: 'red'}}>{((profile.distance_walked || 0) / Math.max(1, Math.floor((new Date().getTime() - new Date(profile.start_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2)} /Day</div>
               </div>
               <div>
                 <div style={{ 
                   color: 'black', 
                   textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
                 }}>Pokestops Visited</div>
                 <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'red'}}>{(profile.pokestops_visited || 0).toLocaleString()}</div>
                 <div style={{ fontSize: '12px', color: 'red'}}>{((profile.pokestops_visited || 0) / Math.max(1, Math.floor((new Date().getTime() - new Date(profile.start_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2)} /Day</div>
               </div>
             </div>

                         {/* Bottom Right Stats */}
             <div style={{ 
               position: 'absolute',
               top: '400px',
               bottom: '80px',
               right: '60px',
               fontSize: '30px',
               textAlign: 'right'
             }}>
               <div style={{ 
                 color: 'black', 
                 textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
               }}>Total XP</div>
               <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'red'}}>{(profile.total_xp || 0).toLocaleString()}</div>
               <div style={{ fontSize: '12px', color: 'red'}}>{(dailyXPRate).toFixed(2)} /Day</div>
             </div>
            
            {/* All-time Label */}
            <div style={{ 
              position: 'absolute',
              top: '325px',
              bottom: '45px',
              right: '35px',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
            }}>
              All-time
            </div>
          </div>
        )

      case 'achievement':
        return (
          <div className="card-template achievement-card" style={{ 
            backgroundImage: 'url(/public/images/achieved.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            width: '100%',
            height: '100%',
            minWidth: '400px',
            minHeight: '600px',
            margin: 0,
            padding: 0,
            border: 'none',
            overflow: 'hidden'
          }}>
            {/* Trainer Name - Top Left */}
            <div style={{ 
              position: 'absolute',
              top: '50px',
              left: '30px',
              color: 'black',
              fontWeight: 'bold',
              fontSize: '20px',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              {profile.trainer_name}
            </div>
            
            {/* Start Date - Top Right */}
            <div style={{ 
              position: 'absolute',
              top: '55px',
              right: '30px',
              color: 'black',
              fontSize: '15px',
              textAlign: 'right',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              <div style={{ fontWeight: 'bold' }}>{startDate}</div>
            </div>

            {/* Total XP - Bottom Left */}
            <div style={{ 
              position: 'absolute',
              bottom: '90px',
              left: '25px',
              color: 'red',
              fontSize: '12px',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              <div style={{ fontSize: '34px', fontWeight: 'bold', color: 'white', textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' }}>{(profile.total_xp || 0).toLocaleString()}</div>
            </div>
          </div>
        )

      case 'summit':
        const summitDate = calculateSummitDate(profile.total_xp || 0, profile.average_daily_xp || 0, profile.start_date)
        return (
          <div className="card-template summit-card" style={{ 
            backgroundImage: 'url(/public/images/summit.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            width: '100%',
            height: '100%',
            minWidth: '400px',
            minHeight: '600px',
            margin: 0,
            padding: 0,
            border: 'none',
            overflow: 'hidden'
          }}>
            {/* Trainer Name - Top Left */}
            <div style={{ 
              position: 'absolute',
              top: '50px',
              left: '30px',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '20px',
            }}>
              {profile.trainer_name}
            </div>
            
            {/* Start Date - Top Right */}
            <div style={{ 
              position: 'absolute',
              top: '50px',
              right: '30px',
              color: 'black',
              fontSize: '15px',
              textAlign: 'right',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              <div style={{ fontWeight: 'bold' }}>{startDate}</div>
            </div>

            {/* Summit Date - Above Total XP */}
            <div style={{ 
              position: 'absolute',
              bottom: '430px',
              left: '30px',
              color: 'red',
              fontSize: '24px',
              fontWeight: 'bold',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              {summitDate}
            </div>

            {/* Total XP - Bottom Left */}
            <div style={{ 
              position: 'absolute',
              bottom: '100px',
              left: '30px',
              color: 'white',
              fontSize: '12px',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              <div style={{ fontSize: '30px', fontWeight: 'bold', color: 'white' }}>{(profile.total_xp || 0).toLocaleString()}</div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="visual-export-container">
      <div className="visual-export-header">
        <h2>📤 Visual Export</h2>
        <p>Generate beautiful cards to share your progress</p>
        {!trialStatus.isPaidUser && trialStatus.isInTrial && (
          <div className="trial-notice">
            <span className="trial-badge">
              Private Mode: {trialStatus.timeRemaining.days > 0 
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
          📊 All-Time
          {!isCardTypeAllowed('all-time') && <span className="restriction-badge">🔒</span>}
        </button>
        <button
          className={`card-type-tab ${cardType === 'summit' ? 'active' : ''} ${!isCardTypeAllowed('summit') ? 'restricted' : ''}`}
          onClick={() => isCardTypeAllowed('summit') && setCardType('summit')}
          disabled={!isCardTypeAllowed('summit')}
          title={!isCardTypeAllowed('summit') ? getRestrictedMessage('summit') : ''}
        >
          🏔️ Summit
          {!isCardTypeAllowed('summit') && <span className="restriction-badge">🔒</span>}
        </button>
        <button
          className={`card-type-tab ${cardType === 'achievement' ? 'active' : ''} ${!isCardTypeAllowed('achievement') ? 'restricted' : ''}`}
          onClick={() => isCardTypeAllowed('achievement') && setCardType('achievement')}
          disabled={!isCardTypeAllowed('achievement')}
          title={!isCardTypeAllowed('achievement') ? getRestrictedMessage('achievement') : ''}
        >
          🏆 Achievement
          {!isCardTypeAllowed('achievement') && <span className="restriction-badge">🔒</span>}
        </button>
      </div>

      {/* Export Controls */}
      <div className="export-actions">
        <button
          onClick={exportCard}
          disabled={exporting || !isCardTypeAllowed(cardType)}
          className="export-button"
          style={{
            opacity: (!isCardTypeAllowed(cardType)) ? 0.5 : 1,
            cursor: (!isCardTypeAllowed(cardType)) ? 'not-allowed' : 'pointer'
          }}
        >
          <span className="export-icon">📤</span>
          {exporting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="loading-spinner" style={{ width: '1rem', height: '1rem' }}></div>
              Generating...
            </span>
          ) : (
            `Export ${cardType.charAt(0).toUpperCase() + cardType.slice(1)} Card`
          )}
        </button>
        
        {downloadMessage && (
          <div className="export-message" style={{ 
            color: downloadMessage.includes('failed') ? '#ef4444' : '#22c55e',
            fontSize: '0.875rem',
            textAlign: 'center',
            padding: '0.5rem'
          }}>
            {downloadMessage}
          </div>
        )}
      </div>

      {/* Card Preview */}
      <div className="card-preview-container">
        <div ref={cardRef} className="card-container">
          {renderCard()}
        </div>
      </div>
    </div>
  )
} 