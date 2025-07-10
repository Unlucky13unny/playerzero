import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Logo } from '../common/Logo'
import { profileService } from '../../services/profileService'

export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        // After successful login, check if user has completed profile setup
        try {
          const { hasProfile, error: profileError } = await profileService.hasProfile()
          
          if (profileError && profileError.message !== 'User not authenticated') {
            console.warn('Error checking profile:', profileError)
          }
          
          // If profile is set up, redirect to home
          if (hasProfile) {
            navigate('/home', { replace: true })
          } else {
            // If profile is not set up, redirect to profile setup
            navigate('/profile-setup', { replace: true })
          }
        } catch (profileErr) {
          console.warn('Error checking profile existence:', profileErr)
          // If there's an error checking profile, default to home
          navigate('/home', { replace: true })
        }
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
            <h1>Sign in to bring new insights to light</h1>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <div className="form-footer">
                <label htmlFor="password">
                  Password
                </label>
                <Link to="/forgot-password" className="form-link">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
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
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <svg style={{ animation: 'spin 1s linear infinite', width: '1rem', height: '1rem' }} viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </div>
          </form>
          
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="form-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <div className="split-layout-right">
        <div className="welcome-message">
          <h1>It's not about what you've accomplished.</h1>
          <p>It's about what you're about to...</p>
        </div>
      </div>
    </div>
  )
} 