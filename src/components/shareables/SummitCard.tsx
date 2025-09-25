import { useNavigate } from 'react-router-dom'
import { FaTimes } from 'react-icons/fa'
import type { ProfileWithMetadata } from '../../services/profileService'
import { calculateSummitDate } from '../../services/profileService'
import { useTrialStatus } from '../../hooks/useTrialStatus'

interface SummitCardProps {
  profile: ProfileWithMetadata | null
  onClose: () => void
  isPaidUser: boolean
}

export const SummitCard = ({ profile, onClose, isPaidUser }: SummitCardProps) => {
  const navigate = useNavigate()
  const trialStatus = useTrialStatus()

  const handleUpgradeClick = () => {
    navigate('/upgrade')
  }

  if (!profile) return null

  // Show locked content if user is not subscribed and not in trial
  if (!isPaidUser && !trialStatus.isInTrial) {
    return (
      <div className="export-modal-overlay" onClick={onClose}>
        <div className="export-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="export-modal-header">
            <h2>Summit Card</h2>
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

  const startDate = profile.start_date ? new Date(profile.start_date + 'T00:00:00').toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  }) : new Date().toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  })

  // Calculate summit date (same as ExportCardModal)
  const summitDate = calculateSummitDate(profile.total_xp || 0, profile.average_daily_xp || 0, profile.start_date)

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div 
        className="card-template summit-card web-card" 
        style={{ 
          backgroundImage: 'url(/images/summit.png)',
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
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

        {/* Summit Date - Above Total XP */}
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
    </div>
  )
}
