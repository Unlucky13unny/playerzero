import { useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import type { ProfileWithMetadata } from '../../services/profileService'
import { calculateSummitDate } from '../../services/profileService'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { ErrorModal } from '../common/ErrorModal'

interface SummitCardProps {
  profile: ProfileWithMetadata | null
  onClose: () => void
  isPaidUser: boolean
}

export const SummitCard = ({ profile, onClose, isPaidUser }: SummitCardProps) => {
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

      // Determine which background image to use
      const hasAchievedLevel80 = (profile.total_xp || 0) >= 203_353_000 && (profile.trainer_level || 0) >= 80
      const backgroundImage = hasAchievedLevel80 ? '/images/achieved.png' : '/images/summit.png'
      
      // Preload the background image first
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((resolve) => {
        img.onload = () => {
          console.log('Summit background image loaded')
          resolve(true)
        }
        img.onerror = (error) => {
          console.warn('Background image failed to load, continuing anyway:', error)
          resolve(true) // Continue even if image fails to preload
        }
        // Set timeout to prevent infinite waiting
        setTimeout(() => resolve(true), 5000)
        img.src = backgroundImage
      })

      // Wait for fonts to load - CRITICAL for consistent rendering
      if (document.fonts && document.fonts.ready) {
        try {
          await Promise.race([
            document.fonts.ready,
            new Promise(resolve => setTimeout(resolve, 3000))
          ])
        } catch (e) {
          console.warn('Font loading timeout, continuing...')
        }
      }
      
      // Extended wait for proper font rendering
      await new Promise(resolve => setTimeout(resolve, 500))

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
            const timeout = setTimeout(() => resolve(), 3000)
            img.onload = () => {
              clearTimeout(timeout)
              resolve()
            }
            img.onerror = () => {
              clearTimeout(timeout)
              resolve()
            }
          }
        })
      })
      await Promise.all(imageLoadPromises)

      // Final rendering wait
      await new Promise(resolve => setTimeout(resolve, 300))

      if (!cardRef.current) return

      // Use fixed dimensions that match the preview exactly
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
      const cardWidth = isMobile ? 224 : 400
      const cardHeight = isMobile ? 336 : 600
      const scale = 2 // Fixed 2x scale for consistent high quality

      // Pixel-perfect export configuration with fixed dimensions
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
        imageTimeout: 15000,
        proxy: undefined,
        foreignObjectRendering: false,
        removeContainer: true,
        onclone: (clonedDocument) => {
          try {
            // Set crossOrigin on all images in the cloned document
            const clonedImages = clonedDocument.querySelectorAll('img')
            clonedImages.forEach((img: any) => {
              img.crossOrigin = 'anonymous'
              // Ensure image sources are accessible
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

            // Add download-specific positioning styles for Summit Card
            const downloadStyles = clonedDocument.createElement('style')
            downloadStyles.textContent = `
              /* Download-specific positioning for Summit Card */
              .summit-card-download .xp-display {
                bottom: ${isMobile ? '60px' : '120px'} !important;
                left: ${isMobile ? '20px' : '33px'} !important;
              }
              /* Decrease trainer name and date top position by 5px */
              .summit-card-download .trainer-name {
                top: ${isMobile ? '22px' : '40px'} !important;
                left: ${isMobile ? '20px' : '27px'} !important;
                height: ${isMobile ? '20px' : '35px'} !important;
                line-height: ${isMobile ? '17px' : '30px'} !important;
                overflow: visible !important;
                white-space: nowrap !important;
              }
              .summit-card-download .start-date {
                top: ${isMobile ? '24px' : '44px'} !important;
                right: ${isMobile ? '22px' : '39px'} !important;
                
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
              clonedCardElement.classList.add('summit-card-download')
            }
          } catch (e) {
            console.warn('Error in onclone:', e)
          }
        }
      })

      // Create download link
      const link = document.createElement('a')
      link.download = `playerzero-${profile.trainer_name}-summit-card.png`
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

  // Check if mobile view
  const isMobile = window.innerWidth <= 768

  // Check if user has achieved level 80
  const hasAchievedLevel80 = (profile.total_xp || 0) >= 203_353_000 && (profile.trainer_level || 0) >= 80
  
  // Level 80 XP goal
  const LEVEL_80_XP = 203_353_000

  // Calculate XP remaining to reach Level 80
  const currentXP = profile.total_xp || 0
  const xpRemaining = Math.max(0, LEVEL_80_XP - currentXP)

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

  // Calculate summit date
  const summitDate = calculateSummitDate(profile.total_xp || 0, profile.average_daily_xp || 0, profile.start_date, profile.trainer_level)

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
        data-card-ref="summit-card"
        style={{ 
          position: 'relative',
          width: isMobile ? '224px' : '400px',
          height: isMobile ? '336px' : '600px',
          margin: 0,
          padding: 0,
          border: 'none',
          overflow: 'hidden',
          borderRadius: isMobile ? '16px' : '28px',
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        {/* Background Image */}
        <img
          src={hasAchievedLevel80 ? '/images/achieved.png' : '/images/summit.png'}
          alt="Card Background"
          crossOrigin="anonymous"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
        
        {/* Trainer Name - Top Left */}
        <div 
          className="trainer-name"
          style={{ 
            position: 'absolute',
            top: isMobile ? '27px' : '32px',
            left: isMobile ? '11px' : '27px',
            fontFamily: 'Poppins, sans-serif',
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: isMobile ? '11px' : '20px',
            lineHeight: isMobile ? '17px' : '30px',
            color: '#FFFFFF',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            zIndex: 2
          }}>
          {profile.trainer_name}
        </div>
        
        {/* Start Date - Top Right */}
        <div 
          className="start-date"
          style={{ 
            position: 'absolute',
            top: isMobile ? '29px' : '35px',
            right: isMobile ? '17px' : '39px',
            fontFamily: 'Poppins, sans-serif',
            fontStyle: 'normal',
            fontWeight: 500,
            fontSize: isMobile ? '8px' : '14px',
            lineHeight: isMobile ? '12px' : '21px',
            textAlign: 'right',
            color: '#DC2627',
            textShadow: '1px 1px 3px rgba(248, 17, 17, 0.8)',
            zIndex: 2
          }}>
          {startDate}
        </div>

        {/* Summit Date - Center (Hidden on Gold Achievement Card) */}
        {!hasAchievedLevel80 && (
          <div style={{ 
            position: 'absolute',
            top: isMobile ? '73px' : '130px',
            left: isMobile ? '18px' : '32px',
            fontFamily: 'Poppins, sans-serif',
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: isMobile ? '16px' : '28px',
            lineHeight: isMobile ? '24px' : '42px',
            color: '#DC2627',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            zIndex: 2
          }}>
            {summitDate}
          </div>
        )}

        {/* XP Display - Bottom */}
        <div 
          className="xp-display"
          style={{ 
            position: 'absolute',
            bottom: isMobile ? '52px' : '75px',
            left: isMobile ? '11px' : '28px',
            fontFamily: 'Poppins, sans-serif',
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: isMobile ? '22px' : '40px',
            lineHeight: isMobile ? '26px' : '36px',
            color: '#DC2627',
            textShadow: '2px 2px 4px rgba(241, 12, 12, 0.8)',
            zIndex: 2
          }}>
          {hasAchievedLevel80 ? currentXP.toLocaleString() : (xpRemaining === 0 ? '' : xpRemaining.toLocaleString())}
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
            fontFamily: 'Poppins, sans-serif',
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
            fontFamily: 'Poppins, sans-serif',
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