import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../common/Logo'
import { EyeIcon } from '../icons/EyeIcon'

export const ResetPassword = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    
    setLoading(true)
    
    try {
      const { error } = await updatePassword(password)
      if (error) {
        setError(error.message)
      } else {
        // Redirect to login
        navigate('/login', { state: { message: 'Password has been reset successfully. Please login with your new password.' } })
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
          <div className="logo-section">
            <Logo className="auth-logo" />
            <div className="mobile-tagline">
              Grind. Compete. Flex.
            </div>
          </div>
          
          <div className="auth-header">
            <h1>Set New Password</h1>
            <p>Enter your new password below</p>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">
                New Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input password-input"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                  autoFocus
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
            
            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input password-input"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  <EyeIcon isOpen={showConfirmPassword} size={17} />
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
                  Updating...
                </span>
              ) : 'Reset Password'}
            </button>
          </form>
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