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
            resolve(true) // Continue even if image fails
          }
          img.src = '/images/grind.png'
        })

        // Wait for the card to render properly
        await new Promise(resolve => setTimeout(resolve, 300))

        if (!cardRef.current) return

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

        // Calculate scale to ensure download is always high quality
        // Target download size: 800×1200 (2x for retina/social media quality)
        const currentWidth = isMobile ? 224 : 400
        const targetDownloadWidth = 800  // Always download at high resolution
        const downloadScale = targetDownloadWidth / currentWidth  // 2x for desktop, ~3.57x for mobile
        
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: null,
          scale: downloadScale, // Download at consistent high resolution (800×1200)
          useCORS: true,
          allowTaint: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight
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

  // Calculate daily rates for all stats (preserve business logic)
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

  // Detect mobile view
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

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
          backgroundImage: 'url(/images/grind.png)',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          width: isMobile ? '224px' : '400px',
          height: isMobile ? '336px' : '600px',
          margin: 0,
          padding: 0,
          border: 'none',
          borderRadius: isMobile ? '12px' : '30px',
          overflow: 'hidden',
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        {/* Trainer Name - Top Left */}
        <div style={{ 
          position: 'absolute',
          top: isMobile ? '27px' : '41px',
          left: isMobile ? '17px' : '30px',
          fontFamily: 'Poppins',
          fontStyle: 'normal',
          fontWeight: '700',
          fontSize: isMobile ? '12px' : '20px',
          lineHeight: isMobile ? '17px' : '30px',
          color: '#FFFFFF',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          letterSpacing: '0.5px',
          zIndex: 10
        }}>
          {profile.trainer_name}
        </div>
        
        {/* Start Date - Top Right */}
        <div style={{ 
          position: 'absolute',
          top: isMobile ? '27px' : '38px',
          right: isMobile ? '17px' : '35px',
          textAlign: 'right',
          zIndex: 10
        }}>
          <div style={{ 
            fontFamily: 'Poppins, sans-serif',
            fontStyle: 'normal',
            fontWeight: '700',
            fontSize: isMobile ? '8px' : '14px',
            lineHeight: isMobile ? '12px' : '21px',
            color: '#DC2627',
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)'
          }}>
            {startDate}
          </div>
        </div>

        {/* Stats Section - Frame 752 */}
        <div style={{ 
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '0px',
          width: isMobile ? '202px' : '360px',
          left: isMobile ? '11px' : '20px',
          top: isMobile ? '190px' : '300px'
        }}>
          {/* ALL TIME Header */}
            <div style={{ 
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: '700',
            fontSize: isMobile ? '11px' : '20px',
            lineHeight: isMobile ? '17px' : '30px',
            color: '#DC2627',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            flex: 'none',
            order: 0,
            flexGrow: 0,
            marginBottom: isMobile ? '2px' : '10px',
            marginLeft: isMobile ? '6px' : '14px',
            textAlign: 'left'
          }}>
            ALL TIME
          </div>

          {/* Frame 751 - Stats Container */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '0px',
            gap: isMobile ? '2px' : '2px',
            marginLeft: isMobile ? '6px' : '10px',
            width: '100%',
            flex: 'none',
            order: 1,
            alignSelf: 'stretch',
            flexGrow: 0
          }}>
            {/* Frame 748 - Pokemon Caught Row */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0px',
              width: '100%',
              height: isMobile ? '16px' : '28px',
              flex: 'none',
              order: 0,
              alignSelf: 'stretch',
              flexGrow: 0
            }}>
              {/* Frame 747 - Label and Value */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '0px',
                gap: isMobile ? '3px' : '6px',
                height: isMobile ? '16px' : '28px',
                flex: 'none',
                order: 0,
                flexGrow: 0
              }}>
                {/* Pokémon Caught Label */}
                <div style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  fontSize: isMobile ? '6px' : '11px',
                  lineHeight: isMobile ? '9px' : '16px',
                  textAlign: 'center',
                  color: '#D1D1D1',
                  textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  whiteSpace: 'nowrap'
                }}>
                  Pokémon Caught
                </div>
                {/* Value */}
                <div style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: '600',
                  fontSize: isMobile ? '8px' : '14px',
                  lineHeight: isMobile ? '12px' : '21px',
                  textAlign: 'center',
                  color: '#FFFFFF',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0
                }}>
                  {(profile.pokemon_caught || 0).toLocaleString()}
                </div>
              </div>
              {/* Daily Badge */}
              <div style={{
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: isMobile ? '0px 5px' : '0px 10px',
                gap: isMobile ? '3px' : '6px',
                width: isMobile ? '50px' : '88px',
                height: isMobile ? '14px' : '24px',
                background: 'rgba(219, 22, 27, 0.5)',
                border: '1px solid #DC2627',
                borderRadius: isMobile ? '8px' : '15px',
                marginRight: isMobile ? '10px' : '15px',
                flex: 'none',
                order: 1,
                flexGrow: 0
              }}>
                <div style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  fontSize: isMobile ? '6px' : '10px',
                  lineHeight: isMobile ? '9px' : '15px',
                  textAlign: 'center',
                  color: '#FFFFFF',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  whiteSpace: 'nowrap'
                }}>
                  {pokemonPerDay} daily
                </div>
              </div>
            </div>

            {/* Frame 749 - Distance Walked Row */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0px',
              width: '100%',
              height: isMobile ? '16px' : '28px',
              
              flex: 'none',
              order: 1,
              alignSelf: 'stretch',
              flexGrow: 0
            }}>
              {/* Frame 747 - Label and Value */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '0px',
                gap: isMobile ? '3px' : '6px',
                height: isMobile ? '16px' : '28px',
                flex: 'none',
                order: 0,
                flexGrow: 0
              }}>
                {/* Distance Walked Label */}
                <div style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  fontSize: isMobile ? '6px' : '11px',
                  lineHeight: isMobile ? '9px' : '16px',
                  textAlign: 'center',
                  color: '#D1D1D1',
                  textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  whiteSpace: 'nowrap'
                }}>
                  Distance Walked
                </div>
                {/* Value */}
                <div style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: '600',
                  fontSize: isMobile ? '8px' : '14px',
                  lineHeight: isMobile ? '12px' : '21px',
                  textAlign: 'center',
                  color: '#FFFFFF',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0
                }}>
                  {(profile.distance_walked || 0).toLocaleString()}
                </div>
              </div>
              {/* Daily Badge */}
              <div style={{
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: isMobile ? '0px 5px' : '0px 10px',
                gap: isMobile ? '3px' : '6px',
                width: isMobile ? '50px' : '88px',
                height: isMobile ? '14px' : '24px',
                background: 'rgba(219, 22, 27, 0.5)',
                border: '1px solid #DC2627',
                marginRight: isMobile ? '10px' : '15px',
                borderRadius: isMobile ? '8px' : '15px',
                flex: 'none',
                order: 1,
                flexGrow: 0
              }}>
                <div style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  fontSize: isMobile ? '6px' : '10px',
                  lineHeight: isMobile ? '9px' : '15px',
                  textAlign: 'center',
                  color: '#FFFFFF',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  whiteSpace: 'nowrap'
                }}>
                  {distancePerDay} daily
                </div>
              </div>
            </div>

            {/* Frame 750 - Pokéstops Visited Row */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0px',
              width: '100%',
              height: isMobile ? '16px' : '28px',
              flex: 'none',
              order: 2,
              alignSelf: 'stretch',
              flexGrow: 0
            }}>
              {/* Frame 747 - Label and Value */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '0px',
                gap: isMobile ? '3px' : '6px',
                height: isMobile ? '16px' : '28px',
                flex: 'none',
                order: 0,
                flexGrow: 0
              }}>
                {/* Pokéstops Visited Label */}
                <div style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  fontSize: isMobile ? '6px' : '11px',
                  lineHeight: isMobile ? '9px' : '16px',
                  textAlign: 'center',
                  color: '#D1D1D1',
                  textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  whiteSpace: 'nowrap'
                }}>
                  Pokéstops Visited
                </div>
                {/* Value */}
            <div style={{ 
                  fontFamily: 'Poppins, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: '600',
                  fontSize: isMobile ? '8px' : '14px',
                  lineHeight: isMobile ? '12px' : '21px',
                  textAlign: 'center',
                  color: '#FFFFFF',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0
                }}>
                  {(profile.pokestops_visited || 0).toLocaleString()}
                </div>
          </div>
              {/* Daily Badge */}
              <div style={{
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: isMobile ? '10px' : '15px',
                padding: isMobile ? '0px 5px' : '0px 10px',
                gap: isMobile ? '3px' : '6px',
                width: isMobile ? '50px' : '88px',
                height: isMobile ? '14px' : '24px',
                background: 'rgba(219, 22, 27, 0.5)',
                border: '1px solid #DC2627',
                borderRadius: isMobile ? '8px' : '15px',
                flex: 'none',
                order: 1,
                flexGrow: 0
              }}>
            <div style={{ 
                  fontFamily: 'Poppins, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  fontSize: isMobile ? '6px' : '10px',
                  lineHeight: isMobile ? '9px' : '15px',
                  textAlign: 'center',
                  color: '#FFFFFF',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  whiteSpace: 'nowrap'
                }}>
                  {pokestopsPerDay} daily
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total XP Section - Frame 750 (Bottom Row) */}
        <div style={{ 
          position: 'absolute',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0px',
          width: isMobile ? '202px' : '360px',
          height: isMobile ? '29px' : '52px',
          left: isMobile ? '15px' : '30px',
          top: isMobile ? '270px' : '440px'
        }}>
          {/* Frame 747 - Label and Value (Column Layout) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '0px',
            flex: 'none',
            order: 0,
            flexGrow: 0
          }}>
            {/* Total XP Label */}
            <div style={{
              fontFamily: 'Poppins, sans-serif',
              fontStyle: 'normal',
              fontWeight: '500',
              fontSize: isMobile ? '8px' : '14px',
              lineHeight: '110%',
              textAlign: 'left',
              color: '#FFFFFF',
              textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
              flex: 'none',
              order: 0,
              flexGrow: 0,
              marginBottom: isMobile ? '2px' : '4px'
            }}>
              Total XP
            </div>
            {/* Value */}
            <div style={{
              fontFamily: 'Poppins, sans-serif',
              fontStyle: 'normal',
              fontWeight: '600',
              fontSize: isMobile ? '18px' : '32px',
              lineHeight: '110%',
              textAlign: 'left',
              color: '#FFFFFF',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
              flex: 'none',
              order: 1,
              flexGrow: 0
            }}>
              {(profile.total_xp || 0).toLocaleString()}
            </div>
          </div>

          {/* Daily Badge */}
          <div style={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: isMobile ? '0px 6px' : '0px 12px',
            gap: isMobile ? '3px' : '0px',
            marginRight: isMobile ? '6px' : '15px',
            width: isMobile ? '56px' : '100px',
            height: isMobile ? '16px' : '28px',
            background: 'rgba(219, 22, 27, 0.5)',
            border: '1px solid #DC2627',
            borderRadius: isMobile ? '8px' : '15px',
            flex: 'none',
            order: 1,
            flexGrow: 0
        }}>
          <div style={{ 
              fontFamily: 'Poppins, sans-serif',
              fontStyle: 'normal',
              fontWeight: '500',
              marginRight: isMobile ? '0px' : '20px',
              fontSize: isMobile ? '6px' : '11px',
              lineHeight: isMobile ? '9px' : '16px',
              textAlign: 'center',
              color: '#FFFFFF',
              flex: 'none',
              order: 0,
              flexGrow: 0,
              whiteSpace: 'nowrap'
            }}>
              {formattedDailyXP} daily
            </div>
          </div>
        </div>
        
        {/* PlayerZERO Logo */}
        <div style={{ 
          position: 'absolute',
          bottom: isMobile ? '7px' : '12px',
          right: isMobile ? '12px' : '20px',
          fontFamily: 'Poppins, sans-serif',
          fontStyle: 'normal',
          fontWeight: '700',
          fontSize: isMobile ? '8px' : '14px',
          lineHeight: isMobile ? '12px' : '21px',
          color: '#FFFFFF',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          letterSpacing: '0.8px'
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
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: '#FFFFFF',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
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

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
