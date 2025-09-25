 import { useNavigate } from 'react-router-dom'
import { FaTimes } from 'react-icons/fa'
import type { ProfileWithMetadata } from '../../services/profileService'
import { useTrialStatus } from '../../hooks/useTrialStatus'

interface GrindCardProps {
  profile: ProfileWithMetadata | null
  onClose: () => void
  isPaidUser: boolean
}

export const GrindCard = ({ profile, onClose, isPaidUser }: GrindCardProps) => {
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
            <h2>Grind Card</h2>
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

  // Calculate daily XP rate (same as ExportCardModal)
  const currentXP = profile?.total_xp || 0
  const startDateObj = profile?.start_date ? new Date(profile.start_date) : new Date()
  const daysSinceStart = Math.max(1, Math.floor((new Date().getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)))
  const dailyXPRate = currentXP / daysSinceStart
  const formattedDailyXP = dailyXPRate >= 1000 
    ? Math.round((dailyXPRate / 1000) * 10) / 10 + 'K'
    : Math.round(dailyXPRate * 10) / 10


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
        className="card-template all-time-card web-card" 
        style={{ 
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Trainer Name */}
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
        
        {/* Date */}
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
          top: '333px',
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
          top: '320px',
          bottom: '45px',
          right: '35px',
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold',
        }}>
          All-time
        </div>
      </div>
    </div>
  )
}
