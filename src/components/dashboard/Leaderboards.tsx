import { useState } from 'react'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { useValuePropModal } from '../../hooks/useValuePropModal'
import { ValuePropModal } from '../upgrade/ValuePropModal'
import { PlyrZeroProfileStandalone } from '../profile/PlyrZeroProfileStandalone'

import { LeaderboardView } from './LeaderboardView'
import { MobileFooter } from '../layout/MobileFooter'

interface LeaderboardsProps {
  isPaidUser: boolean
}

export const Leaderboards = ({ }: LeaderboardsProps) => {
  const trialStatus = useTrialStatus()
  const { isOpen, closeValueProp, daysRemaining } = useValuePropModal()
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const handleCloseQuickView = () => {
    setSelectedProfile(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="pb-0 w-full">
        <div className="w-full">
          <LeaderboardView userType={trialStatus.isPaidUser ? "upgraded" : "trial"} />
        </div>
      </main>

      <MobileFooter currentPage="leaderboard" />
      
      {/* Keep modals for functionality */}
      <ValuePropModal 
        isOpen={isOpen} 
        onClose={closeValueProp} 
        daysRemaining={daysRemaining} 
      />
      
      {/* Profile Preview Modal */}
      {selectedProfile && (
        <>
          {/* Subtle backdrop */}
          <div 
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 999
            }}
            onClick={handleCloseQuickView}
          />
          {/* Centered profile */}
          <div style={{ 
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            maxHeight: '90vh',
            overflow: 'auto',
            maxWidth: '90vw'
          }}>
            <PlyrZeroProfileStandalone 
              profileId={selectedProfile}
              isOpen={true}
              onClose={handleCloseQuickView}
            />
          </div>
        </>
      )}
    </div>
  )
} 