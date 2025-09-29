import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../common/Logo'
import { EyeIcon } from '../icons/EyeIcon'
import { ErrorModal } from '../common/ErrorModal'

type UserMetadata = {
  role: 'free' | 'paid'
}

type ErrorState = {
  message: string;
}

export const SignupForm = () => {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const validateInputs = (): boolean => {
    if (password !== confirmPassword) {
      setError({ message: 'Passwords do not match' })
      setShowErrorModal(true)
      return false
    }

    if (username.length < 3) {
      setError({ message: 'Username must be at least 3 characters long' })
      setShowErrorModal(true)
      return false
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError({ message: 'Username can only contain letters, numbers, underscores, and hyphens' })
      setShowErrorModal(true)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateInputs()) {
      return
    }
    
    setLoading(true)
    
    try {
      const metadata: UserMetadata = {
        role: 'free'
      }
      
      const { error: signUpError } = await signUp(email, password, metadata, username)
      
      if (signUpError) {
        if (signUpError.code === '23505') {
          setError({ message: 'Username already taken' })
        } else {
          setError({ message: signUpError.message })
        }
        setShowErrorModal(true)
      } else {
        // Only navigate on success
        navigate('/signup-success')
      }
    } catch (err: any) {
      setError({ message: 'An unexpected error occurred' })
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
            <h1>Create your account</h1>
            <p>Enter your details to get started</p>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())} // Convert to lowercase
                className="form-input"
                placeholder="Enter your username"
                required
                autoFocus
                minLength={3}
                pattern="[a-zA-Z0-9_-]+"
              />
            </div>

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
                  minLength={8}
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
                Confirm Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input password-input"
                  placeholder="Confirm your password"
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
                  Creating account...
                </span>
              ) : 'Sign Up'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="form-link">
                Login
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
        title="Registration Failed"
        message={error?.message || "Please check your information and try again."}
      />
    </div>
  )
} 