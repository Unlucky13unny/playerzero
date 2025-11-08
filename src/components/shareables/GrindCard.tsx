import { useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import type { ProfileWithMetadata } from '../../services/profileService'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { ErrorModal } from '../common/ErrorModal'

interface GrindCardProps {
  profile: ProfileWithMetadata | null
  onClose: () => void
  isPaidUser: boolean
}

export const GrindCard = ({ profile, onClose, isPaidUser }: GrindCardProps) => {
  const navigate = useNavigate()
  const trialStatus = useTrialStatus()
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const handleUpgradeClick = () => {
    navigate('/upgrade')
  }

  // Handle share/download button click
  const handleShareClick = async () => {
    if (!cardRef.current || !profile || isDownloading) return

    try {
      setIsDownloading(true)

      // Preload the background image first
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((resolve) => {
        img.onload = () => {
          console.log('Grind background image loaded')
          resolve(true)
        }
        img.onerror = (error) => {
          console.warn('Background image failed to load, continuing anyway:', error)
          resolve(true) // Continue even if image fails to preload
        }
        // Set timeout to prevent infinite waiting
        setTimeout(() => resolve(true), 5000)
        img.src = '/images/grind.png'
      })

      // Wait for fonts to load - CRITICAL for consistent rendering
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready
      }
      
      // Extended wait for proper font rendering
      await new Promise(resolve => setTimeout(resolve, 800))

      if (!cardRef.current) return

      // Ensure all img elements in card have CORS enabled BEFORE capture
      const cardImages = cardRef.current.querySelectorAll('img')
      cardImages.forEach((img: any) => {
        img.crossOrigin = 'anonymous'
      })

      // Wait for all images in the card to load
      const imageLoadPromises = Array.from(cardImages).map((img: any) => {
        return new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight !== 0) {
            resolve()
          } else {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          }
        })
      })
      await Promise.all(imageLoadPromises)

      // Final rendering wait
      await new Promise(resolve => setTimeout(resolve, 400))

      if (!cardRef.current) return

      // Use fixed dimensions that match the preview exactly
      // For download, always use actual viewport size regardless of preview mode
      const isMobileDownload = typeof window !== 'undefined' && window.innerWidth <= 768
      const cardWidth = isMobileDownload ? 224 : 400
      const cardHeight = isMobileDownload ? 336 : 600
      const scale = 2 // Fixed 2x scale for consistent high quality

      // Pixel-perfect export configuration
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: cardWidth,
        windowHeight: cardHeight,
        width: cardWidth,
        height: cardHeight,
        imageTimeout: 30000,
        proxy: undefined,
        foreignObjectRendering: false,
        removeContainer: true,
        onclone: async (clonedDocument) => {
          // Set crossOrigin on all images in the cloned document
          const clonedImages = clonedDocument.querySelectorAll('img')
          clonedImages.forEach((img: any) => {
            img.crossOrigin = 'anonymous'
            // Force reload if needed
            if (img.src && !img.complete) {
              const src = img.src
              img.src = ''
              img.src = src
            }
          })

          // Replace OKLCH colors in CSS custom properties for canvas compatibility
          const style = clonedDocument.createElement('style')
          style.textContent = `
            :root {
              --background: rgb(255, 255, 255);
              --foreground: rgb(37, 37, 37);
              --card: rgb(255, 255, 255);
              --card-foreground: rgb(37, 37, 37);
              --popover: rgb(255, 255, 255);
              --popover-foreground: rgb(37, 37, 37);
              --primary: rgb(52, 52, 52);
              --primary-foreground: rgb(251, 251, 251);
              --secondary: rgb(247, 247, 247);
              --secondary-foreground: rgb(52, 52, 52);
              --muted: rgb(247, 247, 247);
              --muted-foreground: rgb(142, 142, 142);
              --accent: rgb(247, 247, 247);
              --accent-foreground: rgb(52, 52, 52);
              --destructive: rgb(220, 38, 39);
              --destructive-foreground: rgb(220, 38, 39);
              --border: rgb(235, 235, 235);
              --input: rgb(235, 235, 235);
              --ring: rgb(181, 181, 181);
            }
            .dark {
              --background: rgb(37, 37, 37);
              --foreground: rgb(251, 251, 251);
              --card: rgb(37, 37, 37);
              --card-foreground: rgb(251, 251, 251);
              --popover: rgb(37, 37, 37);
              --popover-foreground: rgb(251, 251, 251);
              --primary: rgb(251, 251, 251);
              --primary-foreground: rgb(52, 52, 52);
              --secondary: rgb(69, 69, 69);
              --secondary-foreground: rgb(251, 251, 251);
              --muted: rgb(69, 69, 69);
              --muted-foreground: rgb(181, 181, 181);
              --accent: rgb(69, 69, 69);
              --accent-foreground: rgb(251, 251, 251);
              --destructive: rgb(185, 28, 28);
              --destructive-foreground: rgb(239, 68, 68);
              --border: rgb(69, 69, 69);
              --input: rgb(69, 69, 69);
              --ring: rgb(112, 112, 112);
            }
            `
            clonedDocument.head.appendChild(style)

          // Add download-specific positioning styles for Grind Card
          const downloadStyles = clonedDocument.createElement('style')
          downloadStyles.textContent = `
            /* Download-specific positioning for Grind Card */
            .grind-card-download .trainer-name {
              top: ${isMobileDownload ? '20px' : '37px'} !important;
              left: ${isMobileDownload ? '17px' : '28px'} !important;
              height: ${isMobileDownload ? '20px' : '35px'} !important;
              line-height: ${isMobileDownload ? '17px' : '30px'} !important;
              overflow: visible !important;
              white-space: nowrap !important;
            }
            .grind-card-download .start-date {
              top: ${isMobileDownload ? '24px' : '40px'} !important;
              right: ${isMobileDownload ? '20px' : '39px'} !important;
            }
            .grind-card-download .stats-section {
              top: ${isMobileDownload ? '190px' : '335px'} !important;
            }
            .grind-card-download .total-xp-section {
              top: ${isMobileDownload ? '270px' : '475px'} !important;
            }
            /* Fix daily stats text positioning - move up by 2px */
            .grind-card-download .daily-stats-text {
              transform: translateY(-2px) !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
          `
          clonedDocument.head.appendChild(downloadStyles)

          // Ensure the cloned card element has exact dimensions and download class
          const clonedCardElement = clonedDocument.querySelector('[data-card-ref]') as HTMLElement
          if (clonedCardElement) {
            clonedCardElement.style.width = cardWidth + 'px'
            clonedCardElement.style.height = cardHeight + 'px'
            clonedCardElement.style.minWidth = cardWidth + 'px'
            clonedCardElement.style.minHeight = cardHeight + 'px'
            clonedCardElement.style.maxWidth = cardWidth + 'px'
            clonedCardElement.style.maxHeight = cardHeight + 'px'
            clonedCardElement.classList.add('grind-card-download')
          }

          // Ensure fonts are loaded in cloned document
          if (clonedDocument.fonts && clonedDocument.fonts.ready) {
            await clonedDocument.fonts.ready
          }
        }
      })

      // Create download link
      const link = document.createElement('a')
      link.download = `playerzero-${profile.trainer_name}-grind-card.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()

      // Show success message
      setDownloadSuccess(true)
      
      // Auto-close after showing success
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download card. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (!profile) return null

  // Show error modal if user is not subscribed and not in trial
  if (!isPaidUser && !trialStatus.isInTrial) {
    return (
      <ErrorModal
        isOpen={true}
        onClose={onClose}
        title="Premium Feature"
        message="Sharing cards is a premium feature. Upgrade to unlock and flex your stats."
        confirmText="Upgrade Now"
        cancelText="Close"
        onConfirm={handleUpgradeClick}
      />
    )
  }

  const startDate = profile.start_date 
    ? new Date(profile.start_date + 'T00:00:00').toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'numeric', 
        year: 'numeric' 
      }).replace(/\//g, '.')
    : new Date().toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'numeric', 
        year: 'numeric' 
      }).replace(/\//g, '.')

  // Calculate daily rates for all stats
  const currentXP = profile?.total_xp || 0
  const startDateObj = profile?.start_date ? new Date(profile.start_date) : new Date()
  const daysSinceStart = Math.max(1, Math.floor((new Date().getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)))
  
  // Calculate daily rates
  const dailyXPRate = currentXP / daysSinceStart
  const formattedDailyXP = dailyXPRate >= 1000 
    ? Math.round((dailyXPRate / 1000) * 10) / 10 + 'K'
    : Math.round(dailyXPRate * 10) / 10

  const pokemonPerDay = Math.round(((profile.pokemon_caught || 0) / daysSinceStart) * 100) / 100
  const distancePerDay = Math.round(((profile.distance_walked || 0) / daysSinceStart) * 100) / 100
  const pokestopsPerDay = Math.round(((profile.pokestops_visited || 0) / daysSinceStart) * 100) / 100

  // Detect mobile view - use simple, consistent detection for preview
  // The card size is fixed (400px desktop, 224px mobile), so we can reliably detect based on viewport
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  
  // Desktop positioning should be FIXED regardless of screen size
  // The card is always 400x600px, so positioning should never change based on viewport

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        gap: '24px',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDownloading) {
          onClose()
        }
      }}
    >
      <div 
        ref={cardRef}
        data-card-ref="grind-card"
        style={{ 
          position: 'relative',
          width: isMobile ? '224px' : '400px',
          height: isMobile ? '336px' : '600px',
          minWidth: isMobile ? '224px' : '400px',
          minHeight: isMobile ? '336px' : '600px',
          maxWidth: isMobile ? '224px' : '400px',
          maxHeight: isMobile ? '336px' : '600px',
          margin: 0,
          padding: 0,
          border: 'none',
          borderRadius: isMobile ? '16px' : '30px',
          overflow: 'hidden',
          fontFamily: "'Poppins', sans-serif",
          flexShrink: 0,
          flexGrow: 0
        }}
      >
        {/* Background Image */}
        <img
          src="/images/grind.png"
          alt="Card Background"
          crossOrigin="anonymous"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            objectPosition: 'center',
            zIndex: 1,
            pointerEvents: 'none',
            display: 'block'
          }}
        />
        
        {/* Trainer Name - Top Left */}
        <div 
          className="trainer-name"
          style={{ 
            position: 'absolute',
            top: isMobile ? '27px' : '47px',
            left: isMobile ? '20px' : '30px',
            fontFamily: "'Poppins', sans-serif",
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: isMobile ? '12px' : '20px',
            lineHeight: isMobile ? '17px' : '30px',
            color: '#FFFFFF',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            letterSpacing: '0.5px',
            zIndex: 2,
            height: isMobile ? '20px' : '35px',
            overflow: 'visible',
            whiteSpace: 'nowrap'
          }}>
          {profile.trainer_name}
        </div>
        
        {/* Start Date - Top Right */}
        <div 
          className="start-date"
          style={{ 
            position: 'absolute',
            top: isMobile ? '29px' : '52px',
            right: isMobile ? '20px' : '39px',
            fontFamily: "'Poppins', sans-serif",
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: isMobile ? '8px' : '14px',
            lineHeight: isMobile ? '12px' : '21px',
            color: '#DC2627',
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
            textAlign: 'right',
            zIndex: 2
          }}>
          {startDate}
        </div>

        {/* Stats Section */}
        <div 
          className="stats-section"
          style={{ 
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '0px',
            width: isMobile ? '202px' : '360px',
            left: isMobile ? '11px' : '20px',
            top: isMobile ? '190px' : '340px',
            zIndex: 2
          }}>
          {/* ALL TIME Header */}
          <div style={{ 
            fontFamily: "'Poppins', sans-serif",
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: isMobile ? '11px' : '20px',
            lineHeight: isMobile ? '17px' : '30px',
            color: '#DC2627',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            marginBottom: isMobile ? '2px' : '10px',
            marginLeft: isMobile ? '6px' : '14px'
          }}>
            ALL TIME
          </div>

          {/* Stats Container */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '0px',
            gap: isMobile ? '2px' : '4px',
            marginLeft: isMobile ? '6px' : '10px',
            width: '100%'
          }}>
            {/* Pokémon Caught Row */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0px',
              width: '100%',
              height: isMobile ? '16px' : '28px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '0px',
                gap: isMobile ? '3px' : '6px',
                height: isMobile ? '16px' : '28px'
              }}>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: isMobile ? '6px' : '11px',
                  lineHeight: isMobile ? '9px' : '16px',
                  textAlign: 'center',
                  color: '#D1D1D1',
                  textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
                  whiteSpace: 'nowrap'
                }}>
                  Pokémon Caught
                </div>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: isMobile ? '8px' : '14px',
                  lineHeight: isMobile ? '12px' : '21px',
                  textAlign: 'center',
                  color: '#FFFFFF',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
                }}>
                  {(profile.pokemon_caught || 0).toLocaleString()}
                </div>
              </div>
              <div 
                className="daily-stats-container"
                style={{
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: isMobile ? '0px 5px' : '0px 10px',
                  width: isMobile ? '50px' : '88px',
                  height: isMobile ? '16px' : '28px',
                  background: 'rgba(219, 22, 27, 0.5)',
                  border: '1px solid #DC2627',
                  borderRadius: isMobile ? '8px' : '15px',
                  marginRight: isMobile ? '10px' : '15px'
                }}>
                <div 
                  className="daily-stats-text"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontStyle: 'normal',
                    fontWeight: 500,
                    fontSize: isMobile ? '6px' : '10px',
                    lineHeight: isMobile ? '16px' : '28px',
                    textAlign: 'center',
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap'
                  }}>
                  {pokemonPerDay} daily
                </div>
              </div>
            </div>

            {/* Distance Walked Row */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0px',
              width: '100%',
              height: isMobile ? '16px' : '28px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '0px',
                gap: isMobile ? '3px' : '6px',
                height: isMobile ? '16px' : '28px'
              }}>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: isMobile ? '6px' : '11px',
                  lineHeight: isMobile ? '9px' : '16px',
                  textAlign: 'center',
                  color: '#D1D1D1',
                  textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
                  whiteSpace: 'nowrap'
                }}>
                  Distance Walked
                </div>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: isMobile ? '8px' : '14px',
                  lineHeight: isMobile ? '12px' : '21px',
                  textAlign: 'center',
                  color: '#FFFFFF',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
                }}>
                  {(profile.distance_walked || 0).toLocaleString()}
                </div>
              </div>
              <div 
                className="daily-stats-container"
                style={{
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: isMobile ? '0px 5px' : '0px 10px',
                  width: isMobile ? '50px' : '88px',
                  height: isMobile ? '16px' : '28px',
                  background: 'rgba(219, 22, 27, 0.5)',
                  border: '1px solid #DC2627',
                  marginRight: isMobile ? '10px' : '15px',
                  borderRadius: isMobile ? '8px' : '15px'
                }}>
                <div 
                  className="daily-stats-text"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontStyle: 'normal',
                    fontWeight: 500,
                    fontSize: isMobile ? '6px' : '10px',
                    lineHeight: isMobile ? '16px' : '28px',
                    textAlign: 'center',
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap'
                  }}>
                  {distancePerDay} daily
                </div>
              </div>
            </div>

            {/* Pokéstops Visited Row */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0px',
              width: '100%',
              height: isMobile ? '16px' : '28px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '0px',
                gap: isMobile ? '3px' : '6px',
                height: isMobile ? '16px' : '28px'
              }}>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: isMobile ? '6px' : '11px',
                  lineHeight: isMobile ? '9px' : '16px',
                  textAlign: 'center',
                  color: '#D1D1D1',
                  textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
                  whiteSpace: 'nowrap'
                }}>
                  Pokéstops Visited
                </div>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: isMobile ? '8px' : '14px',
                  lineHeight: isMobile ? '12px' : '21px',
                  textAlign: 'center',
                  color: '#FFFFFF',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
                }}>
                  {(profile.pokestops_visited || 0).toLocaleString()}
                </div>
              </div>
              <div 
                className="daily-stats-container"
                style={{
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: isMobile ? '10px' : '15px',
                  padding: isMobile ? '0px 5px' : '0px 10px',
                  width: isMobile ? '50px' : '88px',
                  height: isMobile ? '16px' : '28px',
                  background: 'rgba(219, 22, 27, 0.5)',
                  border: '1px solid #DC2627',
                  borderRadius: isMobile ? '8px' : '15px'
                }}>
                <div 
                  className="daily-stats-text"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontStyle: 'normal',
                    fontWeight: 500,
                    fontSize: isMobile ? '6px' : '10px',
                    lineHeight: isMobile ? '16px' : '28px',
                    textAlign: 'center',
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap'
                  }}>
                  {pokestopsPerDay} daily
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total XP Section */}
        <div 
          className="total-xp-section"
          style={{ 
            position: 'absolute',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0px',
            width: isMobile ? '202px' : '360px',
            height: isMobile ? '29px' : '52px',
            left: isMobile ? '15px' : '30px',
            top: isMobile ? '270px' : '490px',
            zIndex: 2
          }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '0px'
          }}>
            <div style={{
              fontFamily: "'Poppins', sans-serif",
              fontStyle: 'normal',
              fontWeight: 500,
              fontSize: isMobile ? '8px' : '14px',
              lineHeight: '110%',
              textAlign: 'left',
              color: '#FFFFFF',
              textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
              marginBottom: isMobile ? '2px' : '4px'
            }}>
              Total XP
            </div>
            <div style={{
              fontFamily: "'Poppins', sans-serif",
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: isMobile ? '18px' : '32px',
              lineHeight: '110%',
              textAlign: 'left',
              color: '#FFFFFF',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
            }}>
              {(profile.total_xp || 0).toLocaleString()}
            </div>
          </div>

          <div 
            className="daily-stats-container"
            style={{
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: isMobile ? '0px 6px' : '0px 12px',
              marginRight: isMobile ? '6px' : '15px',
              width: isMobile ? '56px' : '100px',
              height: isMobile ? '16px' : '28px',
              background: 'rgba(219, 22, 27, 0.5)',
              border: '1px solid #DC2627',
              borderRadius: isMobile ? '8px' : '15px'
            }}>
            <div 
              className="daily-stats-text"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: isMobile ? '6px' : '11px',
                lineHeight: isMobile ? '16px' : '28px',
                textAlign: 'center',
                color: '#FFFFFF',
                whiteSpace: 'nowrap'
              }}>
              {formattedDailyXP} daily
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <button
          onClick={onClose}
          disabled={isDownloading}
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '12px 24px',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: '14px',
            color: '#FFFFFF',
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            opacity: isDownloading ? 0.5 : 1,
            transition: 'all 0.2s ease',
            minWidth: '100px'
          }}
        >
          Close
        </button>

        <button
          onClick={handleShareClick}
          disabled={isDownloading || downloadSuccess}
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '12px 32px',
            gap: '8px',
            background: downloadSuccess ? '#10B981' : '#DC2627',
            border: 'none',
            borderRadius: '8px',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: '14px',
            color: '#FFFFFF',
            cursor: (isDownloading || downloadSuccess) ? 'not-allowed' : 'pointer',
            opacity: (isDownloading || downloadSuccess) ? 0.8 : 1,
            transition: 'all 0.2s ease',
            minWidth: '140px',
            boxShadow: '0 4px 12px rgba(220, 38, 39, 0.3)'
          }}
        >
          {isDownloading ? (
            'Generating...'
          ) : downloadSuccess ? (
            '✓ Downloaded'
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 10L12 15L17 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15V3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Share
            </>
          )}
        </button>
      </div>
    </div>
  )
}