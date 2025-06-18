import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

type ProfileGuardProps = {
  children: React.ReactNode
}

export const ProfileGuard = ({ children }: ProfileGuardProps) => {
  const { user, userMetadata, loading, isProfileComplete } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Don't check if still loading or user is not authenticated
    if (loading || !user) return

    // If user is authenticated but profile is not complete, redirect to setup
    if (user && !isProfileComplete()) {
      navigate('/profile-setup')
    }
  }, [user, userMetadata, loading, isProfileComplete, navigate])

  // Show loading while checking profile status
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Don't render children if user needs to complete profile setup
  if (user && !isProfileComplete()) {
    return null
  }

  return <>{children}</>
} 