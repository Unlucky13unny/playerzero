import { useNavigate } from 'react-router-dom'
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

  const handleUpgradeClick = () => {
    navigate('/upgrade')
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
        style={{ 
          backgroundImage: 'url(/images/summit.png)',
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
          borderRadius: isMobile ? '31px' : '55px'
        }}
        onClick={(e) => e.stopPropagation()}
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

        {/* Summit Date - Center */}
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
