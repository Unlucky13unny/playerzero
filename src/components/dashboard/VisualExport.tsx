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
  { value: 'blue', label: 'Blue', color: '#0074D9', team: 'Team Blue' },
  { value: 'red', label: 'Red', color: '#FF4136', team: 'Team Red' },
  { value: 'yellow', label: 'Yellow', color: '#FFDC00', team: 'Team Yellow' },
  { value: 'black', label: 'Black', color: '#111111', team: 'Team Black' },
  { value: 'green', label: 'Green', color: '#2ECC40', team: 'Team Green' },
  { value: 'orange', label: 'Orange', color: '#FF851B', team: 'Team Orange' },
  { value: 'purple', label: 'Purple', color: '#B10DC9', team: 'Team Purple' },
  { value: 'pink', label: 'Pink', color: '#F012BE', team: 'Team Pink' }
]

export const VisualExport = ({ profile, isPaidUser }: VisualExportProps) => {
  const navigate = useNavigate()
  const trialStatus = useTrialStatus()
  const [exporting, setExporting] = useState(false)
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null)
  const [cardType, setCardType] = useState<'all-time' | 'weekly' | 'monthly' | 'grind' | 'achievement'>('all-time')
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

  const isCardTypeAllowed = (type: 'all-time' | 'weekly' | 'monthly' | 'grind' | 'achievement') => {
    switch (type) {
      case 'all-time':
        return trialStatus.canGenerateAllTimeCard
      case 'grind':
        return trialStatus.canShareGrindCard
      case 'achievement':
        return trialStatus.canGenerateAllTimeCard // Achievement cards follow same rules as all-time
      case 'weekly':
      case 'monthly':
        return trialStatus.canViewWeeklyMonthlyCards
      default:
        return false
    }
  }

  const getRestrictedMessage = (type: 'all-time' | 'weekly' | 'monthly' | 'grind' | 'achievement') => {
    const timeLeft = trialStatus.timeRemaining.days > 0 
      ? `${trialStatus.timeRemaining.days}d ${trialStatus.timeRemaining.hours}h ${trialStatus.timeRemaining.minutes}m ${trialStatus.timeRemaining.seconds}s left`
      : trialStatus.timeRemaining.hours > 0 
      ? `${trialStatus.timeRemaining.hours}h ${trialStatus.timeRemaining.minutes}m ${trialStatus.timeRemaining.seconds}s left`
      : trialStatus.timeRemaining.minutes > 0
      ? `${trialStatus.timeRemaining.minutes}m ${trialStatus.timeRemaining.seconds}s left`
      : `${trialStatus.timeRemaining.seconds}s left`

    switch (type) {
      case 'all-time':
      case 'achievement':
        return trialStatus.isInTrial 
          ? `Available in private mode (${timeLeft})`
          : 'Available in private mode only'
      case 'grind':
        return trialStatus.isInTrial 
          ? `Available in private mode (${timeLeft})`
          : 'Available in private mode only'
      case 'weekly':
      case 'monthly':
        return 'Premium feature only'
      default:
        return 'Restricted'
    }
  }

  const selectedTeam = TEAM_COLORS.find(team => team.value === profile.team_color) || TEAM_COLORS[0]

  // Calculate projected dates and achievements
  const currentXP = profile.total_xp || 0
  const startDate = profile.start_date ? new Date(profile.start_date) : new Date()
  const daysSinceStart = Math.max(1, Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const dailyXPRate = currentXP / daysSinceStart
  
  // XP requirements for each level (simplified - Level 50 = 176M XP)
  const targetXP = profile.trainer_level >= 50 ? 176000000 : 176000000
  const daysToTarget = currentXP >= targetXP ? 0 : Math.ceil((targetXP - currentXP) / Math.max(dailyXPRate, 1))
  const projectedDate = new Date()
  projectedDate.setDate(projectedDate.getDate() + daysToTarget)

  // Calculate estimated catch rate based on pokestops vs pokemon ratio
  const estimatedCatchRate = Math.min(99.9, (profile.pokemon_caught || 0) / Math.max(1, (profile.pokestops_visited || 1)) * 100)
  
  // Estimate shinies based on average shiny rate (1/500)
  const estimatedShinies = Math.floor((profile.pokemon_caught || 0) / 500)
  
  // Calculate hourly catch rate based on daily XP (rough estimate)
  const estimatedHourlyCatchRate = (dailyXPRate / 24 / 100)

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
          <div className="card-template all-time-card">
            {/* Start Date - Top Right */}
            <div className="start-date-top">Start Date:</div>
            <div className="start-date-value">{startDate}</div>
            
            {/* Trainer Name - Top Left */}
            <div className="trainer-name-header">{profile.trainer_name}</div>
            
            {/* Central Laptop Image */}
            <div className="laptop-container">
              <div className="laptop-screen">
                <div className="screen-text">GRIND REPORT</div>
                <div className="screen-stats">
                  <div className="stat-item">
                    <div className="stat-label">Daily XP</div>
                    <div className="stat-number">{(dailyXPRate / 1000).toFixed(2)}K</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Pokemon</div>
                    <div className="stat-number">{((profile.pokemon_caught || 0) / 1000).toFixed(1)}K</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Catch Rate</div>
                    <div className="stat-number">{estimatedCatchRate.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* All-time Label - Bottom Right */}
            <div className="all-time-label">All-time</div>
            
            {/* Pokemon Caught - Bottom Left */}
            <div className="pokemon-caught-section">
              <div className="stat-title">Pokemon Caught</div>
              <div className="stat-number">{(profile.pokemon_caught || 0).toLocaleString()}</div>
              <div className="stat-daily">{((profile.pokemon_caught || 0) / Math.max(1, Math.floor((new Date().getTime() - new Date(profile.start_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2)} /Day</div>
            </div>

            {/* Distance Walked - Bottom Center Left */}
            <div className="distance-walked-section">
              <div className="stat-title">Distance Walked</div>
              <div className="stat-number">{(profile.distance_walked || 0).toLocaleString()}</div>
                             <div className="stat-daily">{((profile.distance_walked || 0) / Math.max(1, Math.floor((new Date().getTime() - new Date(profile.start_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2)} /Day</div>
             </div>

             {/* Pokestops Visited - Bottom Left Lower */}
             <div className="pokestops-section">
               <div className="stat-title">Pokestops Visited</div>
               <div className="stat-number">{(profile.pokestops_visited || 0).toLocaleString()}</div>
               <div className="stat-daily">{((profile.pokestops_visited || 0) / Math.max(1, Math.floor((new Date().getTime() - new Date(profile.start_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2)} /Day</div>
            </div>

            {/* Total XP - Bottom Right */}
            <div className="total-xp-section">
              <div className="xp-title">Total XP</div>
              <div className="xp-number">{(profile.total_xp || 0).toLocaleString()}</div>
              <div className="xp-daily">{(dailyXPRate).toFixed(2)} /Day</div>
            </div>
            
            {/* PlayerZERO Logo - Bottom Right */}
            <div className="playerzero-logo">PlayerZERØ</div>
          </div>
        )

      case 'achievement':
        return (
          <div className="card-template achievement-card">
            {/* Start Date - Top Right */}
            <div className="start-date-top">Start Date:</div>
            <div className="start-date-value">{startDate}</div>
            
            {/* Trainer Name - Top Left */}
            <div className="trainer-name-header">{profile.trainer_name}</div>
            
            {/* Achievement Stamp - Rotated */}
            <div className="achievement-stamp">ACHIEVED</div>
            
            {/* Central Silhouette Figure */}
            <div className="achievement-figure">
              <div className="celebration-silhouette"></div>
            </div>
            
            {/* XP - Bottom Left */}
            <div className="achievement-xp">
              <div className="xp-label">XP</div>
              <div className="xp-value">{(profile.total_xp || 0).toLocaleString()}</div>
            </div>
            
            {/* Level Badge - Bottom Right */}
            <div className="level-badge">
              <div className="level-number">({profile.trainer_level || 50})</div>
              <div className="level-text">Summit</div>
            </div>
            
            {/* PlayerZERO Logo - Bottom Right */}
            <div className="playerzero-logo">PlayerZERØ</div>
          </div>
        )

      case 'grind':
        return (
          <div className="card-template grind-card">
            {/* Trainer Name - Top Left */}
            <div className="trainer-name-header">{profile.trainer_name}</div>
            
            {/* Location - Top Left under name */}
            <div className="grind-location">{profile.country || 'Unknown'}</div>
            
            {/* Central Trainer Silhouette */}
            <div className="trainer-silhouette">
              <div className="walking-figure"></div>
            </div>
            
            {/* Pokemon Caught - Left */}
            <div className="pokemon-caught-stat">
              <div className="stat-label">Pokemon Caught</div>
              <div className="stat-value">{(profile.pokemon_caught || 0).toLocaleString()}</div>
            </div>
            
            {/* Caught Per Hr - Left */}
            <div className="caught-per-hr-stat">
              <div className="stat-label">Caught Per Hr</div>
              <div className="stat-value">{estimatedHourlyCatchRate.toFixed(1)}</div>
            </div>
            
            {/* Shinies - Left */}
            <div className="shinies-stat">
              <div className="stat-label">Shinies</div>
              <div className="stat-value">{estimatedShinies}</div>
            </div>
            
            {/* Catch Rate - Right */}
            <div className="catch-rate-section">
              <div className="catch-rate-label">Catch Rate</div>
              <div className="catch-rate-value">{estimatedCatchRate.toFixed(1)}%</div>
            </div>
            
            {/* Community Day Badge - Bottom */}
            <div className="community-day-badge">
              <div className="badge-text">Community</div>
              <div className="badge-text-large">Day</div>
            </div>
            
            {/* PlayerZERO Logo - Bottom Right */}
            <div className="playerzero-logo">PlayerZERØ</div>
          </div>
        )

      case 'weekly':
      case 'monthly':
        return (
          <div className="card-template projection-card">
            {/* Start Date - Top Right */}
            <div className="start-date-top">Start Date:</div>
            <div className="start-date-value">{startDate}</div>
            
            {/* Trainer Name - Top Left */}
            <div className="trainer-name-header">{profile.trainer_name}</div>
            
            {/* Projected Date Section - Center */}
            <div className="projected-section">
              <div className="projected-label">Projected Date:</div>
              <div className="projected-date">{projectedDate.toLocaleDateString('en-US', { 
                month: '2-digit', 
                day: '2-digit', 
                year: 'numeric' 
              })}</div>
            </div>
            
            {/* Progress Bars - Left */}
            <div className="progress-bars">
              {Array.from({ length: 12 }, (_, i) => {
                // Calculate progress based on actual XP progression
                const monthlyProgress = ((profile.total_xp || 0) / targetXP) * 100
                const barHeight = Math.max(5, Math.min(25, (monthlyProgress / 12) * (i + 1) + (i * 2)))
                return (
                  <div 
                    key={i} 
                    className="progress-bar"
                    style={{ 
                      opacity: i < Math.floor(monthlyProgress / 10) ? 1 : 0.3,
                      height: `${barHeight}px`
                    }}
                  ></div>
                )
              })}
            </div>
            
            {/* XP Section - Bottom Center */}
            <div className="xp-section">
              <div className="xp-label">XP</div>
              <div className="xp-value">{Math.floor(targetXP - currentXP).toLocaleString()}</div>
            </div>
            
            {/* Level Badge - Bottom Right */}
            <div className="level-badge">
              <div className="level-number">({profile.trainer_level || 50})</div>
              <div className="level-text">Summit</div>
            </div>
            
            {/* PlayerZERO Logo - Bottom Right */}
            <div className="playerzero-logo">PlayerZERØ</div>
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
          className={`card-type-tab ${cardType === 'achievement' ? 'active' : ''} ${!isCardTypeAllowed('achievement') ? 'restricted' : ''}`}
          onClick={() => isCardTypeAllowed('achievement') && setCardType('achievement')}
          disabled={!isCardTypeAllowed('achievement')}
          title={!isCardTypeAllowed('achievement') ? getRestrictedMessage('achievement') : ''}
        >
          🏆 Achievement
          {!isCardTypeAllowed('achievement') && <span className="restriction-badge">🔒</span>}
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
      <div className="card-preview-container">
        <div ref={cardRef} className="card-container">
          {renderCard()}
        </div>
      </div>
    </div>
  )
} 