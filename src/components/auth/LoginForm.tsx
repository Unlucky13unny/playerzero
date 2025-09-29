import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../common/Logo'
import { profileService } from '../../services/profileService'
import { EyeIcon } from '../icons/EyeIcon'
import { ErrorModal } from '../common/ErrorModal'

export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await signIn(email, password)
      if (error) {
        setShowErrorModal(true)
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
      setShowErrorModal(true)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="split-layout">
      <div className="split-layout-left">
        <div className="auth-container">
          <div className="logo-section">
            <Logo className="auth-logo" />
            <div className="mobile-tagline">
              Grind. Compete. Flex.
            </div>
          </div>
          
          <div className="auth-header">
            <h1>Welcome back!</h1>
            <p>Enter your details to access your account</p>
          </div>
          
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
                placeholder="Enter your email"
                required
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input password-input"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <EyeIcon isOpen={showPassword} size={17} />
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-login"
            >
              {loading ? (
                <span className="loading-spinner">
                  <svg className="spinner" viewBox="0 0 24 24">
                    <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" />
                    <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Logging in...
                </span>
              ) : 'Login'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="form-link">
                Register
              </Link>
            </p>
            <p>
              <Link to="/forgot-password" className="form-link">
                Forgot your password?
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <div className="split-layout-right">
        <div className="welcome-message">
          <h1>Grind.</h1>
          <h1>Compete.</h1>
          <h1>Flex.</h1>
        </div>
      </div>
      
      <ErrorModal 
        isOpen={showErrorModal}
        onClose={() => {
          setShowErrorModal(false)
        }}
        title="Wrong email or password"
        message="Login failed! Check your email and password."
      />
    </div>
  )
} 