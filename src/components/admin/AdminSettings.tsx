import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { featureFlagService } from '../../services/featureFlagService'
import type { FeatureFlags, FeatureFlagRecord } from '../../services/featureFlagService'

export const AdminSettings = () => {
  const { user } = useAuth()
  const [flags, setFlags] = useState<FeatureFlagRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState(false)

  const fetchFlags = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await featureFlagService.getAllFlagsDetailed()
      
      if (fetchError) {
        if (fetchError.code === '42P01' || fetchError.message?.includes('does not exist')) {
          await featureFlagService.initializeFlags()
          const { data: retryData, error: retryError } = await featureFlagService.getAllFlagsDetailed()
          if (retryError) throw retryError
          setFlags(retryData || [])
        } else {
          throw fetchError
        }
      } else {
        if (!data || data.length === 0) {
          await featureFlagService.initializeFlags()
          const { data: retryData } = await featureFlagService.getAllFlagsDetailed()
          setFlags(retryData || [])
        } else {
          setFlags(data)
        }
      }
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load feature flags')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlags()
  }, [])

  const handleToggle = async (key: string, value: boolean) => {
    try {
      setIsToggling(true)
      setError(null)
      
      const { success, error: updateError } = await featureFlagService.updateFlag(
        key as keyof FeatureFlags,
        value,
        user?.id
      )

      if (!success) {
        const errorMsg = updateError?.message || updateError?.code || 'Failed to update feature flag'
        throw new Error(errorMsg)
      }

      setFlags(prev => prev.map(flag => 
        flag.key === key 
          ? { ...flag, value, updated_at: new Date().toISOString() }
          : flag
      ))

      setSuccessMessage(`Free Mode has been ${value ? 'enabled' : 'disabled'} successfully`)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: any) {
      setError(err.message || 'Failed to update feature flag')
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsToggling(false)
    }
  }

  const freeModeFlag = flags.find(f => f.key === 'is_free_mode')
  const isEnabled = freeModeFlag?.value || false

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div style={{
      minHeight: '100%',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      padding: '32px',
      fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '28px',
          fontWeight: 700,
          color: '#0f172a',
          letterSpacing: '-0.025em'
        }}>
          System Configuration
        </h1>
        <p style={{
          margin: 0,
          fontSize: '15px',
          color: '#64748b',
          fontWeight: 400
        }}>
          Manage global settings and feature toggles for your application
        </p>
      </div>

      {/* Toast Messages */}
      {(error || successMessage) && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease'
        }}>
          <div style={{
            padding: '16px 20px',
            borderRadius: '12px',
            background: error ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${error ? '#fecaca' : '#bbf7d0'}`,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px'
          }}>
            <span style={{ fontSize: '20px' }}>{error ? '⚠️' : '✓'}</span>
            <span style={{
              fontSize: '14px',
              fontWeight: 500,
              color: error ? '#dc2626' : '#16a34a'
            }}>
              {error || successMessage}
            </span>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        maxWidth: '720px'
      }}>
        {/* Card Header */}
        <div style={{
          padding: '28px 32px',
          borderBottom: '1px solid #f1f5f9',
          background: isEnabled 
            ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' 
            : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: isEnabled ? '#10b981' : '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isEnabled 
                  ? '0 8px 24px rgba(16, 185, 129, 0.3)' 
                  : '0 8px 24px rgba(249, 115, 22, 0.3)'
              }}>
                <span style={{ fontSize: '28px' }}>{isEnabled ? '🎉' : '💳'}</span>
              </div>
              <div>
                <h2 style={{
                  margin: '0 0 4px 0',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#0f172a'
                }}>
                  Free Mode
                </h2>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#64748b',
                  fontWeight: 500
                }}>
                  Global paywall bypass control
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div style={{
              padding: '8px 16px',
              borderRadius: '100px',
              background: isEnabled ? '#10b981' : '#94a3b8',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              {isEnabled ? '● Active' : '○ Inactive'}
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '32px' }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px',
              gap: '12px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '3px solid #e2e8f0',
                borderTopColor: '#DC2627',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{ color: '#64748b', fontSize: '15px' }}>Loading configuration...</span>
            </div>
          ) : (
            <>
              {/* Toggle Section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '16px',
                marginBottom: '24px',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 6px 0',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}>
                    {isEnabled ? 'Free Mode is Currently On' : 'Free Mode is Currently Off'}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#64748b'
                  }}>
                    {isEnabled 
                      ? 'All users have unlimited access to premium features' 
                      : 'Standard trial and subscription rules apply'}
                  </p>
                </div>

                {/* Toggle Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (freeModeFlag && !isToggling) {
                      handleToggle(freeModeFlag.key, !freeModeFlag.value)
                    }
                  }}
                  disabled={isToggling || !freeModeFlag}
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    minWidth: '140px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isEnabled 
                      ? 'linear-gradient(135deg, #dc2626, #b91c1c)' 
                      : 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: (isToggling || !freeModeFlag) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isEnabled 
                      ? '0 4px 12px rgba(220, 38, 38, 0.3)' 
                      : '0 4px 12px rgba(16, 185, 129, 0.3)',
                    opacity: (isToggling || !freeModeFlag) ? 0.6 : 1,
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none',
                    flexShrink: 0,
                    zIndex: 10,
                    position: 'relative',
                    pointerEvents: (isToggling || !freeModeFlag) ? 'none' : 'auto'
                  }}
                >
                  {isToggling ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        pointerEvents: 'none'
                      }} />
                      <span style={{ pointerEvents: 'none' }}>Updating...</span>
                    </>
                  ) : (
                    <span style={{ pointerEvents: 'none' }}>
                      {isEnabled ? '🔴 Disable' : '🟢 Enable'}
                    </span>
                  )}
                </button>
              </div>

              {/* Show if flag not found */}
              {!freeModeFlag && !loading && (
                <div style={{
                  padding: '20px',
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: '12px',
                  marginBottom: '24px'
                }}>
                  <p style={{ margin: '0 0 12px 0', color: '#92400e', fontSize: '14px', fontWeight: 600 }}>
                    ⚠️ Feature flag not found in database
                  </p>
                  <p style={{ margin: '0 0 16px 0', color: '#a16207', fontSize: '13px' }}>
                    The is_free_mode flag doesn't exist yet. Click below to initialize it or run the migration SQL manually.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        setLoading(true)
                        await featureFlagService.initializeFlags()
                        await fetchFlags()
                        setSuccessMessage('Feature flags initialized successfully!')
                        setTimeout(() => setSuccessMessage(null), 4000)
                      } catch (err: any) {
                        setError(err.message || 'Failed to initialize flags')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    Initialize Feature Flags
                  </button>
                </div>
              )}

              {/* Features List */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  What This Controls
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  {[
                    { icon: '🔓', text: 'Bypass trial restrictions' },
                    { icon: '💎', text: 'Unlock all premium features' },
                    { icon: '🏆', text: 'Leaderboard access for all' },
                    { icon: '👤', text: 'Full profile visibility' },
                    { icon: '📊', text: 'Weekly/monthly stat cards' },
                    { icon: '🔗', text: 'Trainer code & socials' }
                  ].map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <span style={{ fontSize: '16px' }}>{item.icon}</span>
                      <span style={{
                        fontSize: '13px',
                        color: '#475569',
                        fontWeight: 500
                      }}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Updated */}
              {freeModeFlag?.updated_at && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: '#f1f5f9',
                  borderRadius: '10px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span style={{
                    fontSize: '13px',
                    color: '#64748b'
                  }}>
                    Last modified: {formatDate(freeModeFlag.updated_at)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div style={{
        marginTop: '24px',
        padding: '20px 24px',
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        borderRadius: '16px',
        border: '1px solid #bfdbfe',
        maxWidth: '720px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '20px' }}>💡</span>
        </div>
        <div>
          <h4 style={{
            margin: '0 0 6px 0',
            fontSize: '15px',
            fontWeight: 600,
            color: '#1e40af'
          }}>
            How Feature Flags Work
          </h4>
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: '#3730a3',
            lineHeight: 1.6
          }}>
            Changes take effect immediately for new sessions. Existing users will see updates within 
            5 minutes or when they refresh their browser. No code deployment required.
          </p>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
