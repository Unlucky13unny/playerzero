import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

type ProfileSetupGuardProps = {
  children: React.ReactNode
}

export const ProfileSetupGuard = ({ children }: ProfileSetupGuardProps) => {
  const { needsProfileSetup } = useAuth()
  const [loading, setLoading] = useState(true)
  const [requiresSetup, setRequiresSetup] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const checkProfileSetup = async () => {
      const needsSetup = await needsProfileSetup()
      setRequiresSetup(needsSetup)
      setLoading(false)
    }

    checkProfileSetup()
  }, [needsProfileSetup])

  if (loading) {
    return null // Or a loading spinner
  }

  if (requiresSetup && location.pathname !== '/profile-setup') {
    // Save the intended destination to redirect back after setup
    return <Navigate to="/profile-setup" state={{ from: location }} replace />
  }

  return <>{children}</>
} 