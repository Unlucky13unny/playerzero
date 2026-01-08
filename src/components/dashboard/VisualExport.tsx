import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { calculateSummitDate, type ProfileWithMetadata } from '../../services/profileService'

interface VisualExportProps {
  profile: ProfileWithMetadata
  isPaidUser: boolean
}

export const VisualExport = ({ profile, isPaidUser }: VisualExportProps) => {
  const navigate = useNavigate()
  const trialStatus = useTrialStatus()
  const [cardType, setCardType] = useState<'all-time' | 'achievement' | 'summit'>('all-time')
  const [exporting, setExporting] = useState(false)
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(false)
  const [isSmallMobile, setIsSmallMobile] = useState(false)

  // Detect screen size changes
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width <= 768)
      setIsSmallMobile(width <= 480)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Get responsive dimensions and font sizes
  const getResponsiveStyles = () => {
    if (isSmallMobile) {
      return {
        cardWidth: '280px',
        cardHeight: '420px',
        trainerNameFontSize: '14px',
        dateFontSize: '11px',
        statLabelFontSize: '9px',
        statValueFontSize: '16px',
        statDailyFontSize: '10px',
        totalXPFontSize: '18px',
        allTimeLabelFontSize: '16px',
        summitDateFontSize: '18px',
        achievementXPFontSize: '28px'
      }
    } else if (isMobile) {
      return {
        cardWidth: '320px',
        cardHeight: '480px',
        trainerNameFontSize: '16px',
        dateFontSize: '12px',
        statLabelFontSize: '10px',
        statValueFontSize: '18px',
        statDailyFontSize: '11px',
        totalXPFontSize: '20px',
        allTimeLabelFontSize: '18px',
        summitDateFontSize: '20px',
        achievementXPFontSize: '30px'
      }
    } else {
      return {
        cardWidth: '400px',
        cardHeight: '600px',
        trainerNameFontSize: '18px',
        dateFontSize: '15px',
        statLabelFontSize: '12px',
        statValueFontSize: '20px',
        statDailyFontSize: '12px',
        totalXPFontSize: '20px',
        allTimeLabelFontSize: '20px',
        summitDateFontSize: '24px',
        achievementXPFontSize: '34px'
      }
    }
  }

  const styles = getResponsiveStyles()

  const exportCard = async () => {
    if (!cardRef.current || !profile) return

    try {
      setExporting(true)
      const cardElement = cardRef.current.querySelector('.card-template') as HTMLElement
      if (cardElement) {
        cardElement.classList.add('exporting')
      }

      // Use html2canvas with responsive settings
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#1a1a1a',
        scale: isMobile ? 1.5 : 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        scrollX: 0,
        scrollY: 0
      })

      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `${cardType}-card-${new Date().getTime()}.png`
      link.href = image
      link.click()

      setDownloadMessage('Card downloaded successfully!')
      setTimeout(() => setDownloadMessage(null), 3000)
    } catch (error) {
      console.error('Export failed:', error)
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
  // Parse date in a timezone-safe way by adding 'T00:00:00' to force local timezone
  const startDate = profile.start_date ? new Date(profile.start_date + 'T00:00:00') : new Date()
  const daysSinceStart = Math.max(1, Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const dailyXPRate = currentXP / daysSinceStart
  const formattedDailyXP = dailyXPRate >= 1000 
    ? Math.round((dailyXPRate / 1000) * 10) / 10 + 'K'
    : Math.round(dailyXPRate * 10) / 10
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
    const startDate = profile.start_date ? new Date(profile.start_date + 'T00:00:00').toLocaleDateString('en-US', { 
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
            backgroundImage: 'url(/images/grind.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            width: styles.cardWidth,
            height: styles.cardHeight,
            margin: 0,
            padding: 0,
            border: 'none',
            overflow: 'hidden'
          }}>
            {/* Text Overlays */}
            <div style={{ 
              position: 'absolute',
              top: isSmallMobile ? '30px' : isMobile ? '40px' : '50px',
              left: isSmallMobile ? '12px' : isMobile ? '15px' : '18px',
              color: 'black',
              fontWeight: 'bold',
              fontSize: styles.trainerNameFontSize,
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              {profile.trainer_name}
            </div>
            
            <div style={{ 
              position: 'absolute',
              top: isSmallMobile ? '35px' : isMobile ? '45px' : '55px',
              right: isSmallMobile ? '20px' : isMobile ? '25px' : '30px',
              color: 'black',
              fontSize: styles.dateFontSize,
              textAlign: 'right',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              <div style={{ fontWeight: 'bold' }}>{startDate}</div>
            </div>

            {/* Bottom Left Stats */}
             <div style={{ 
               position: 'absolute',
               top: isSmallMobile ? '200px' : isMobile ? '240px' : '340px',
               bottom: isSmallMobile ? '60px' : isMobile ? '70px' : '90px',
               left: isSmallMobile ? '20px' : isMobile ? '25px' : '30px',
               fontSize: styles.statLabelFontSize
             }}>
               <div style={{ marginBottom: isSmallMobile ? '10px' : isMobile ? '12px' : '15px' }}>
                 <div style={{ 
                   color: 'black', 
                   textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
                 }}>Pokemon Caught</div>
                 <div style={{ fontSize: styles.statValueFontSize, fontWeight: 'bold', color: 'red'}}>{(profile.pokemon_caught || 0).toLocaleString()}</div>
                 <div style={{ fontSize: styles.statDailyFontSize, color: 'red'}}>{Math.round(((profile.pokemon_caught || 0) / Math.max(1, Math.floor((new Date().getTime() - new Date(profile.start_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)))) * 10) / 10} /Day</div>
               </div>
               <div style={{ marginBottom: isSmallMobile ? '10px' : isMobile ? '12px' : '15px' }}>
                 <div style={{ 
                   color: 'black', 
                   textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
                 }}>Distance Walked</div>
                 <div style={{ fontSize: styles.statValueFontSize, fontWeight: 'bold', color: 'red'}}>{(profile.distance_walked || 0).toLocaleString()} km</div>
                 <div style={{ fontSize: styles.statDailyFontSize, color: 'red'}}>{Math.round(((profile.distance_walked || 0) / Math.max(1, Math.floor((new Date().getTime() - new Date(profile.start_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)))) * 10) / 10} /Day</div>
               </div>
               <div>
                 <div style={{ 
                   color: 'black', 
                   textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
                 }}>Pokestops Visited</div>
                 <div style={{ fontSize: styles.statValueFontSize, fontWeight: 'bold', color: 'red'}}>{(profile.pokestops_visited || 0).toLocaleString()}</div>
                 <div style={{ fontSize: styles.statDailyFontSize, color: 'red'}}>{Math.round(((profile.pokestops_visited || 0) / Math.max(1, Math.floor((new Date().getTime() - new Date(profile.start_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)))) * 10) / 10} /Day</div>
               </div>
             </div>

                         {/* Bottom Right Stats */}
             <div style={{ 
               position: 'absolute',
               top: isSmallMobile ? '240px' : isMobile ? '280px' : '400px',
               bottom: isSmallMobile ? '60px' : isMobile ? '70px' : '80px',
               right: isSmallMobile ? '40px' : isMobile ? '50px' : '60px',
               fontSize: styles.statLabelFontSize,
               textAlign: 'right'
             }}>
               <div style={{ 
                 color: 'black', 
                 textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
               }}>Total XP</div>
               <div style={{ fontSize: styles.totalXPFontSize, fontWeight: 'bold', color: 'red'}}>{(profile.total_xp || 0).toLocaleString()}</div>
               <div style={{ fontSize: styles.statDailyFontSize, color: 'red'}}>{formattedDailyXP} /Day</div>
             </div>
            
            {/* All-time Label */}
            <div style={{ 
              position: 'absolute',
              top: isSmallMobile ? '180px' : isMobile ? '220px' : '325px',
              bottom: isSmallMobile ? '30px' : isMobile ? '35px' : '45px',
              right: isSmallMobile ? '25px' : isMobile ? '30px' : '35px',
              color: 'white',
              fontSize: styles.allTimeLabelFontSize,
              fontWeight: 'bold',
            }}>
              All-time
            </div>
          </div>
        )

      case 'achievement':
        return (
          <div className="card-template achievement-card" style={{ 
            backgroundImage: 'url(/images/achieved.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            width: styles.cardWidth,
            height: styles.cardHeight,
            margin: 0,
            padding: 0,
            border: 'none',
            overflow: 'hidden'
          }}>
            {/* Trainer Name - Top Left */}
            <div style={{ 
              position: 'absolute',
              top: isSmallMobile ? '30px' : isMobile ? '40px' : '50px',
              left: isSmallMobile ? '20px' : isMobile ? '25px' : '30px',
              color: 'black',
              fontWeight: 'bold',
              fontSize: styles.trainerNameFontSize,
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              {profile.trainer_name}
            </div>
            
            {/* Start Date - Top Right */}
            <div style={{ 
              position: 'absolute',
              top: isSmallMobile ? '35px' : isMobile ? '45px' : '55px',
              right: isSmallMobile ? '20px' : isMobile ? '25px' : '30px',
              color: 'black',
              fontSize: styles.dateFontSize,
              textAlign: 'right',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              <div style={{ fontWeight: 'bold' }}>{startDate}</div>
            </div>

            {/* Total XP - Bottom Left */}
            <div style={{ 
              position: 'absolute',
              bottom: isSmallMobile ? '60px' : isMobile ? '70px' : '90px',
              left: isSmallMobile ? '15px' : isMobile ? '20px' : '25px',
              color: 'red',
              fontSize: styles.statLabelFontSize,
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              <div style={{ fontSize: styles.achievementXPFontSize, fontWeight: 'bold', color: 'white', textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' }}>{(profile.total_xp || 0).toLocaleString()}</div>
            </div>
          </div>
        )

      case 'summit':
        const summitDate = calculateSummitDate(profile.total_xp || 0, profile.average_daily_xp || 0, profile.start_date, profile.trainer_level)
        // Determine background: Gold card only when BOTH XP >= 203,353,000 AND level >= 80
        const hasAchievedLevel80Summit = (profile.total_xp || 0) >= 203_353_000 && (profile.trainer_level || 0) >= 80
        const summitBackground = hasAchievedLevel80Summit ? '/images/achieved.png' : '/images/summit.png'
        return (
          <div className="card-template summit-card" style={{ 
            backgroundImage: `url(${summitBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            width: styles.cardWidth,
            height: styles.cardHeight,
            margin: 0,
            padding: 0,
            border: 'none',
            overflow: 'hidden'
          }}>
            {/* Trainer Name - Top Left */}
            <div style={{ 
              position: 'absolute',
              top: isSmallMobile ? '30px' : isMobile ? '40px' : '50px',
              left: isSmallMobile ? '20px' : isMobile ? '25px' : '30px',
              color: 'white',
              fontWeight: 'bold',
              fontSize: styles.trainerNameFontSize,
            }}>
              {profile.trainer_name}
            </div>
            
            {/* Start Date - Top Right */}
            <div style={{ 
              position: 'absolute',
              top: isSmallMobile ? '35px' : isMobile ? '45px' : '50px',
              right: isSmallMobile ? '20px' : isMobile ? '25px' : '30px',
              color: 'black',
              fontSize: styles.dateFontSize,
              textAlign: 'right',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              <div style={{ fontWeight: 'bold' }}>{startDate}</div>
            </div>

            {/* Summit Date - Above Total XP (Hidden on Gold Achievement Card) */}
            {!hasAchievedLevel80Summit && (
              <div style={{ 
                position: 'absolute',
                bottom: isSmallMobile ? '280px' : isMobile ? '320px' : '430px',
                left: isSmallMobile ? '20px' : isMobile ? '25px' : '30px',
                color: 'red',
                fontSize: styles.summitDateFontSize,
                fontWeight: 'bold',
                textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
              }}>
                {summitDate}
              </div>
            )}

            {/* Total XP - Bottom Left */}
            <div style={{ 
              position: 'absolute',
              bottom: isSmallMobile ? '70px' : isMobile ? '80px' : '100px',
              left: isSmallMobile ? '20px' : isMobile ? '25px' : '30px',
              color: 'white',
              fontSize: styles.statLabelFontSize,
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              <div style={{ fontSize: styles.totalXPFontSize, fontWeight: 'bold', color: 'white' }}>{(profile.total_xp || 0).toLocaleString()}</div>
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
          📊 All Time
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
      <div className="card-preview-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isSmallMobile ? '10px' : isMobile ? '15px' : '20px',
        minHeight: isSmallMobile ? '450px' : isMobile ? '500px' : '600px',
        overflow: 'hidden'
      }}>
        <div ref={cardRef} className="card-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%'
        }}>
          {renderCard()}
        </div>
      </div>
    </div>
  )
} 