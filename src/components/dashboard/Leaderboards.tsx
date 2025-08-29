import { useState } from 'react'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { useValuePropModal } from '../../hooks/useValuePropModal'
import { ValuePropModal } from '../upgrade/ValuePropModal'
import { QuickProfileView } from '../profile/QuickProfileView'

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
        <div className="profile-preview-modal">
          <div className="modal-backdrop" onClick={handleCloseQuickView}></div>
          <div className="modal-content">
            <div className="modal-inner">
              <button className="modal-close" onClick={handleCloseQuickView}>×</button>
              <div className="quick-profile-container">
                <QuickProfileView 
                  profileId={selectedProfile}
                  isOpen={true}
                  onClose={handleCloseQuickView}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 