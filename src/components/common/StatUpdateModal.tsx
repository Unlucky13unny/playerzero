import React, { useState } from 'react'
import { X } from 'lucide-react'

interface StatChange {
  label: string
  oldValue: number | string
  newValue: number | string
  isDecrease: boolean
}

interface StatUpdateModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  onReview: () => void
  changes: StatChange[]
  hasDecreasingStats: boolean
}

export const StatUpdateModal: React.FC<StatUpdateModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  changes,
  hasDecreasingStats
}) => {
  const [acknowledged, setAcknowledged] = useState(false)
  
  // Reset acknowledgment when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setAcknowledged(false)
    }
  }, [isOpen])
  
  if (!isOpen) return null

  // Detect mobile
  const isMobile = window.innerWidth <= 768

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
    }}>
      {/* Modal Container - Figma: New Upload */}
      <div style={{
        position: 'relative',
        width: isMobile ? '353px' : '400px',
        height: isMobile ? '484px' : '550px',
        maxHeight: isMobile ? '90vh' : '90vh',
        
        background: '#FFFFFF',
        borderRadius: '24px',
        
        filter: 'drop-shadow(0px 0px 48px rgba(0, 0, 0, 0.04))',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* bg */}
        <div style={{
          position: 'absolute',
          left: '0px',
          right: '0px',
          top: '0px',
          bottom: '0px',
          background: '#FFFFFF',
          borderRadius: '24px',
        }} />

        {/* Drag Area - Flat Grey background */}
          <div style={{
            display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
            alignItems: 'center',
          padding: '32px',
          paddingTop: '16px',
          gap: '10px',
          
          position: 'absolute',
          left: '0px',
          right: '0px',
          top: '0px',
          bottom: '0px',
          
          background: '#F8F8F8',
          borderRadius: '24px',
          boxSizing: 'border-box',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          {/* Frame 756 - Main content container */}
              <div style={{
                display: 'flex',
            flexDirection: 'column',
                alignItems: 'center',
            padding: '0px',
            gap: '17px',
            
            width: isMobile ? '310px' : '360px',
            maxWidth: '100%',
            marginTop: '20px',
            marginBottom: '20px',
          }}>
            {/* Title: Stat correction review */}
              <div style={{
              width: '100%',
              height: '30px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '20px',
              lineHeight: '30px',
              textAlign: 'center',
              color: '#000000',
              flex: 'none',
              order: 0,
              alignSelf: 'stretch',
              flexGrow: 0,
            }}>
              Stat correction review
        </div>

            {/* Frame 755 - Stats comparison container */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '0px',
              gap: '8px',
              
              width: '100%',
              
              flex: 'none',
              order: 1,
              alignSelf: 'stretch',
              flexGrow: 0,
            }}>
              {changes.map((change, index) => (
                <div key={index} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '0px',
                  gap: '2px',
                  width: '100%',
                  flex: 'none',
                  order: index,
                  alignSelf: 'stretch',
                  flexGrow: 0,
                }}>
                  {/* Label */}
                  <div style={{
                    width: '100%',
                    height: '17px',
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '11px',
                    lineHeight: '16px',
                    color: '#000000',
                    flex: 'none',
                    order: 0,
                    alignSelf: 'stretch',
                    flexGrow: 0,
                    }}>
                      {change.label}
                  </div>

                  {/* Frame 757/758 - Comparison row */}
                    <div style={{
                      display: 'flex',
                    flexDirection: 'row',
                      alignItems: 'center',
                    padding: '0px',
                      gap: '8px',
                    
                    width: '100%',
                    maxWidth: '310px',
                    height: '36px',
                    
                    flex: 'none',
                    order: 1,
                    alignSelf: 'stretch',
                    flexGrow: 0,
                  }}>
                    {/* Old Value - Frame 654 */}
                    <div style={{
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      padding: '9px',
                      gap: '10px',
                      
                      width: '135px',
                      height: '36px',
                      
                      border: '1px solid #848282',
                      borderRadius: '6px',
                      
                      flex: 'none',
                      order: 0,
                      flexGrow: 0,
                    }}>
                      <span style={{
                        fontFamily: 'Poppins',
                        fontStyle: 'normal',
                        fontWeight: 400,
                        fontSize: '12px',
                        lineHeight: '18px',
                        color: '#000000',
                        flex: 'none',
                        order: 0,
                        flexGrow: 0,
                      }}>
                        {change.oldValue}
                      </span>
                    </div>

                    {/* ArrowRight */}
                    <div style={{
                      width: '24px',
                      height: '24px',
                      flex: 'none',
                      order: 1,
                      flexGrow: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="18" height="15" viewBox="0 0 18 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 7.5H17M17 7.5L10.5 1M17 7.5L10.5 14" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>

                    {/* New Value - Frame 655 */}
                    <div style={{
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px',
                      gap: '10px',
                      
                      width: '135px',
                      height: '36px',
                      
                      border: `1px solid ${change.isDecrease ? '#DC2627' : '#848282'}`,
                      borderRadius: '6px',
                      
                      flex: 'none',
                      order: 2,
                      flexGrow: 0,
                    }}>
                      {/* Value text */}
                      <span style={{
                        margin: '0 auto',
                        fontFamily: 'Poppins',
                        fontStyle: 'normal',
                        fontWeight: 400,
                        fontSize: '12px',
                        lineHeight: '18px',
                        color: change.isDecrease ? '#DC2627' : '#000000',
                        flex: 'none',
                        order: 0,
                        flexGrow: 0,
                      }}>
                        {change.newValue}
                      </span>
                      
                      {/* Red X Icon INSIDE the box for decreasing stats */}
                      {change.isDecrease && (
                          <div style={{
                            marginLeft: 'auto',
                            marginRight: '0',
                            width: '20px',
                            height: '20px',
                            flex: 'none',
                            order: 1,
                            flexGrow: 0,
                            flexShrink: 0,
                          }}>
                           <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="9" fill="white" stroke="#DC2627" strokeWidth="2"/>
                              <path d="M6 6L14 14M14 6L6 14" stroke="#DC2627" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

            {/* Frame 597 - Info/Warning box */}
            {/* Verification status */}
            <div style={{
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: '0px 8px',
              gap: '8px',
              
              width: '310px',
              height: '208px',
              
              background: 'rgba(220, 38, 39, 0.05)',
              border: '1px solid #DC2627',
              borderRadius: '8px',
              
              flex: 'none',
              order: 2,
              alignSelf: 'stretch',
              flexGrow: 0,
            }}>
              {/* Frame 598 */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '0px',
                gap: '16px',
                
                width: '286px',
                height: '54px',
                
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                {/* charm:shield-tick / lucide:info */}
                <div style={{
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '3px 4px',
                  gap: '10px',
                  
                  width: '40px',
                  height: '40px',
                  
                  background: 'rgba(220, 38, 39, 0.05)',
                  border: '1px solid #DC2627',
                  borderRadius: '4px',
                  
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  {hasDecreasingStats ? (
                    // lucide:info icon
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g>
                        <circle cx="12" cy="12" r="10" stroke="#DC2627" strokeWidth="2"/>
                        <path d="M12 12L12 16" stroke="#DC2627" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="8" r="0.5" fill="#DC2627" stroke="#DC2627" strokeWidth="2"/>
                      </g>
                    </svg>
                  ) : (
                    <svg width="16" height="19" viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 0.75L1 3.75V8.75C1 13.55 4.84 17.74 8 18.75C11.16 17.74 15 13.55 15 8.75V3.75L8 0.75Z" stroke="#2BC49C" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5.5 9.5L7.5 11.5L11 8" stroke="#2BC49C" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                {/* Frame 596 - Text container */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '0px',
                  gap: '2px',
                  
                  width: '230px',
                  height: '54px',
                  
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                }}>
                  {/* One or more stats are lower than your previous values. This is allowed for correcting mistakes. */}
                  <p style={{
                    margin: 0,
                    width: '232px',
                    height: '54px',
                    
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '18px',
                    
                    color: '#DC2627',
                    
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                  }}>
                    {hasDecreasingStats 
                      ? 'One or more stats are lower than your previous values. This is allowed for correcting mistakes.'
                      : 'Your stats are increasing as expected.'}
                  </p>
                </div>
              </div>

              {/* Warning: Repeated stat decreases may result in temporary account restrictions. Please ensure accuracy before confirming. */}
              {hasDecreasingStats && (
                <p style={{
                  margin: 0,
                  width: '294px',
                  height: '54px',
                  
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  fontSize: '12px',
                  lineHeight: '18px',
                  
                  color: '#DC2627',
                  
                  flex: 'none',
                  order: 2,
                  alignSelf: 'stretch',
                  flexGrow: 0,
                }}>
                  Warning: Repeated stat decreases may result in temporary account restrictions. Please ensure accuracy before confirming.
                </p>
              )}

              {/* Frame 759 - Acknowledgment Checkbox INSIDE the warning box */}
              {hasDecreasingStats && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  padding: '0px',
                  gap: '8px',
                  
                  width: '284px',
                  height: '72px',
                  
                  flex: 'none',
                  order: 3,
                  flexGrow: 0,
                }}>
                  {/* CheckSquare */}
                  <input
                    type="checkbox"
                    id="acknowledge-decrease"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    style={{
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      accentColor: '#000000',
                      
                      flex: 'none',
                      order: 0,
                      flexGrow: 0,
                      flexShrink: 0,
                    }}
                  />
                  {/* I understand that I'm correcting a previous mistake. I acknowledge that repeated stat decreases may lead to account restrictions. */}
                  <label
                    htmlFor="acknowledge-decrease"
                    style={{
                      width: '252px',
                      height: '72px',
                      
                      fontFamily: 'Poppins',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      fontSize: '12px',
                      lineHeight: '18px',
                      
                      color: '#848282',
                      
                      flex: 'none',
                      order: 1,
                      flexGrow: 0,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    I understand that I'm correcting a previous mistake. I acknowledge that repeated stat decreases may lead to account restrictions.
                  </label>
                </div>
              )}
            </div>

            {/* Frame 215 - Buttons */}
          <div style={{
            display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              padding: '0px',
              gap: '8px',
              
              width: '190px',
              height: '38px',
              
              flex: 'none',
              order: 3,
              flexGrow: 0,
            }}>
              {/* Confirm Button */}
          <button
                type="button"
            onClick={onConfirm}
            disabled={hasDecreasingStats && !acknowledged}
            style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '8px 16px',
                  gap: '10px',
                  
                  width: '95px',
                  height: '38px',
                  
              background: hasDecreasingStats 
                    ? (acknowledged ? '#DC2627' : '#9CA3AF')
                    : '#DC2627',
                  borderRadius: '6px',
              border: 'none',
                  
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  
              cursor: hasDecreasingStats && !acknowledged ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
              opacity: hasDecreasingStats && !acknowledged ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!hasDecreasingStats || acknowledged) {
                    e.currentTarget.style.background = '#B91C1C'
              }
            }}
            onMouseLeave={(e) => {
                  if (!hasDecreasingStats || acknowledged) {
                    e.currentTarget.style.background = '#DC2627'
                  } else {
                    e.currentTarget.style.background = '#9CA3AF'
                  }
                }}
              >
                <span style={{
                  width: '63px',
                  height: '23px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '15px',
                  lineHeight: '23px',
                  color: '#FFFFFF',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  Confirm
                </span>
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={onCancel}
                style={{
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '8px 16px',
                  gap: '10px',
                  
                  width: '87px',
                  height: '38px',
                  
                  border: '1px solid #000000',
                  borderRadius: '6px',
                  background: 'transparent',
                  
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                  
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{
                  width: '55px',
                  height: '23px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '15px',
                  lineHeight: '23px',
                  color: '#000000',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  Cancel
                </span>
          </button>
        </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            padding: '8px',
            cursor: 'pointer',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
            zIndex: 1000,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <X size={20} color="#6b7280" />
        </button>
      </div>
    </div>
  )
}
