import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../common/Logo'
import { profileService } from '../../services/profileService'

export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()

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
            navigate('/UserProfile', { replace: true })
          } else {
            // If profile is not set up, redirect to profile setup
            navigate('/profile-setup', { replace: true })
          }
        } catch (profileErr) {
          console.warn('Error checking profile existence:', profileErr)
          // If there's an error checking profile, default to home
          navigate('/UserProfile', { replace: true })
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
          <div className="mobile-welcome-text">
            Grind. Compete. Flex.
          </div>
          <div style={{  display: 'flex', justifyContent: 'center' }}>
            <Logo className="auth-logo" style={{ color: '#000000' }} />
          </div>
          
          <div className="auth-header">
            <h1>Welcome back!</h1>
            <p>Enter your details to access your account </p>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                Email Address
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
              <label htmlFor="password">
                Password
              </label>
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
            
            <div style={{ }}>
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
            <p style={{  }}>
              <Link to="/forgot-password" className="form-link">
                Forgot password?
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <div className="split-layout-right">
        <div className="welcome-message" style={{ textAlign: 'left' }}>
          <h1>Grind.</h1>
          <h1>Compete.</h1>
          <h1>Flex.</h1>
        </div>
      </div>
    </div>
  )
} 