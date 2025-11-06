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

        // Determine which background image to use based on achievement status
        // Gold card only when BOTH XP >= 203,353,000 AND level >= 80
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
            resolve(true) // Continue even if image fails
          }
          img.src = backgroundImage
        })

        // Wait for fonts to load and card to render properly
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready
        }
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
            if (img.complete) {
              // Image already loaded
              resolve()
            } else {
              img.onload = () => resolve()
              img.onerror = () => resolve() // Continue even if image fails
            }
          })
        })
        await Promise.all(imageLoadPromises)

        // Additional wait for rendering
        await new Promise(resolve => setTimeout(resolve, 300))

        // Sanitize CSS to remove unsupported color functions
        const sanitizeCSS = () => {
          if (!cardRef.current) return
          const allElements = cardRef.current.querySelectorAll('*')
          allElements.forEach((element: any) => {
            const computedStyle = window.getComputedStyle(element)
            const style = element.style
            
            // Replace unsupported color functions with fallback colors
            const colorProperties = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor']
            
            colorProperties.forEach(prop => {
              const value = (computedStyle as any)[prop]
              if (value && (value.includes('oklch') || value.includes('lch') || value.includes('lab') || value.includes('color-mix'))) {
                // Use appropriate fallback based on property
                if (prop === 'backgroundColor') {
                  (style as any)[prop] = '#ffffff' // White background
                } else {
                  (style as any)[prop] = '#000000' // Black text/border
                }
              }
            })
          })
        }
        
        sanitizeCSS()

        // Adjust trainer name and date positioning for mobile download
        const adjustHeaderPositioning = () => {
          if (!cardRef.current) return
          const trainerName = cardRef.current.querySelector('[data-download-adjust-trainer="true"]') as HTMLElement
          const startDate = cardRef.current.querySelector('[data-download-adjust-date="true"]') as HTMLElement
          
          if (trainerName) {
            // At 2x scale: adjust text rendering by small amount to center properly
            trainerName.style.transform = 'translateY(-2px)'
            trainerName.style.fontWeight = '700' // Ensure weight is applied
          }
          if (startDate) {
            startDate.style.transform = 'translateY(-1px)'
            startDate.style.fontWeight = '500'
          }
          
          // Increase border-radius by 2px for mobile download only
          if (isMobile) {
            cardRef.current.style.borderRadius = '18px'  // 16px + 2px
          }
        }

        // Adjust XP positioning for download export
        // Logic: html2canvas renders at 2x scale, which can shift text positioning
        // We compensate by adjusting bottom and left to match the visual appearance
        const adjustXPPositioning = () => {
          if (!cardRef.current) return
          const xpElement = cardRef.current.querySelector('[data-download-adjust="true"]') as HTMLElement
          if (xpElement) {
            // Desktop: moved 13px down (17% of original 75px), 5px right
            // Mobile: apply similar percentage-based shift
            // Mobile original: bottom 52px, left 11px
            // Mobile adjustment: +9px down (17% of 52px ≈ 9px), +2px right (18% of 11px ≈ 2px)
            xpElement.style.bottom = isMobile ? '61px' : '95px'
            xpElement.style.left = isMobile ? '13px' : '33px'
          }
        }
        
        adjustHeaderPositioning()
        adjustXPPositioning()

        // Pixel-perfect export configuration with image support
        // IMPORTANT: Use fixed scale of 2 for consistent production rendering
        // This ensures dimensions don't change between dev and production
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: null,
          scale: 2, // Fixed scale for consistency across all environments (development, production, all devices)
          useCORS: true,
          allowTaint: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: cardRef.current.offsetWidth * 2,
          windowHeight: cardRef.current.offsetHeight * 2,
          imageTimeout: 30000, // Extended timeout for reliable image loading
          proxy: undefined, // Don't use proxy
          foreignObjectRendering: false,
          onclone: (clonedDocument) => {
            // Set crossOrigin on all images in the cloned document
            const clonedImages = clonedDocument.querySelectorAll('img')
            clonedImages.forEach((img: any) => {
              img.crossOrigin = 'anonymous'
              // Ensure image sources are accessible
              if (img.src && !img.src.startsWith('http') && !img.src.startsWith('data')) {
                img.src = img.src // Refresh the source
              }
            })
          }
        })

        // Create download link
        const link = document.createElement('a')
        link.download = `playerzero-${profile.trainer_name}-summit-card.png`
        link.href = canvas.toDataURL('image/png', 1.0)
        link.click()

        // Restore original header positioning
        const trainerName = cardRef.current?.querySelector('[data-download-adjust-trainer="true"]') as HTMLElement
        const startDate = cardRef.current?.querySelector('[data-download-adjust-date="true"]') as HTMLElement
        
        if (trainerName) {
          trainerName.style.transform = 'translateY(0)'
        }
        if (startDate) {
          startDate.style.transform = 'translateY(0)'
          startDate.style.marginRight = '0px'
        }
        
        // Restore original border-radius
        if (cardRef.current && isMobile) {
          cardRef.current.style.borderRadius = '16px'  // Restore to original
        }

        // Restore original XP positioning
        const xpElement = cardRef.current?.querySelector('[data-download-adjust="true"]') as HTMLElement
        if (xpElement) {
          xpElement.style.bottom = isMobile ? '52px' : '75px'
          xpElement.style.left = isMobile ? '11px' : '28px'
        }

      // Show success message
      setDownloadSuccess(true)
      
      // Auto-close after showing success
        setTimeout(() => {
            onClose()
      }, 1500)
      } catch (error) {
        console.error('Download failed:', error)
          alert('Failed to download card. Please try again.')
        // Restore header positioning even on error
        const trainerName = cardRef.current?.querySelector('[data-download-adjust-trainer="true"]') as HTMLElement
        const startDate = cardRef.current?.querySelector('[data-download-adjust-date="true"]') as HTMLElement
        
        if (trainerName) {
          trainerName.style.transform = 'translateY(0)'
        }
        if (startDate) {
          startDate.style.transform = 'translateY(0)'
          startDate.style.marginRight = '0px'
        }
        
        // Restore original border-radius on error
        if (cardRef.current && isMobile) {
          cardRef.current.style.borderRadius = '16px'  // Restore to original
        }
        
        // Restore positioning even on error
        const xpElement = cardRef.current?.querySelector('[data-download-adjust="true"]') as HTMLElement
        if (xpElement) {
          xpElement.style.bottom = isMobile ? '52px' : '75px'
          xpElement.style.left = isMobile ? '11px' : '28px'
        }
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

  // Check if user has achieved level 80 (203.353 million XP AND level 80)
  // Gold card only when BOTH XP >= 203,353,000 AND level >= 80
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

  // Calculate summit date with level parameter
  const summitDate = calculateSummitDate(profile.total_xp || 0, profile.average_daily_xp || 0, profile.start_date, profile.trainer_level)

  // Ensure consistent card dimensions in production
  // This function validates that card size is preserved during export
  const getConsistentCardDimensions = () => {
    return {
      width: isMobile ? '224px' : '400px',
      height: isMobile ? '336px' : '600px',
      borderRadius: isMobile ? '16px' : '28px'
    }
  }

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
        // Close when clicking backdrop
        if (e.target === e.currentTarget && !isDownloading) {
          onClose()
        }
      }}
    >

      <div 
        ref={cardRef}
        style={{ 
          position: 'relative',
          width: getConsistentCardDimensions().width,
          height: getConsistentCardDimensions().height,
          margin: 0,
          padding: 0,
          border: 'none',
          overflow: 'hidden',
          borderRadius: getConsistentCardDimensions().borderRadius,
          fontFamily: 'Poppins, sans-serif',
          // Production fix: Ensure these dimensions are not affected by media queries
          boxSizing: 'border-box' as const
        }}
      >
        {/* Background Image as actual img tag for better quality */}
        <img
          src={hasAchievedLevel80 ? '/images/achieved.png' : '/images/summit.png'}
          alt="Card Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: 1
          }}
        />
        {/* Trainer Name - Top Left */}
        <div 
          data-download-adjust-trainer="true"
          style={{ 
          position: 'absolute',
          top: isMobile ? '27px' : '37px',
          left: isMobile ? '11px' : '27px',
          fontFamily: 'Poppins, sans-serif',
          fontStyle: 'normal',
          fontWeight: '700',
          fontSize: isMobile ? '11px' : '20px',
          lineHeight: isMobile ? '17px' : '30px',
          color: '#FFFFFF',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          flex: 'none',
          order: 0,
          flexGrow: 0,
          zIndex: 2
        }}>
          {profile.trainer_name}
        </div>
        
        {/* Start Date - Top Right */}
        <div 
          data-download-adjust-date="true"
          style={{ 
          position: 'absolute',
          top: isMobile ? '29px' : '39px',
          right: isMobile ? '17px' : '39px',
          fontFamily: 'Poppins, sans-serif',
          fontStyle: 'normal',
          fontWeight: '500',
          fontSize: isMobile ? '8px' : '14px',
          lineHeight: isMobile ? '12px' : '21px',
          textAlign: 'right',
          color: '#DC2627',
          textShadow: '1px 1px 3px rgba(248, 17, 17, 0.8)',
          flex: 'none',
          order: 1,
          flexGrow: 0,
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
            fontWeight: '700',
            fontSize: isMobile ? '16px' : '28px',
            lineHeight: isMobile ? '24px' : '42px',
            color: '#DC2627',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            flex: 'none',
            order: 0,
            flexGrow: 0,
            zIndex: 2
          }}>
            {summitDate}
          </div>
        )}

        {/* XP Display - Bottom (shows remaining XP for summit, total XP for achieved) */}
        <div 
          data-download-adjust="true"
          style={{ 
            position: 'absolute',
            bottom: isMobile ? '52px' : '75px',
            left: isMobile ? '11px' : '28px',
            fontFamily: 'Poppins, sans-serif',
            fontStyle: 'normal',
            fontWeight: '700',
            fontSize: isMobile ? '22px' : '40px',
            lineHeight: isMobile ? '26px' : '36px',
            color: '#DC2627',
            textShadow: '2px 2px 4px rgba(241, 12, 12, 0.8)',
            flex: 'none',
            order: 0,
            flexGrow: 0,
            zIndex: 2
          }}>
          {hasAchievedLevel80 ? currentXP.toLocaleString() : xpRemaining.toLocaleString()}
        </div>

        {/* PlayerZERO Logo - Bottom Right */}
        <div style={{
          position: 'absolute',
          bottom: isMobile ? '6px' : '12px',
          right: isMobile ? '12px' : '20px',
          fontFamily: 'Poppins, sans-serif',
          fontStyle: 'normal',
          fontWeight: '500',
          fontSize: isMobile ? '8px' : '14px',
          lineHeight: isMobile ? '12px' : '21px',
          color: '#FFFFFF',
          textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
          flex: 'none',
          order: 0,
          flexGrow: 0,
          zIndex: 2
        }}>
        </div>
      </div>

      {/* Action Buttons Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Close Button */}
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
            fontWeight: '600',
            fontSize: '14px',
            color: '#FFFFFF',
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            opacity: isDownloading ? 0.5 : 1,
            transition: 'all 0.2s ease',
            minWidth: '100px'
          }}
          onMouseEnter={(e) => {
            if (!isDownloading) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
          }}
        >
          Close
        </button>

        {/* Share Button */}
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
            fontWeight: '600',
            fontSize: '14px',
            color: '#FFFFFF',
            cursor: (isDownloading || downloadSuccess) ? 'not-allowed' : 'pointer',
            opacity: (isDownloading || downloadSuccess) ? 0.8 : 1,
            transition: 'all 0.2s ease',
            minWidth: '140px',
            boxShadow: '0 4px 12px rgba(220, 38, 39, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!isDownloading && !downloadSuccess) {
              e.currentTarget.style.background = '#B91C1C'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 39, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (!downloadSuccess) {
              e.currentTarget.style.background = '#DC2627'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 39, 0.3)'
            }
          }}
        >
          {isDownloading ? (
            <>
              Generating...
            </>
          ) : downloadSuccess ? (
            <>
              ✓ Downloaded
            </>
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
