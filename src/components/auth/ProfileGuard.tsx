import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { profileService } from '../../services/profileService'

type ProfileGuardProps = {
  children: React.ReactNode
}

export const ProfileGuard = ({ children }: ProfileGuardProps) => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [profileChecking, setProfileChecking] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    const checkProfile = async () => {
      // Don't check if still loading or user is not authenticated
      if (loading || !user) {
        setProfileChecking(false)
        return
      }

      try {
        const { hasProfile: profileExists, error } = await profileService.hasProfile()
        
        if (error && error.message !== 'User not authenticated') {
          console.warn('Error checking profile:', error)
        }
        
        setHasProfile(profileExists)
        
        // If user is authenticated but profile doesn't exist, redirect to setup
        if (user && !profileExists) {
          navigate('/profile-setup')
          return
        }
      } catch (err) {
        console.warn('Error checking profile existence:', err)
        // If error checking profile, assume no profile and redirect to setup
        navigate('/profile-setup')
        return
      } finally {
        setProfileChecking(false)
      }
    }

    checkProfile()
  }, [user, loading, navigate])

  // Show loading while checking profile status
  if (loading || profileChecking) {
    return (
      <div className="loading-container">
        <p style={{ fontSize: '18px', color: '#DC2627', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textAlign: 'center', padding: '20px' }}>Loading your Profile...</p>
      </div>
    )
  }

  // Don't render children if user needs to complete profile setup
  if (user && !hasProfile) {
    return null
  }

  return <>{children}</>
} 