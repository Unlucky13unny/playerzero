import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

type ProtectedRouteProps = {
  children: ReactNode
  requireRole?: 'free' | 'paid'
}

export const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
  const { user, userMetadata, loading } = useAuth()
  const location = useLocation()
  
  // If still loading auth state, show nothing or a loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }
  
  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  // If role check is required
  if (requireRole && userMetadata?.role !== requireRole) {
    // If they have the free role but paid is required, redirect to upgrade page
    if (requireRole === 'paid' && userMetadata?.role === 'free') {
      return <Navigate to="/upgrade" state={{ from: location }} replace />
    }
    
    // For any other role mismatch (shouldn't happen, but for safety)
    return <Navigate to="/" replace />
  }
  
  // If all checks pass, render the children
  return <>{children}</>
} 