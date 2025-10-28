import { useState, useEffect } from "react"
import { VerificationScreenshotsModal } from "./VerificationScreenshotsModal"
import { useAuth } from "../../contexts/AuthContext"
import { dashboardService } from "../../services/dashboardService"

interface VerificationSectionProps {
  profileUserId?: string // Optional - if provided, show verification for that user instead of current user
}

export function VerificationSection({ profileUserId }: VerificationSectionProps) {
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [lastVerification, setLastVerification] = useState<any>(null)
  const { user } = useAuth()

  useEffect(() => {
    loadLastVerification()
  }, [user, profileUserId])

  const loadLastVerification = async () => {
    // Use profileUserId if provided (for viewing other users), otherwise use current user
    const targetUserId = profileUserId || user?.id
    if (!targetUserId) return
    
    try {
      const verificationData = await dashboardService.getVerificationScreenshots(targetUserId, 1)
      if (verificationData && verificationData.length > 0) {
        setLastVerification(verificationData[0])
      }
    } catch (err: any) {
      console.error('Error loading verification data:', err)
    }
  }

  return (
    <div 
      style={{
        /* Container positioning */
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        
        width: '110%',
        maxWidth: '350px',
        margin: '0 auto',
      }}
    >
      {/* Frame 597 styling - Verification Section */}
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
        <div style={{
          /* Frame 598 */
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0px 20px',
          gap: '16px',
          width: '100%',
          height: '41px',
          /* Inside auto layout */
          flex: 'none',
          order: 0,
          flexGrow: 0,
        }}>
          {/* Left side: Status verified icon and text - Clickable to open verification modal */}
          <button 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            onClick={() => setShowVerificationModal(true)}
            title="View verification screenshots"
          >
            <div className="flex items-center justify-center flex-shrink-0">
              <svg width="38" height="35" viewBox="0 0 40 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="1" width="39" height="39" rx="3.5" fill="#2BC49C" fillOpacity="0.09"/>
                <rect x="0.5" y="1" width="39" height="39" rx="3.5" stroke="#2BC49C"/>
                <path d="M20 11.125L27.875 14.125V21.625C27.875 25 24.875 28.375 20 29.875C15.125 28.375 12.125 25.375 12.125 21.625V14.125L20 11.125Z" stroke="#2BC49C" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.625 20.125L18.875 22.375L23.375 17.125" stroke="#2BC49C" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <div style={{ 
                fontFamily: 'Poppins',
                fontSize: '11px',
                fontWeight: 500,
                color: '#2BC49C'
              }}>
                {lastVerification ? 'Stats verified' : 'No verification yet'}
              </div>
              <div style={{ 
                fontFamily: 'Poppins',
                fontSize: '10px',
                fontWeight: 400,
                color: '#2BC49C'
              }}>
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
          </button>
          
          {/* Right side: View screenshots button */}
          <button 
            className="text-green-600 hover:text-green-700 transition-colors flex-shrink-0"
            onClick={() => setShowVerificationModal(true)}
            title="View verification screenshots"
          >
            <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.33329 12.1667H11.6666C11.8876 12.1667 12.0996 12.0789 12.2559 11.9226C12.4122 11.7663 12.5 11.5543 12.5 11.3333C12.5 11.1123 12.4122 10.9004 12.2559 10.7441C12.0996 10.5878 11.8876 10.5 11.6666 10.5H8.33329C8.11228 10.5 7.90032 10.5878 7.74404 10.7441C7.58776 10.9004 7.49996 11.1123 7.49996 11.3333C7.49996 11.5543 7.58776 11.7663 7.74404 11.9226C7.90032 12.0789 8.11228 12.1667 8.33329 12.1667ZM15.8333 3H4.16663C3.50358 3 2.8677 3.26339 2.39886 3.73223C1.93002 4.20107 1.66663 4.83696 1.66663 5.5V8C1.66663 8.22101 1.75442 8.43297 1.9107 8.58926C2.06698 8.74554 2.27895 8.83333 2.49996 8.83333H3.33329V15.5C3.33329 16.163 3.59668 16.7989 4.06553 17.2678C4.53437 17.7366 5.17025 18 5.83329 18H14.1666C14.8297 18 15.4656 17.7366 15.9344 17.2678C16.4032 16.7989 16.6666 16.163 16.6666 15.5V8.83333H17.5C17.721 8.83333 17.9329 8.74554 18.0892 8.58926C18.2455 8.43297 18.3333 8.22101 18.3333 8V5.5C18.3333 4.83696 18.0699 4.20107 17.6011 3.73223C17.1322 3.26339 16.4963 3 15.8333 3ZM15 15.5C15 15.721 14.9122 15.933 14.7559 16.0893C14.5996 16.2455 14.3876 16.3333 14.1666 16.3333H5.83329C5.61228 16.3333 5.40032 16.2455 5.24404 16.0893C5.08776 15.933 4.99996 15.721 4.99996 15.5V8.83333H15V15.5ZM16.6666 7.16667H3.33329V5.5C3.33329 5.27899 3.42109 5.06702 3.57737 4.91074C3.73365 4.75446 3.94561 4.66667 4.16663 4.66667H15.8333C16.0543 4.66667 16.2663 4.75446 16.4225 4.91074C16.5788 5.06702 16.6666 5.27899 16.6666 5.5V7.16667Z" fill="#2BC49C"/>
            </svg>
          </button>
          
        </div>
        
      </div>

      {/* Transparency notice - positioned after verified box */}
      <div style={{
        width: '100%',
        marginTop: '8px',
        order: 3 // Ensure it comes after the verified box
      }}>
       
      </div>

      {/* Verification Screenshots Modal */}
      {showVerificationModal && (profileUserId || user?.id) && (
        <VerificationScreenshotsModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          userId={profileUserId || user?.id || ''}
        />
      )}
    </div>
  )
}
