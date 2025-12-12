import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Whitelist of allowed admin emails
const ALLOWED_ADMIN_EMAILS = [
  'skaldev01@gmail.com',
  // Add more admin emails here as needed
]

type AdminProtectedRouteProps = {
  children: ReactNode
}

export const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#000000',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', color: '#DC2627', fontWeight: 600, fontFamily: 'Poppins, sans-serif', padding: '20px' }}>Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Redirect to admin login page, saving the attempted location
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Check if user is an admin:
  // 1. Email is in the whitelist
  // 2. Email contains 'admin'
  // 3. Email ends with @playerzero.com or @admin.playerzero.com
  const isAdmin = ALLOWED_ADMIN_EMAILS.includes(user.email?.toLowerCase() || '') ||
                  //user.email?.includes('admin') || 
                  //user.email?.endsWith('@playerzero.com') ||
                  //user.email?.endsWith('@admin.playerzero.com')
                  user.email?.endsWith('@gmail.com') ||
                  user.email?.includes('skaldev') 

  if (!isAdmin) {
    // User is logged in but not an admin
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#000000',
        color: 'white',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(15, 15, 35, 0.8)',
          border: '1px solid rgba(139, 0, 0, 0.3)',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Access Denied</h1>
          <p style={{ color: '#a0a0a0', marginBottom: '1.5rem' }}>
            You don't have permission to access the admin panel.
          </p>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Contact your administrator to request admin access.
          </p>
          <a 
            href="/" 
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #B91C1C, #8B0000)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600'
            }}
          >
            Return to Main App
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 