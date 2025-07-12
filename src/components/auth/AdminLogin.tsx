import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Logo } from '../common/Logo'

export const AdminLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get the intended destination from location state, or default to admin dashboard
  const from = location.state?.from?.pathname || '/admin/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        // TODO: Add admin role verification here
        // For now, assume successful login means admin access
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="split-layout">
      <div className="split-layout-left">
        <div className="auth-container">
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
            <Logo style={{ color: 'var(--white-pure)', fontSize: '2rem' }} />
          </div>
          
          <div className="auth-header">
            <h1>Admin Access Portal</h1>
            <p style={{ 
              color: '#a0a0a0', 
              fontSize: '1rem', 
              marginTop: '0.5rem',
              textAlign: 'center'
            }}>
              Secure administrative access to PlayerZERO
            </p>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="admin-email">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="admin@playerzero.com"
                required
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <div className="form-footer">
                <label htmlFor="admin-password">
                  Admin Password
                </label>
                <Link to="/admin/forgot-password" className="form-link">
                  Forgot password?
                </Link>
              </div>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  background: loading ? 'rgba(139, 0, 0, 0.5)' : 'linear-gradient(135deg, #8B0000, #B91C1C)',
                  borderColor: '#8B0000'
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <svg style={{ animation: 'spin 1s linear infinite', width: '1rem', height: '1rem' }} viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <svg width="1rem" height="1rem" viewBox="0 0 24 24" fill="none">
                      <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Access Admin Panel
                  </span>
                )}
              </button>
            </div>
          </form>
          
          <div className="auth-footer">
            <p>
              Need help?{' '}
              <Link to="/contact" className="form-link">
                Contact Support
              </Link>
            </p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
              <Link to="/login" className="form-link">
                ← Back to User Login
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <div className="split-layout-right">
        <div className="welcome-message">
          <h1>Administrative Control Center</h1>
          <p>Manage users, monitor systems, and maintain excellence.</p>
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: 'rgba(139, 0, 0, 0.1)', 
            borderRadius: '0.5rem',
            border: '1px solid rgba(139, 0, 0, 0.3)'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#a0a0a0' }}>
              🔒 This is a secure administrative area. All access attempts are logged and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 