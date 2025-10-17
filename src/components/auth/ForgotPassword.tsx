import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Logo } from '../common/Logo'
import { ErrorModal } from '../common/ErrorModal'

export const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [success, setSuccess] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    
    try {
      const { error } = await resetPassword(email)
      if (error) {
        setError(error.message)
        setShowErrorModal(true)
      } else {
        setSuccess(true)
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
            <h1>Forgot your Password?</h1>
            <p>Enter your email to reset your password</p>
          </div>
          
          {success && (
            <div className="success-message">
              Password reset link has been sent to your email.
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
                placeholder="Enter your email"
                required
                autoFocus
              />
              
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-login"
            >
              {loading ? 'Sending...' : 'Reset Password'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>
              <Link to="/login" className="form-link">
                Back to login
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
      
      <ErrorModal 
        isOpen={showErrorModal}
        onClose={() => {
          setShowErrorModal(false)
          setError(null)
        }}
        title="Reset Failed"
        message={error || "Please check your email and try again."}
      />
    </div>
  )
} 