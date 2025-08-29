import { Share2, Shield, Copy } from "lucide-react"
import { useState, useEffect } from "react"
import { ExportCardModal } from "../dashboard/ExportCardModal"
import { useAuth } from "../../contexts/AuthContext"
import { useTrialStatus } from "../../hooks/useTrialStatus"
import { supabase } from "../../supabaseClient"
import { dashboardService } from "../../services/dashboardService"

export function ShareablesHub() {
  const [showExportModal, setShowExportModal] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [lastVerification, setLastVerification] = useState<any>(null)
  const { user } = useAuth()
  const trialStatus = useTrialStatus()

  useEffect(() => {
    loadProfile()
    loadLastVerification()
  }, [user])

  const loadProfile = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (err: any) {
      console.error('Error loading profile for ShareablesHub:', err)
    }
  }

  const loadLastVerification = async () => {
    if (!user?.id) return
    
    try {
      const verificationData = await dashboardService.getVerificationScreenshots(user.id, 1)
      if (verificationData && verificationData.length > 0) {
        setLastVerification(verificationData[0])
      }
    } catch (err: any) {
      console.error('Error loading verification data:', err)
    }
  }

  const handleExportClick = () => {
    setShowExportModal(true)
  }
  return (
    <div 
      style={{
        /* Container positioning */
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        padding: '20px',
        gap: '16px',
        width: '100%',
        maxWidth: '290px',
        margin: '0 auto',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="cursor-pointer hover:opacity-70 transition-opacity" 
          onClick={handleExportClick}
          title="Open export card modal"
        >
          <Share2 
            className="w-5 h-5" 
            style={{ color: '#000000' }} 
          />
        </div>
        <h3 className="text-lg font-bold" style={{ color: '#000000' }}>Shareables Hub</h3>
      </div>

      <p className="text-xs mt-2 justify-left" style={{ color: '#000000', fontSize: '10px' }}>
        Create shareable cards of your achievements and stats. Show off your progress and let the community verify your
        accomplishments.
      </p>

      {/* Frame 597 styling */}
      <div 
        style={{
          /* Frame 597 specifications */
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0px 20px',
          gap: '24px',
          width: '100%',
          height: '65px',
          background: 'rgba(43, 196, 156, 0.09)',
          border: '1px solid #2BC49C',
          borderRadius: '8px',
          /* Inside auto layout */
          flex: 'none',
          order: 2,
          alignSelf: 'stretch',
          flexGrow: 0,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="font-medium" style={{ color: '#000000' }}>
              {lastVerification ? 'Stats verified' : 'No verification yet'}
            </div>
            <div className="text-sm" style={{ color: '#000000' }}>
              {lastVerification 
                ? `Uploaded ${new Date(lastVerification.entry_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}`
                : 'Upload stats to verify'
              }
            </div>
            
          </div>
          
          <button 
            className="text-green-600 hover:text-green-700 transition-colors"
            onClick={handleExportClick}
            title="Open export card modal"
          >
            <Copy className="w-4 h-4" />
          </button>
          
        </div>
        
      </div>

      <p className="text-center mt-2" style={{ color: '#000000', fontSize: '9px' }}>
        Screenshots are publicly viewable for transparency and anti-cheat verification
      </p>

      {/* Export Card Modal */}
      <ExportCardModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        profile={profile}
        isPaidUser={trialStatus.isPaidUser}
      />
      
    </div>
  )
}
