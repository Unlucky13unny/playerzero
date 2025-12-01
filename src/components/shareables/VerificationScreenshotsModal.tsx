import { useState, useEffect } from 'react'
import { X, ImageIcon } from "lucide-react"
import { dashboardService } from '../../services/dashboardService'
import { ReportModal } from '../moderation/ReportModal'
import { reportService } from '../../services/reportService'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { LoadingInline } from '../common/Loading'

interface VerificationScreenshotsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName?: string
}

interface ProofItem {
  id: string
  uploadDate: string
  isApproved: boolean
  screenshot_url: string
  created_at: string
}

export function VerificationScreenshotsModal({ isOpen, onClose, userId }: VerificationScreenshotsModalProps) {
  const trialStatus = useTrialStatus()
  const [screenshots, setScreenshots] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedScreenshotId, setSelectedScreenshotId] = useState<string | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [hasReported, setHasReported] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      loadScreenshots()
    }
  }, [isOpen, userId])

  const loadScreenshots = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await dashboardService.getVerificationScreenshots(userId, 7) // Get last 7 screenshots
      setScreenshots(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load screenshots')
    } finally {
      setLoading(false)
    }
  }

  const formatUploadDate = (dateString: string) => {
    // Add T12:00:00Z to prevent timezone shifting for date-only strings
    const date = new Date(dateString.includes('T') ? dateString : dateString + 'T12:00:00Z')
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleImageClick = async (imageUrl: string, screenshotId: string) => {
    setSelectedImage(imageUrl)
    setSelectedScreenshotId(screenshotId)
    
    // Check if user has already reported this screenshot
    const { hasReported: reported } = await reportService.hasUserReported(screenshotId)
    setHasReported(reported)
  }

  const closeImagePreview = () => {
    setSelectedImage(null)
    setSelectedScreenshotId(null)
    setHasReported(false)
  }

  const handleReportClick = () => {
    setShowReportModal(true)
  }

  const handleReportModalClose = () => {
    setShowReportModal(false)
  }

  const handleReportSubmitted = async () => {
    setHasReported(true)
    // Optionally reload screenshots to update report count
    await loadScreenshots()
  }

  // Transform screenshots data to ProofItem format
  const proofs: ProofItem[] = screenshots.map((screenshot) => ({
    id: screenshot.id,
    uploadDate: formatUploadDate(screenshot.stat_entries?.entry_date || screenshot.created_at),
    isApproved: true, // All screenshots in the system are considered approved
    screenshot_url: screenshot.screenshot_url,
    created_at: screenshot.created_at
  }))

  if (!isOpen) return null

  return (
    <>
      {/* Main Modal - Hide backdrop when image preview is open */}
      {!selectedImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
        {/* Frame 735 - Main Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '0px',
          gap: '16px',
          width: '352px',
          height: '422px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          {/* Header with close button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            padding: '16px',
            borderBottom: '1px solid #f0f0f0'
          }}>
            {/* Proofs Gallery Title */}
            <h2 style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 700,
              fontSize: '20px',
              lineHeight: '30px',
              color: '#000000',
              textAlign: 'left',
              flex: 'none',
              order: 0,
              marginRight: 'auto'
            }}>
              Proofs Gallery
            </h2>
          <button
            onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} color="#000000" />
          </button>
        </div>

          {/* Frame 732 - Proofs List Container */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '0px',
            width: '352px',
            height: '376px',
            overflowY: 'auto',
            flex: 'none',
            order: 1,
            alignSelf: 'stretch',
            flexGrow: 0
          }}>
          {loading ? (
              <LoadingInline message="Loading screenshots..." fontSize="14px" />
          ) : error ? (
              <div style={{
                textAlign: 'center',
                width: '100%',
                padding: '24px'
              }}>
                <p style={{
                  fontFamily: 'Poppins',
                  fontSize: '12px',
                  color: '#848282'
                }}>{error}</p>
            </div>
            ) : proofs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                width: '100%',
                padding: '24px'
              }}>
                <p style={{
                  fontFamily: 'Poppins',
                  fontSize: '12px',
                  color: '#848282'
                }}>No verification screenshots found</p>
            </div>
          ) : (
              proofs.map((proof, index) => (
                <div 
                  key={proof.id} 
                  style={{
                    /* Frame 729 */
                    /* Auto layout */
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0px 8px',
                    gap: '14px',
                    width: '352px',
                    height: '47px',
                    borderRadius: '6px',
                    /* Inside auto layout */
                    flex: 'none',
                    order: index,
                    alignSelf: 'stretch',
                    flexGrow: 0,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleImageClick(proof.screenshot_url, proof.id)}
                >
                  {/* Frame 733 - Left side with image icon and text */}
                  <div style={{
                    /* Frame 733 */
                    /* Auto layout */
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: '0px',
                    gap: '14px',
                    margin: '0 auto',
                    width: '178px',
                    height: '24px',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 0,
                    flexGrow: 0
                  }}>
                    {/* Image icon */}
                    <div style={{
                      /* Image */
                      width: '24px',
                      height: '24px',
                      position: 'relative',
                      /* Inside auto layout */
                      flex: 'none',
                      order: 0,
                      flexGrow: 0
                    }}>
                      <ImageIcon size={24} style={{
                        /* Vector */
                        position: 'absolute',
                        left: '9.38%',
                        right: '9.38%',
                        top: '15.62%',
                        bottom: '15.62%',
                        color: '#000000'
                      }} />
                    </div>
                    
                    {/* Upload date text */}
                    <span style={{
                      /* Uploaded Jul 15th, 2025 */
                      width: '140px',
                      height: '18px',
                      fontFamily: 'Poppins',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      fontSize: '12px',
                      lineHeight: '18px',
                      /* identical to box height */
                      textAlign: 'center',
                      color: '#000000',
                      /* Inside auto layout */
                      flex: 'none',
                      order: 1,
                      flexGrow: 0
                    }}>
                      Uploaded {proof.uploadDate}
                          </span>
                        </div>
                        
                  {/* Shield tick icon */}
                  <div style={{
                    /* charm:shield-tick */
                    boxSizing: 'border-box',
                    /* Auto layout */
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '0',
                    margin: '0 auto',
                    width: '40px',
                    height: '40px',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 1,
                    flexGrow: 0
                  }}>
                    <svg width="40" height="40" viewBox="0 0 40 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.5" y="1" width="39" height="39" rx="3.5" fill="#2BC49C" fillOpacity="0.09"/>
                      <rect x="0.5" y="1" width="39" height="39" rx="3.5" stroke="#2BC49C"/>
                      <path d="M20 11.125L27.875 14.125V21.625C27.875 25 24.875 28.375 20 29.875C15.125 28.375 12.125 25.375 12.125 21.625V14.125L20 11.125Z" stroke="#2BC49C" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16.625 20.125L18.875 22.375L23.375 17.125" stroke="#2BC49C" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              ))
          )}
        </div>
        </div>
                        </div>
      )}
                        
      {/* Image Preview Modal */}
      {selectedImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div className="verification-screenshot-wrapper" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            maxWidth: '1000px',
            gap: '20px'
          }}>
            {/* Main container - positioned to the left */}
            <div className="upload-list-sidebar" style={{
              position: 'relative',
              width: '352px',
              height: '422px',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              flexShrink: 0
            }}>
              {/* This is a duplicate of the main modal to maintain visual consistency */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '16px',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <h2 style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  fontSize: '20px',
                  lineHeight: '30px',
                  color: '#000000',
                  textAlign: 'left',
                  flex: 'none',
                  order: 0,
                  marginRight: 'auto'
                }}>
                  Proofs Gallery
                </h2>
                        </div>
              <div style={{
                height: '376px',
                overflowY: 'auto',
                padding: '16px'
              }}>
                {proofs.map((proof, index) => (
                  <div 
                    key={`preview-${proof.id}`} 
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0px 8px',
                      gap: '14px',
                      width: '100%',
                      height: '47px',
                      borderRadius: '6px',
                      flex: 'none',
                      order: index,
                      alignSelf: 'stretch',
                      flexGrow: 0,
                      backgroundColor: selectedImage === proof.screenshot_url ? 'rgba(43, 196, 156, 0.09)' : 'transparent'
                    }}
                    onClick={() => handleImageClick(proof.screenshot_url, proof.id)}
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: '0px',
                      gap: '14px',
                      margin: '0 auto',
                      width: '178px',
                      height: '24px',
                      flex: 'none',
                      order: 0,
                      flexGrow: 0
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        position: 'relative',
                        flex: 'none',
                        order: 0,
                        flexGrow: 0
                      }}>
                        <ImageIcon size={24} style={{
                          position: 'absolute',
                          left: '9.38%',
                          right: '9.38%',
                          top: '15.62%',
                          bottom: '15.62%',
                          color: '#000000'
                        }} />
                        </div>
                        
                      <span style={{
                        width: '140px',
                        height: '18px',
                        fontFamily: 'Poppins',
                        fontStyle: 'normal',
                        fontWeight: 400,
                        fontSize: '12px',
                        lineHeight: '18px',
                        textAlign: 'center',
                        color: '#000000',
                        flex: 'none',
                        order: 1,
                        flexGrow: 0
                      }}>
                        Uploaded {proof.uploadDate}
                          </span>
                        </div>
                    <div style={{
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '0',
                      margin: '0 auto',
                      width: '40px',
                      height: '40px',
                      flex: 'none',
                      order: 1,
                      flexGrow: 0
                    }}>
                      <svg width="40" height="40" viewBox="0 0 40 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.5" y="1" width="39" height="39" rx="3.5" fill="#2BC49C" fillOpacity="0.09"/>
                        <rect x="0.5" y="1" width="39" height="39" rx="3.5" stroke="#2BC49C"/>
                        <path d="M20 11.125L27.875 14.125V21.625C27.875 25 24.875 28.375 20 29.875C15.125 28.375 12.125 25.375 12.125 21.625V14.125L20 11.125Z" stroke="#2BC49C" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16.625 20.125L18.875 22.375L23.375 17.125" stroke="#2BC49C" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                        </div>
                  </div>
                ))}
                </div>
        </div>

            {/* Image preview container */}
            <div className="screenshot-display-panel" style={{
              position: 'relative',
              width: '352px',
              height: '422px',
              background: 'white',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
              flexShrink: 0
            }}>
              {/* Frame 653 - Report button - Only for paid users */}
              {trialStatus.isPaidUser && !hasReported && (
                <button
                  onClick={handleReportClick}
                  title="Report Suspicious Stats"
                  style={{
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '0px',
                    gap: '8px',
                    position: 'absolute',
                    width: '80px',
                    height: '28px',
                    right: '20px',
                    top: '20px',
                    border: '1px solid #000000',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: '600',
                    fontSize: '12px',
                    lineHeight: '18px',
                    color: '#000000',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  {/* lucide:info - Info Icon */}
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      flex: 'none',
                      order: 0,
                      flexGrow: 0
                    }}
                  >
                    <circle cx="12" cy="12" r="10" stroke="#000000" strokeWidth="2"/>
                    <line x1="12" y1="16" x2="12" y2="12" stroke="#000000" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="8" r="0.5" fill="#000000" stroke="#000000" strokeWidth="1"/>
                  </svg>
                  
                  {/* Report Text */}
                  <span style={{
                    width: '41px',
                    height: '18px',
                    flex: 'none',
                    order: 1,
                    flexGrow: 0
                  }}>
                    Report
                  </span>
                </button>
              )}

              {/* Already reported indicator - Only for paid users */}
              {trialStatus.isPaidUser && hasReported && (
                <div
                  title="You have already reported this screenshot"
                  style={{
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '0px',
                    gap: '8px',
                    position: 'absolute',
                    width: '80px',
                    height: '28px',
                    right: '20px',
                    top: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: '4px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    cursor: 'not-allowed',
                    opacity: '0.7',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: '600',
                    fontSize: '12px',
                    lineHeight: '18px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    zIndex: 10
                  }}
                >
                  {/* Info Icon - Greyed Out */}
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      flex: 'none',
                      order: 0,
                      flexGrow: 0
                    }}
                  >
                    <circle cx="12" cy="12" r="10" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2"/>
                    <line x1="12" y1="16" x2="12" y2="12" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="8" r="0.5" fill="rgba(255, 255, 255, 0.4)" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1"/>
                  </svg>
                  
                  {/* Text */}
                  <span style={{
                    width: '41px',
                    height: '18px',
                    flex: 'none',
                    order: 1,
                    flexGrow: 0
                  }}>
                    Report
                  </span>
                </div>
              )}

              {/* Close button */}
          <button
                onClick={closeImagePreview}
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  zIndex: 10,
                  background: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'
                }}
              >
                <X size={20} color="#FFFFFF" />
          </button>
              
              {/* Image */}
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img
                  src={selectedImage}
                  alt="Verification screenshot preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '4px'
                  }}
                  onClick={closeImagePreview}
                />
              </div>
        </div>
      </div>
    </div>
      )}

      {/* Report Modal */}
      {showReportModal && selectedScreenshotId && selectedImage && (
        <ReportModal
          screenshotId={selectedScreenshotId}
          reportedUserId={userId}
          screenshotUrl={selectedImage}
          onClose={handleReportModalClose}
          onReportSubmitted={handleReportSubmitted}
        />
      )}

      <style>{`
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          /* On mobile, center everything */
          .verification-screenshot-wrapper {
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 0 !important;
            max-width: 100% !important;
            padding: 0 20px !important;
            width: 100% !important;
            margin: 0 auto !important;
          }

          /* Hide the upload list sidebar on mobile */
          .upload-list-sidebar {
            display: none !important;
          }

          /* Center the screenshot panel on mobile - truly centered */
          .screenshot-display-panel {
            width: 90vw !important;
            max-width: 500px !important;
            height: auto !important;
            min-height: 400px !important;
            max-height: 80vh !important;
            margin-left: auto !important;
            margin-right: auto !important;
            position: relative !important;
            left: 0 !important;
            right: 0 !important;
            transform: translateX(0) !important;
            display: flex !important;
            flex-direction: column !important;
          }

          /* Ensure image container is centered */
          .screenshot-display-panel > div {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          /* Ensure image scales properly on mobile */
          .screenshot-display-panel img {
            max-width: 100% !important;
            max-height: calc(80vh - 80px) !important;
            object-fit: contain !important;
            display: block !important;
            margin: 0 auto !important;
          }
        }

        /* Extra small mobile devices */
        @media (max-width: 480px) {
          .screenshot-display-panel {
            width: calc(100vw - 40px) !important;
            max-width: 100% !important;
            min-height: 300px !important;
          }

          .screenshot-display-panel img {
            max-height: calc(70vh - 60px) !important;
          }
        }

        /* Tablet and Desktop - side by side layout */
        @media (min-width: 769px) {
          .verification-screenshot-wrapper {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .upload-list-sidebar {
            display: block !important;
          }

          .screenshot-display-panel {
            display: block !important;
          }
        }
      `}</style>
    </>
  )
}



