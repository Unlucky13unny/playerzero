import { useNavigate } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
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

  const handleUpgradeClick = () => {
    navigate('/upgrade')
  }

  // Auto-download when component mounts
  useEffect(() => {
    let isMounted = true

    const downloadCard = async () => {
      if (!cardRef.current || !profile) return

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

        // Wait for the card to render properly
        await new Promise(resolve => setTimeout(resolve, 500))

        if (!isMounted || !cardRef.current) return

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

        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight
        })

        if (!isMounted) return

        // Create download link
        const link = document.createElement('a')
        link.download = `playerzero-${profile.trainer_name}-summit-card.png`
        link.href = canvas.toDataURL('image/png', 1.0)
        link.click()

        // Close after download
        setTimeout(() => {
          if (isMounted) {
            onClose()
          }
        }, 300)
      } catch (error) {
        console.error('Download failed:', error)
        if (isMounted) {
          alert('Failed to download card. Please try again.')
          onClose()
        }
      } finally {
        if (isMounted) {
          setIsDownloading(false)
        }
      }
    }

    if (profile && isPaidUser) {
      downloadCard()
    }

    return () => {
      isMounted = false
    }
  }, [profile, isPaidUser, onClose])

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

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        gap: '20px'
      }}
    >
      {/* Loading message */}
      <div style={{
        color: '#FFFFFF',
        fontFamily: 'Poppins, sans-serif',
        fontSize: '18px',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        {isDownloading ? 'Generating your card...' : 'Preparing download...'}
      </div>

      <div 
        ref={cardRef}
        style={{ 
          backgroundImage: `url(${hasAchievedLevel80 ? '/images/achieved.png' : '/images/summit.png'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          width: isMobile ? '224px' : '400px',
          height: isMobile ? '336px' : '600px',
          margin: 0,
          padding: 0,
          border: 'none',
          overflow: 'hidden',
          borderRadius: isMobile ? '12px' : '20px'
        }}
      >
        {/* Trainer Name - Top Left */}
        <div style={{ 
          position: 'absolute',
          top: isMobile ? '28px' : '51px',
          left: isMobile ? '12px' : '20px',
          fontFamily: 'Poppins, sans-serif',
          fontStyle: 'normal',
          fontWeight: '700',
          fontSize: isMobile ? '11px' : '20px',
          lineHeight: isMobile ? '16px' : '30px',
          color: '#FFFFFF',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          flex: 'none',
          order: 0,
          flexGrow: 0
        }}>
          {profile.trainer_name}
        </div>
        
        {/* Start Date - Top Right */}
        <div style={{ 
          position: 'absolute',
          top: isMobile ? '28px' : '51px',
          right: isMobile ? '12px' : '20px',
          fontFamily: 'Poppins, sans-serif',
          fontStyle: 'normal',
          fontWeight: '500',
          fontSize: isMobile ? '8px' : '14px',
          lineHeight: isMobile ? '12px' : '21px',
          textAlign: 'right',
          color: '#FFFFFF',
          textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
          flex: 'none',
          order: 1,
          flexGrow: 0
        }}>
          {startDate}
        </div>

        {/* Summit Date - Center (Hidden on Gold Achievement Card) */}
        {!hasAchievedLevel80 && (
          <div style={{ 
            position: 'absolute',
            top: isMobile ? '75px' : '130px',
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
            flexGrow: 0
          }}>
            {summitDate}
          </div>
        )}

        {/* Total XP - Bottom */}
        <div style={{ 
          position: 'absolute',
          bottom: isMobile ? '50px' : '100px',
          left: isMobile ? '18px' : '20px',
          fontFamily: 'Poppins, sans-serif',
          fontStyle: 'normal',
          fontWeight: '700',
          fontSize: isMobile ? '20px' : '40px',
          lineHeight: isMobile ? '28px' : '36px',
          color: '#DC2627',
          textShadow: '2px 2px 4px rgba(241, 12, 12, 0.8)',
          flex: 'none',
          order: 0,
          flexGrow: 0
        }}>
          {(profile.total_xp || 0).toLocaleString()} 
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
          flexGrow: 0
        }}>
        </div>
      </div>
    </div>
  )
}
