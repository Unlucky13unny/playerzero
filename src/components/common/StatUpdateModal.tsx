import React, { useState } from 'react'
import { X, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

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
  onReview,
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
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
      
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: hasDecreasingStats ? 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)' : '#ffffff',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            {hasDecreasingStats ? (
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 2s infinite',
              }}>
                <AlertTriangle size={20} color="white" />
              </div>
            ) : (
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CheckCircle2 size={20} color="white" />
              </div>
            )}
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              fontFamily: 'Poppins, sans-serif',
              color: '#111827',
            }}>
              {hasDecreasingStats ? 'Stat Correction Review' : 'Review Stat Updates'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {/* Stats Table */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Poppins, sans-serif',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Your Changes
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {changes.map((change, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '6px',
                  border: change.isDecrease ? '1px solid #fecaca' : '1px solid #e5e7eb',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: 1,
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      fontFamily: 'Poppins, sans-serif',
                      color: '#374151',
                      minWidth: '140px',
                    }}>
                      {change.label}
                    </span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontFamily: 'Poppins, sans-serif',
                        color: '#6b7280',
                      }}>
                        {change.oldValue}
                      </span>
                      <span style={{
                        fontSize: '14px',
                        fontFamily: 'Poppins, sans-serif',
                        color: '#9ca3af',
                      }}>
                        →
                      </span>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        fontFamily: 'Poppins, sans-serif',
                        color: change.isDecrease ? '#dc2626' : '#059669',
                      }}>
                        {change.newValue}
                      </span>
                    </div>
                  </div>
                  {change.isDecrease && (
                    <XCircle size={20} color="#dc2626" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Warning Message */}
          {hasDecreasingStats && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              gap: '12px',
            }}>
              <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  fontFamily: 'Poppins, sans-serif',
                  color: '#dc2626',
                }}>
                  Stats Correction Notice
                </h4>
                <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '13px',
                  fontFamily: 'Poppins, sans-serif',
                  color: '#7f1d1d',
                  lineHeight: '1.5',
                }}>
                  One or more stats are lower than your previous values. This is allowed for correcting mistakes.
                </p>
                <p style={{
                  margin: '0 0 12px 0',
                  fontSize: '12px',
                  fontFamily: 'Poppins, sans-serif',
                  color: '#991b1b',
                  fontWeight: '500',
                }}>
                  ⚠️ Warning: Repeated stat decreases may result in temporary account restrictions. Please ensure accuracy before confirming.
                </p>
                
                {/* Acknowledgment Checkbox */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginTop: '8px',
                  padding: '12px',
                  background: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid #fecaca',
                }}>
                  <input
                    type="checkbox"
                    id="acknowledge-decrease"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      marginTop: '2px',
                      cursor: 'pointer',
                      accentColor: '#dc2626',
                    }}
                  />
                  <label
                    htmlFor="acknowledge-decrease"
                    style={{
                      fontSize: '12px',
                      fontFamily: 'Poppins, sans-serif',
                      color: '#7f1d1d',
                      cursor: 'pointer',
                      lineHeight: '1.5',
                      userSelect: 'none',
                    }}
                  >
                    I understand that I'm correcting a previous mistake. I acknowledge that repeated stat decreases may lead to account restrictions.
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Accuracy Check / Normal Update Notice */}
          <div style={{
            background: hasDecreasingStats ? '#eff6ff' : '#f0fdf4',
            border: hasDecreasingStats ? '1px solid #bfdbfe' : '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            gap: '12px',
          }}>
            <CheckCircle2 
              size={20} 
              color={hasDecreasingStats ? "#2563eb" : "#22c55e"} 
              style={{ flexShrink: 0, marginTop: '2px' }} 
            />
            <div>
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'Poppins, sans-serif',
                color: hasDecreasingStats ? '#1e40af' : '#166534',
              }}>
                {hasDecreasingStats ? 'Accuracy Check' : 'Stat Update Ready'}
              </h4>
              <p style={{
                margin: 0,
                fontSize: '13px',
                fontFamily: 'Poppins, sans-serif',
                color: hasDecreasingStats ? '#1e3a8a' : '#166534',
                lineHeight: '1.5',
              }}>
                {hasDecreasingStats 
                  ? 'Please double-check that all values are accurate before confirming. Frequent incorrect updates may result in temporary restrictions.'
                  : 'Your stats are increasing as expected. Please verify the values are correct before confirming.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          background: '#f9fafb',
        }}>
          <button
            onClick={onReview}
            style={{
              padding: '10px 20px',
              background: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Poppins, sans-serif',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6'
              e.currentTarget.style.borderColor = '#9ca3af'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff'
              e.currentTarget.style.borderColor = '#d1d5db'
            }}
          >
            Review
          </button>
          <button
            onClick={onConfirm}
            disabled={hasDecreasingStats && !acknowledged}
            style={{
              padding: '10px 24px',
              background: hasDecreasingStats 
                ? (acknowledged 
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)')
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'Poppins, sans-serif',
              color: '#ffffff',
              cursor: hasDecreasingStats && !acknowledged ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
              boxShadow: hasDecreasingStats 
                ? (acknowledged 
                  ? '0 4px 14px rgba(239, 68, 68, 0.3)'
                  : '0 2px 8px rgba(107, 114, 128, 0.2)')
                : '0 4px 14px rgba(16, 185, 129, 0.3)',
              opacity: hasDecreasingStats && !acknowledged ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!hasDecreasingStats || acknowledged) {
                e.currentTarget.style.transform = 'scale(1.05)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {hasDecreasingStats && !acknowledged ? 'Please Acknowledge Above' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
