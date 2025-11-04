import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { profileService, type PublicProfileData } from '../../services/profileService'
import { PlayerProfile } from '../dashboard/PlayerProfile'
import { useTrialStatus } from '../../hooks/useTrialStatus'

export const PublicPlayerProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const trialStatus = useTrialStatus()

  useEffect(() => {
    loadProfile()
  }, [id])

  const loadProfile = async () => {
    if (!id) return
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await profileService.getPublicProfile(id)
      if (error) throw error

      setProfile(data)
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%' }}>
        <p style={{ fontSize: '16px', color: '#636874', fontWeight: 500, textAlign: 'center' }}>Loading trainer profile...</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="user-home-container">
        <div className="error-message">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error || 'This profile could not be found or is not public.'}</span>
          <button
            onClick={() => navigate('/dashboard')}
            className="nav-button primary"
            style={{ marginTop: '0.75rem' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <PlayerProfile 
      viewMode="public" 
      userType={trialStatus.isPaidUser ? "upgraded" : "trial"}
      showHeader={false}
      profile={profile}
    />
  )
}
