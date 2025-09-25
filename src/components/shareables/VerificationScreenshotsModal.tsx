import { useState, useEffect } from 'react'
import { X, ImageIcon } from "lucide-react"
import { dashboardService } from '../../services/dashboardService'

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
  const [screenshots, setScreenshots] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      loadScreenshots()
    }
  }, [isOpen, userId])

  const loadScreenshots = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await dashboardService.getVerificationScreenshots(userId, 50) // Get last 50 screenshots
      setScreenshots(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load screenshots')
    } finally {
      setLoading(false)
    }
  }

  const formatUploadDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl)
  }

  const closeImagePreview = () => {
    setSelectedImage(null)
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
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '2px solid #f0f0f0',
                  borderTopColor: '#2BC49C',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{
                  marginLeft: '12px',
                  fontFamily: 'Poppins',
                  fontSize: '12px',
                  color: '#848282'
                }}>Loading screenshots...</span>
            </div>
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
                  onClick={() => handleImageClick(proof.screenshot_url)}
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
                        
      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            maxWidth: '1000px',
            padding: '0 20px'
          }}>
            {/* Main container - positioned to the left */}
            <div style={{
              position: 'relative',
              width: '352px',
              height: '422px',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              marginRight: '20px'
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
                    onClick={() => handleImageClick(proof.screenshot_url)}
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
            <div style={{
              position: 'relative',
              width: '352px',
              height: '422px',
              background: 'white',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)'
            }}>
              {/* Close button */}
          <button
                onClick={closeImagePreview}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  zIndex: 10,
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
