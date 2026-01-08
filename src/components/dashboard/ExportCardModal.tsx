import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import type { ProfileWithMetadata } from '../../services/profileService'
import { calculateSummitDate } from '../../services/profileService'
import { FaDownload, FaShare, FaTimes, FaTwitter, FaFacebook, FaWhatsapp, FaTelegram, FaCopy } from 'react-icons/fa'

interface ExportCardModalProps {
  isOpen: boolean
  onClose: () => void
  profile: ProfileWithMetadata | null
  isPaidUser: boolean
}

export const ExportCardModal = ({ isOpen, onClose, profile, isPaidUser }: ExportCardModalProps) => {
  const navigate = useNavigate()
  const trialStatus = useTrialStatus()
  const [exporting, setExporting] = useState(false)
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null)
  const [cardType, setCardType] = useState<'all-time' | 'achievement' | 'summit'>('all-time')
  const [showShareOptions, setShowShareOptions] = useState(false)
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
        scale: isMobile ? 1.5 : 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
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

  const shareToSocialMedia = async (platform: string) => {
    if (!profile) return

    try {
      // First generate the card image
      const cardElement = cardRef.current?.querySelector('.card-template') as HTMLElement
      if (!cardElement) {
        throw new Error('Card template not found')
      }

      cardElement.classList.add('exporting')
      await new Promise(resolve => setTimeout(resolve, 200))

      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: isMobile ? 1.5 : 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      })

      cardElement.classList.remove('exporting')

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return

        //const file = new File([blob], `playerzero-${profile.trainer_name}-${cardType}-card.png`, { type: 'image/png' })
        
        // Share text
        const shareText = `Check out my ${cardType} Pokémon GO stats on PlayerZero! 🎮📊`
        const shareUrl = window.location.origin

        switch (platform) {
          case 'twitter':
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
            window.open(twitterUrl, '_blank')
            break
          case 'facebook':
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
            window.open(facebookUrl, '_blank')
            break
          case 'whatsapp':
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
            window.open(whatsappUrl, '_blank')
            break
          case 'telegram':
            const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
            window.open(telegramUrl, '_blank')
            break
          case 'copy-link':
            try {
              await navigator.clipboard.writeText(shareUrl)
              setDownloadMessage('Link copied to clipboard!')
              setTimeout(() => setDownloadMessage(null), 3000)
            } catch (err) {
              console.error('Failed to copy link:', err)
            }
            break
        }
      }, 'image/png')
    } catch (error) {
      console.error('Share failed:', error)
      setDownloadMessage('Share failed. Please try again.')
      setTimeout(() => setDownloadMessage(null), 3000)
    }
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
  const currentXP = profile?.total_xp || 0
  // Parse date in a timezone-safe way by adding 'T00:00:00' to force local timezone
  const startDate = profile?.start_date ? new Date(profile.start_date + 'T00:00:00') : new Date()
  const daysSinceStart = Math.max(1, Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const dailyXPRate = currentXP / daysSinceStart
  const formattedDailyXP = dailyXPRate >= 1000 
    ? Math.round((dailyXPRate / 1000) * 10) / 10 + 'K'
    : Math.round(dailyXPRate * 10) / 10

  if (!isOpen) return null

  if (!isPaidUser && !trialStatus.isInTrial) {
    return (
      <div className="export-modal-overlay" onClick={onClose}>
        <div className="export-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="export-modal-header">
            <h2>Export Cards</h2>
            <button className="modal-close-button" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
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
        </div>
      </div>
    )
  }

  const renderCard = () => {
    if (!profile) return null

    const startDate = profile.start_date ? new Date(profile.start_date + 'T00:00:00').toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    }) : new Date().toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    })

    // Use mobile responsive cards for mobile devices
    if (isMobile || isSmallMobile) {
      return renderMobileCard(startDate)
    } else {
      // Use separate web cards for desktop
      return renderWebCard(startDate)
    }
  }

  const renderMobileCard = (startDate: string) => {
    if (!profile) return null

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
              left: isSmallMobile ? '15px' : isMobile ? '18px' : '20px',
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
               top: '231px',
               bottom: isSmallMobile ? '60px' : isMobile ? '70px' : '90px',
               left: isSmallMobile ? '20px' : isMobile ? '25px' : '30px',
               fontSize: '10px'
             }}>
               <div style={{ marginBottom: isSmallMobile ? '5px' : isMobile ? '12px' : '15px' }}>
                 <div style={{ 
                   color: 'black', 
                   textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
                 }}>Pokemon Caught</div>
                 <div style={{ fontSize: styles.statValueFontSize, fontWeight: 'bold', color: 'red'}}>{(profile.pokemon_caught || 0).toLocaleString()}</div>
                 <div style={{ fontSize: styles.statDailyFontSize, color: 'red'}}>{Math.round(((profile.pokemon_caught || 0) / Math.max(1, Math.floor((new Date().getTime() - new Date(profile.start_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)))) * 10) / 10} /Day</div>
               </div>
               <div style={{ marginBottom: isSmallMobile ? '5px' : isMobile ? '5px' : '15px' }}>
                 <div style={{ 
                   color: 'black', 
                   textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
                 }}>Distance Walked</div>
                 <div style={{ fontSize: styles.statValueFontSize, fontWeight: 'bold', color: 'red'}}>{(profile.distance_walked || 0).toLocaleString()} km</div>
                 <div style={{ fontSize: styles.statDailyFontSize, color: 'red'}}>{Math.round(((profile.distance_walked || 0) / Math.max(1, Math.floor((new Date().getTime() - new Date(profile.start_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)))) * 10) / 10} /Day</div>
               </div>
               <div style={{ marginBottom: '5px' }}>
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
               top: '270px',
               bottom: isSmallMobile ? '50px' : isMobile ? '60px' : '80px',
               right: isSmallMobile ? '40px' : isMobile ? '50px' : '60px',
               fontSize: styles.totalXPFontSize,
               textAlign: 'right'
             }}>
               <div style={{ 
                 color: 'black', 
                 textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
               }}>Total XP</div>
               <div style={{ fontSize: styles.statValueFontSize, fontWeight: 'bold', color: 'red'}}>{(profile.total_xp || 0).toLocaleString()}</div>
               <div style={{ fontSize: styles.statDailyFontSize, color: 'red'}}>{formattedDailyXP} /Day</div>
             </div>
             
             {/* All-time Label */}
             <div style={{ 
               position: 'absolute',
               top: '220px',
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
        return (
          <div className="card-template summit-card" style={{ 
            backgroundImage: 'url(/images/summit.png)',
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
              top: isSmallMobile ? '30px' : isMobile ? '40px' : '50px',
              right: isSmallMobile ? '20px' : isMobile ? '25px' : '30px',
              color: 'black',
              fontSize: styles.dateFontSize,
              textAlign: 'right',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              <div style={{ fontWeight: 'bold' }}>{startDate}</div>
            </div>

            {/* Summit Date - Above Total XP */}
            <div style={{ 
              position: 'absolute',
              bottom: '300px',
              left: isSmallMobile ? '20px' : isMobile ? '25px' : '30px',
              color: 'red',
              fontSize: styles.summitDateFontSize,
              fontWeight: 'bold',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              {summitDate}
            </div>

            {/* Total XP - Bottom Left */}
            <div style={{ 
              position: 'absolute',
              bottom: isSmallMobile ? '70px' : isMobile ? '80px' : '100px',
              left: isSmallMobile ? '20px' : isMobile ? '25px' : '30px',
              color: 'white',
              fontSize: styles.statLabelFontSize,
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              <div style={{ fontSize: styles.statValueFontSize, fontWeight: 'bold', color: 'white' }}>{(profile.total_xp || 0).toLocaleString()}</div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderWebCard = (startDate: string) => {
    if (!profile) return null

    switch (cardType) {
      case 'all-time':
        return (
          <div className="card-template all-time-card web-card" style={{ 
            backgroundImage: 'url(/images/grind.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            width: '400px',
            height: '600px',
            margin: 0,
            padding: 0,
            border: 'none',
            overflow: 'hidden'
          }}>
            {/* Web All Time Card - You can adjust text positioning here later */}
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
               top: '310px',
               bottom: '90px',
               left: '30px',
               fontSize: '10px'
             }}>
               <div style={{ marginBottom: '15px' }}>
                 <div style={{ 
                   color: 'black', 
                   textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
                 }}>Pokemon Caught</div>
                 <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'red'}}>{(profile.pokemon_caught || 0).toLocaleString()}</div>
                 <div style={{ fontSize: '12px', color: 'red'}}>{Math.round(((profile.pokemon_caught || 0) / Math.max(1, Math.floor((new Date().getTime() - new Date(profile.start_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)))) * 10) / 10} /Day</div>
               </div>
               <div style={{ marginBottom: '15px' }}>
                 <div style={{ 
                   color: 'black', 
                   textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
                 }}>Distance Walked</div>
                 <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'red'}}>{(profile.distance_walked || 0).toLocaleString()} km</div>
                 <div style={{ fontSize: '12px', color: 'red'}}>{Math.round(((profile.distance_walked || 0) / Math.max(1, Math.floor((new Date().getTime() - new Date(profile.start_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)))) * 10) / 10} /Day</div>
               </div>
               <div style={{ marginBottom: '5px' }}>
                 <div style={{ 
                   color: 'black', 
                   textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
                 }}>Pokestops Visited</div>
                 <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'red'}}>{(profile.pokestops_visited || 0).toLocaleString()}</div>
                 <div style={{ fontSize: '12px', color: 'red'}}>{Math.round(((profile.pokestops_visited || 0) / Math.max(1, Math.floor((new Date().getTime() - new Date(profile.start_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)))) * 10) / 10} /Day</div>
               </div>
             </div>

                         {/* Bottom Right Stats */}
             <div style={{ 
               position: 'absolute',
               top: '350px',
               bottom: '80px',
               right: '20px',
               fontSize: '20px',
               textAlign: 'right'
             }}>
               <div style={{ 
                 color: 'black', 
                 textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' 
               }}>Total XP</div>
               <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'red'}}>{(profile.total_xp || 0).toLocaleString()}</div>
               <div style={{ fontSize: '12px', color: 'red'}}>{formattedDailyXP} /Day</div>
             </div>
             
             {/* All-time Label */}
             <div style={{ 
               position: 'absolute',
               top: '300px',
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
          <div className="card-template achievement-card web-card" style={{ 
            backgroundImage: 'url(/images/achieved.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            width: '400px',
            height: '600px',
            margin: 0,
            padding: 0,
            border: 'none',
            overflow: 'hidden'
          }}>
            {/* Web Achievement Card - You can adjust text positioning here later */}
            {/* Trainer Name - Top Left */}
            <div style={{ 
              position: 'absolute',
              top: '50px',
              left: '30px',
              color: 'black',
              fontWeight: 'bold',
              fontSize: '18px',
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
        const summitDate = calculateSummitDate(profile.total_xp || 0, profile.average_daily_xp || 0, profile.start_date, profile.trainer_level)
        // Determine background: Gold card only when BOTH XP >= 203,353,000 AND level >= 80
        const hasAchievedLevel80WebSummit = (profile.total_xp || 0) >= 203_353_000 && (profile.trainer_level || 0) >= 80
        const summitBackgroundWeb = hasAchievedLevel80WebSummit ? '/images/achieved.png' : '/images/summit.png'
        return (
          <div className="card-template summit-card web-card" style={{ 
            backgroundImage: `url(${summitBackgroundWeb})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            width: '400px',
            height: '600px',
            margin: 0,
            padding: 0,
            border: 'none',
            overflow: 'hidden'
          }}>
            {/* Web Summit Card - You can adjust text positioning here later */}
            {/* Trainer Name - Top Left */}
            <div style={{ 
              position: 'absolute',
              top: '50px',
              left: '30px',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px',
            }}>
              {profile.trainer_name}
            </div>
            
            {/* Start Date - Top Right */}
            <div style={{ 
              position: 'absolute',
              top: '50px',
              right: '20px',
              color: 'black',
              fontSize: '15px',
              textAlign: 'right',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              <div style={{ fontWeight: 'bold' }}>{startDate}</div>
            </div>

            {/* Summit Date - Above Total XP (Hidden on Gold Achievement Card) */}
            {!hasAchievedLevel80WebSummit && (
              <div style={{ 
                position: 'absolute',
                bottom: '400px',
                left: '20px',
                color: 'red',
                fontSize: '24px',
                fontWeight: 'bold',
                textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
              }}>
                {summitDate}
              </div>
            )}

            {/* Total XP - Bottom Left */}
            <div style={{ 
              position: 'absolute',
              bottom: '100px',
              left: '30px',
              color: 'white',
              fontSize: '12px',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{(profile.total_xp || 0).toLocaleString()}</div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className={`export-modal-content ${isMobile || isSmallMobile ? 'mobile-view' : 'web-view'}`} onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h2>📤 Create Cards</h2>
          <button className="modal-close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

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

        {/* Card Preview */}
        <div className={`card-preview-container ${isMobile || isSmallMobile ? 'mobile-view' : 'web-view'}`}>
          <div ref={cardRef} className={`card-container ${isMobile || isSmallMobile ? 'mobile-view' : 'web-view'}`}>
            {renderCard()}
          </div>
        </div>

        {/* Export Actions */}
        <div className={`export-actions ${isMobile || isSmallMobile ? 'mobile-view' : 'web-view'}`}>
          <button
            onClick={exportCard}
            disabled={exporting || !isCardTypeAllowed(cardType)}
            className={`export-button download-button ${isMobile || isSmallMobile ? 'mobile-view' : 'web-view'}`}
            style={{
              opacity: (!isCardTypeAllowed(cardType)) ? 0.5 : 1,
              cursor: (!isCardTypeAllowed(cardType)) ? 'not-allowed' : 'pointer'
            }}
          >
            <FaDownload />
            {exporting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Generating...
              </span>
            ) : (
              'Download'
            )}
          </button>
          
          <button
            onClick={() => setShowShareOptions(!showShareOptions)}
            className={`export-button share-button ${isMobile || isSmallMobile ? 'mobile-view' : 'web-view'}`}
            disabled={!isCardTypeAllowed(cardType)}
            style={{
              opacity: (!isCardTypeAllowed(cardType)) ? 0.5 : 1,
              cursor: (!isCardTypeAllowed(cardType)) ? 'not-allowed' : 'pointer'
            }}
          >
            <FaShare />
            Share
          </button>
        </div>

        {/* Social Media Share Options */}
        {showShareOptions && (
          <div className={`social-share-options ${isMobile || isSmallMobile ? 'mobile-view' : 'web-view'}`}>
            <h3>Share to Social Media</h3>
            <div className={`social-buttons ${isMobile || isSmallMobile ? 'mobile-view' : 'web-view'}`}>
              <button
                onClick={() => shareToSocialMedia('twitter')}
                className={`social-button twitter ${isMobile || isSmallMobile ? 'mobile-view' : 'web-view'}`}
                title="Share on Twitter"
              >
                <FaTwitter />
                <span>Twitter</span>
              </button>
              <button
                onClick={() => shareToSocialMedia('facebook')}
                className={`social-button facebook ${isMobile || isSmallMobile ? 'mobile-view' : 'web-view'}`}
                title="Share on Facebook"
              >
                <FaFacebook />
                <span>Facebook</span>
              </button>
              <button
                onClick={() => shareToSocialMedia('whatsapp')}
                className={`social-button whatsapp ${isMobile || isSmallMobile ? 'mobile-view' : 'web-view'}`}
                title="Share on WhatsApp"
              >
                <FaWhatsapp />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => shareToSocialMedia('telegram')}
                className={`social-button telegram ${isMobile || isSmallMobile ? 'mobile-view' : 'web-view'}`}
                title="Share on Telegram"
              >
                <FaTelegram />
                <span>Telegram</span>
              </button>
              <button
                onClick={() => shareToSocialMedia('copy-link')}
                className={`social-button copy-link ${isMobile || isSmallMobile ? 'mobile-view' : 'web-view'}`}
                title="Copy Link"
              >
                <FaCopy />
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        )}
        
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
    </div>
  )
} 